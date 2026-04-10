import { useState, useEffect, useMemo } from 'react';
import { CalendarClock, Plus, Clock, CheckCircle2, AlertCircle, X, Tag, Search, Filter, Bell, Send, Trash2, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { fetchConversas, fetchRespostas } from '@/services/api';
import type { Conversa, RespostaRapida } from '@/types/crm';
import { useEtiquetas } from '@/contexts/EtiquetasContext';
import { toast } from 'sonner';

interface FollowUp {
  id: string;
  conversaId: string;
  conversaNome: string;
  conversaTelefone: string;
  tipo: string;
  data: string;
  hora: string;
  mensagem: string;
  tagAutomatica: string;
  status: 'agendado' | 'enviado' | 'cancelado';
  criadoEm: string;
}

const STATUS_STYLES = {
  agendado: {
    badge: 'bg-info/10 text-info border-info/25',
    icon: <Clock size={14} className="text-info" />,
    cardBorder: 'border-l-info',
  },
  enviado: {
    badge: 'bg-success/10 text-success border-success/25',
    icon: <CheckCircle2 size={14} className="text-success" />,
    cardBorder: 'border-l-success',
  },
  cancelado: {
    badge: 'bg-muted text-muted-foreground border-border',
    icon: <AlertCircle size={14} className="text-muted-foreground" />,
    cardBorder: 'border-l-muted-foreground',
  },
};

type FilterStatus = 'todos' | 'agendado' | 'enviado' | 'cancelado';

export default function FollowUpPage() {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [respostas, setRespostas] = useState<RespostaRapida[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [showNew, setShowNew] = useState(false);

  // New follow-up form
  const [pipelineFilter, setPipelineFilter] = useState('Todos');
  const [selectedConversa, setSelectedConversa] = useState('');
  const [fuTipo, setFuTipo] = useState('2');
  const [fuDate, setFuDate] = useState('');
  const [fuTime, setFuTime] = useState('');
  const [fuMsg, setFuMsg] = useState('');
  const [fuTag, setFuTag] = useState('Follow-up enviado');

  useEffect(() => {
    fetchConversas().then(setConversas);
    fetchRespostas().then(setRespostas);
  }, []);

  const filteredConversas = useMemo(() => {
    if (pipelineFilter === 'Todos') return conversas;
    return conversas.filter(c => c.status_kanban === pipelineFilter);
  }, [conversas, pipelineFilter]);

  const calcDateTime = () => {
    if (fuTipo === 'custom') return { data: fuDate, hora: fuTime };
    const now = new Date();
    now.setHours(now.getHours() + parseInt(fuTipo));
    return {
      data: now.toISOString().split('T')[0],
      hora: now.toTimeString().slice(0, 5),
    };
  };

  const handleCreate = () => {
    if (!selectedConversa) { toast.error('Selecione uma conversa'); return; }
    if (!fuMsg.trim()) { toast.error('Preencha a mensagem'); return; }
    if (fuTipo === 'custom' && (!fuDate || !fuTime)) { toast.error('Selecione data e hora'); return; }

    const conv = conversas.find(c => c.id === selectedConversa);
    const { data, hora } = calcDateTime();

    const newFu: FollowUp = {
      id: Date.now().toString(),
      conversaId: selectedConversa,
      conversaNome: conv?.nome ?? '',
      conversaTelefone: conv?.telefone ?? '',
      tipo: fuTipo,
      data,
      hora,
      mensagem: fuMsg,
      tagAutomatica: fuTag,
      status: 'agendado',
      criadoEm: new Date().toISOString(),
    };

    setFollowUps(prev => [newFu, ...prev]);
    toast.success('Follow-up agendado!', { description: `${conv?.nome} — ${data} às ${hora}` });

    setSelectedConversa('');
    setFuMsg('');
    setFuDate('');
    setFuTime('');
    setFuTipo('2');
    setFuTag('Follow-up enviado');
    setShowNew(false);
  };

  const cancelFu = (id: string) => {
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status: 'cancelado' as const } : f));
    toast.info('Follow-up cancelado');
  };

  const filtered = useMemo(() => {
    let list = followUps;
    if (filterStatus !== 'todos') list = list.filter(f => f.status === filterStatus);
    if (search) list = list.filter(f =>
      f.conversaNome.toLowerCase().includes(search.toLowerCase()) ||
      f.mensagem.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [followUps, filterStatus, search]);

  const counts = useMemo(() => ({
    total: followUps.length,
    agendado: followUps.filter(f => f.status === 'agendado').length,
    enviado: followUps.filter(f => f.status === 'enviado').length,
    cancelado: followUps.filter(f => f.status === 'cancelado').length,
  }), [followUps]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <CalendarClock size={20} className="text-primary" />
              Follow-up
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Gerencie agendamentos e acompanhamentos</p>
          </div>
          <Button
            size="sm"
            className="gap-1.5 rounded-xl shadow-sm"
            onClick={() => setShowNew(!showNew)}
          >
            <Plus size={14} />
            Novo Follow-up
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', count: counts.total, color: 'bg-secondary text-foreground' },
            { label: 'Agendados', count: counts.agendado, color: 'bg-info/10 text-info' },
            { label: 'Enviados', count: counts.enviado, color: 'bg-success/10 text-success' },
            { label: 'Cancelados', count: counts.cancelado, color: 'bg-muted text-muted-foreground' },
          ].map(s => (
            <div key={s.label} className={cn('rounded-xl px-3 py-2.5 text-center', s.color)}>
              <p className="text-lg font-bold">{s.count}</p>
              <p className="text-[10px] font-medium opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* New follow-up form */}
      {showNew && (
        <div className="border-b bg-card px-6 py-4 animate-fade-in">
          <div className="max-w-2xl space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Bell size={14} className="text-primary" /> Agendar novo follow-up
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">1. Filtrar etapa no funil</label>
                <select
                  value={pipelineFilter}
                  onChange={e => { setPipelineFilter(e.target.value); setSelectedConversa(''); }}
                  className="w-full text-xs border rounded-xl px-3 py-2.5 bg-secondary text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                >
                  {['Todos', 'Novos', 'Em Negociação', 'Aguardando Pagamento', 'Pedido Aprovado', 'Pedido Entregue'].map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">2. Escolher o cliente ({filteredConversas.length})</label>
                <select
                  value={selectedConversa}
                  onChange={e => setSelectedConversa(e.target.value)}
                  className="w-full text-xs border rounded-xl px-3 py-2.5 bg-secondary text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                >
                  <option value="">Clique para selecionar o cliente...</option>
                  {filteredConversas.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">3. Quando enviar?</label>
                <select
                  value={fuTipo}
                  onChange={e => setFuTipo(e.target.value)}
                  className="w-full text-xs border rounded-xl px-3 py-2.5 bg-secondary text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                >
                  <option value="2">Daqui a 2 horas</option>
                  <option value="12">Daqui a 12 horas</option>
                  <option value="24">Amanhã (24h)</option>
                  <option value="48">Em 2 dias</option>
                  <option value="custom">Escolher data/hora específica</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase text-primary">4. Após enviar, mudar para...</label>
                <select
                  value={fuTag}
                  onChange={e => setFuTag(e.target.value)}
                  className="w-full text-xs border border-primary/30 rounded-xl px-3 py-2.5 bg-primary/5 text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all font-bold"
                >
                  <option value="">Não mudar de etapa</option>
                  {['Novos', 'Em Negociação', 'Aguardando Pagamento', 'Pedido Aprovado', 'Pedido Entregue'].map(col => (
                    <option key={col} value={col}>Mover para: {col}</option>
                  ))}
                </select>
              </div>
            </div>

            {fuTipo === 'custom' && (
              <div className="flex gap-2 animate-in slide-in-from-top-2">
                <div className="flex-1">
                  <Input type="date" value={fuDate} onChange={e => setFuDate(e.target.value)} className="text-xs h-10 bg-secondary border-0 rounded-xl" />
                </div>
                <div className="flex-1">
                  <Input type="time" value={fuTime} onChange={e => setFuTime(e.target.value)} className="text-xs h-10 bg-secondary border-0 rounded-xl" />
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">5. Mensagem do Follow-up</label>
                <div className="flex items-center gap-2">
                   <Tag size={12} className="text-primary" />
                   <select
                    onChange={e => {
                      const r = respostas.find(res => res.id === e.target.value);
                      if (r) setFuMsg(r.texto);
                    }}
                    className="text-[10px] font-bold bg-primary/10 text-primary border-none rounded-lg px-2 py-1 cursor-pointer hover:bg-primary/20 transition-all focus:outline-none"
                  >
                    <option value="">Puxar resposta pronta...</option>
                    {respostas.map(r => (
                      <option key={r.id} value={r.id}>{r.atalho}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Textarea
                value={fuMsg}
                onChange={e => setFuMsg(e.target.value)}
                placeholder="Escreva a mensagem aqui ou escolha uma resposta pronta acima..."
                className="text-sm bg-secondary border-0 min-h-[120px] resize-none rounded-2xl p-4 focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block flex items-center gap-1">
                <Tag size={10} /> Etiqueta automática
              </label>
              <Input
                value={fuTag}
                onChange={e => setFuTag(e.target.value)}
                placeholder="Ex: Follow-up enviado"
                className="text-xs h-9 bg-secondary border-0"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="text-xs rounded-lg" onClick={() => setShowNew(false)}>
                Cancelar
              </Button>
              <Button size="sm" className="text-xs gap-1.5 rounded-lg" onClick={handleCreate}>
                <Send size={12} /> Agendar Follow-up
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-6 py-3 border-b bg-card/50 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar follow-ups..."
            className="pl-9 h-8 text-xs bg-secondary border-0 rounded-lg"
          />
        </div>
        <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
          {(['todos', 'agendado', 'enviado', 'cancelado'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'text-[11px] font-medium px-3 py-1.5 rounded-md transition-all capitalize',
                filterStatus === s
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Follow-up List */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {filtered.length > 0 ? (
          <div className="space-y-3 max-w-3xl">
            {filtered.map(fu => {
              const styles = STATUS_STYLES[fu.status];
              return (
                <div
                  key={fu.id}
                  className={cn(
                    'bg-card rounded-xl border border-l-[3px] p-4 transition-all hover:shadow-md',
                    styles.cardBorder,
                    fu.status === 'cancelado' && 'opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5">{styles.icon}</div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{fu.conversaNome}</span>
                          <span className="text-[10px] text-muted-foreground">{fu.conversaTelefone}</span>
                          <Badge variant="outline" className={cn('text-[9px] border font-semibold capitalize', styles.badge)}>
                            {fu.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock size={11} />
                          <span className="font-medium">{fu.data} às {fu.hora}</span>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed bg-secondary/50 rounded-lg p-2.5">
                          {fu.mensagem}
                        </p>
                        {fu.tagAutomatica && (
                          <div className="flex items-center gap-1.5">
                            <Tag size={10} className="text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">
                              Auto-tag: <span className="font-semibold text-primary">{fu.tagAutomatica}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {fu.status === 'agendado' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => cancelFu(fu.id)}
                      >
                        <X size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <CalendarClock size={28} className="text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium">Nenhum follow-up encontrado</p>
            <p className="text-xs">Agende mensagens de acompanhamento para seus clientes</p>
            <Button size="sm" variant="outline" className="text-xs gap-1.5 rounded-lg mt-2" onClick={() => setShowNew(true)}>
              <Plus size={12} /> Criar Follow-up
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
