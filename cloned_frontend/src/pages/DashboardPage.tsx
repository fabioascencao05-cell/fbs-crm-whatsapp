import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Users, Clock, CheckCircle, CalendarDays, Tag, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fetchConversas } from '@/services/api';
import type { Conversa } from '@/types/crm';
import { useEtiquetas } from '@/contexts/EtiquetasContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['hsl(349,78%,60%)', 'hsl(38,92%,50%)', 'hsl(145,63%,42%)', 'hsl(220,15%,70%)', 'hsl(262,83%,58%)', 'hsl(180,50%,40%)'];

export default function DashboardPage() {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const { etiquetas } = useEtiquetas();

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(weekAgo);
  const [dateTo, setDateTo] = useState(today);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Real-time polling every 5s
  useEffect(() => {
    fetchConversas().then(setConversas);
    const interval = setInterval(() => {
      fetchConversas().then(setConversas);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    let list = conversas;
    if (dateFrom) {
      const from = new Date(dateFrom);
      list = list.filter(c => new Date(c.atualizado_em) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      list = list.filter(c => new Date(c.atualizado_em) <= to);
    }
    if (selectedTags.length > 0) {
      list = list.filter(c => {
        const tags = c.tags ? c.tags.split(',').map(t => t.trim()) : [];
        return selectedTags.some(st => tags.includes(st));
      });
    }
    return list;
  }, [conversas, dateFrom, dateTo, selectedTags]);

  const totalConversas = filtered.length;
  const novos = filtered.filter(c => c.status_kanban === 'Novos').length;
  const faturamentoTotal = filtered.reduce((acc, c) => acc + (c.valor_conversa || 0), 0);
  const unread = filtered.reduce((s, c) => s + c.unreadCount, 0);

  // Dynamic pipeline columns for pie chart (Valores Financeiros)
  const pipelineNames = ['Novos', 'Em Negociação', 'Aguardando Pagamento', 'Pedido Aprovado', 'Pedido Entregue'];
  const pieData = pipelineNames.map(col => ({
    name: col,
    value: filtered.filter(c => c.status_kanban === col).reduce((acc, c) => acc + (c.valor_conversa || 0), 0),
  })).filter(d => d.value > 0);

  // Se não houver valores, usa contagem como fallback para o gráfico não ficar vazio
  const chartData = pieData.length > 0 ? pieData : pipelineNames.map(col => ({
    name: col,
    value: filtered.filter(c => c.status_kanban === col).length,
  }));

  const cards = [
    { title: 'Total Leads', value: totalConversas, icon: Users, color: 'text-primary' },
    { title: 'Etapa Novos', value: novos, icon: Users, color: 'text-info' },
  ];

  const tagCounts = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(c => {
      if (c.etiquetas) {
        c.etiquetas.forEach(et => {
          map[et.nome] = (map[et.nome] || 0) + 1;
        });
      }
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const barData = [
    { name: 'Seg', leads: 12 },
    { name: 'Ter', leads: 19 },
    { name: 'Qua', leads: 8 },
    { name: 'Qui', leads: 15 },
    { name: 'Sex', leads: 22 },
    { name: 'Sáb', leads: 5 },
    { name: 'Dom', leads: 3 },
  ];

  const toggleTag = (t: string) => {
    setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-card border rounded-xl px-3 py-1.5">
            <CalendarDays size={14} className="text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-7 text-xs border-0 bg-transparent p-0 w-[120px] focus-visible:ring-0" />
            <span className="text-xs text-muted-foreground">até</span>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-7 text-xs border-0 bg-transparent p-0 w-[120px] focus-visible:ring-0" />
          </div>
          {(selectedTags.length > 0 || dateFrom !== weekAgo || dateTo !== today) && (
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => { setDateFrom(weekAgo); setDateTo(today); setSelectedTags([]); }}>
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {etiquetas.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={13} className="text-muted-foreground" />
          {etiquetas.map(e => (
            <button
              key={e.id}
              onClick={() => toggleTag(e.nome)}
              className={cn(
                'inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all',
                selectedTags.includes(e.nome) ? 'ring-2 ring-offset-1 ring-offset-background scale-105' : 'opacity-70 hover:opacity-100'
              )}
              style={{
                backgroundColor: e.cor + '15',
                color: e.cor,
                borderColor: e.cor + '30',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.cor }} />
              {e.nome}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.title}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center ${c.color}`}>
                <c.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}

      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Distribuição do Funil (Financeiro + Volume)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={4}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Volume Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="leads" fill="hsl(349,78%,60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {tagCounts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Tag size={14} className="text-primary" /> Distribuição por Etiquetas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tagCounts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(262,83%,58%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
