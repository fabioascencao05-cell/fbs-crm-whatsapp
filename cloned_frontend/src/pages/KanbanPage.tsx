import { useState, useEffect } from 'react';
import { GripVertical, Tag, CalendarClock, Settings2, MessageCircle, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { fetchConversas, mudarKanban } from '@/services/api';
import type { Conversa } from '@/types/crm';
import { useNavigate } from 'react-router-dom';

function formatWhatsAppDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function KanbanPage() {
  const navigate = useNavigate();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  useEffect(() => { fetchConversas().then(setConversas); }, []);

  const columns = [
    { name: 'Novos', color: 'hsl(210,80%,55%)' },
    { name: 'Em Negociação', color: 'hsl(38,92%,50%)' },
    { name: 'Aguardando Pagamento', color: 'hsl(145,63%,42%)' },
    { name: 'Pedido Aprovado', color: 'hsl(262,83%,58%)' },
    { name: 'Pedido Entregue', color: 'hsl(220,15%,70%)' },
  ];

  const getColumnData = (colName: string) => {
    const items = conversas.filter(c => c.status_kanban === colName);
    const totalValue = items.reduce((acc, c) => acc + (c.valor_conversa || 0), 0);
    return { items, totalValue };
  };

  const handleDrop = async (col: string) => {
    if (!dragItem) return;
    await mudarKanban(dragItem, col);
    setConversas(prev => prev.map(c => c.id === dragItem ? { ...c, status_kanban: col } : c));
    setDragItem(null);
    setDragOverCol(null);
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 bg-background/50 overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" /> Funil de Vendas
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Gestão visual do faturamento potencial.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Faturamento Total</p>
          <p className="text-lg font-bold text-primary">
            {conversas.reduce((acc, c) => acc + (c.valor_conversa || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-6 no-scrollbar">
        {columns.map(col => {
          const { items, totalValue } = getColumnData(col.name);
          return (
            <div
              key={col.name}
              className={cn(
                'min-w-[300px] w-80 flex flex-col rounded-2xl shrink-0 transition-all border border-border/50',
                dragOverCol === col.name ? 'bg-primary/5 ring-2 ring-primary/20 scale-[1.01]' : 'bg-secondary/30'
              )}
              onDragOver={e => { e.preventDefault(); setDragOverCol(col.name); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={() => handleDrop(col.name)}
            >
              <div className="px-4 py-4 border-b border-border/10 bg-card/30 rounded-t-2xl">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-[10px] font-bold border px-2 py-0.5 uppercase tracking-wide" style={{ backgroundColor: col.color + '15', color: col.color, borderColor: col.color + '30' }}>
                    <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: col.color }} />
                    {col.name}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-bold h-5 px-2">{items.length}</Badge>
                </div>
                <p className="text-sm font-extrabold text-foreground/90">{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </div>

              <div className="flex-1 px-3 py-3 space-y-3 overflow-y-auto scrollbar-thin">
                {items.map(c => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => setDragItem(c.id)}
                    className={cn(
                      'bg-card rounded-xl p-4 shadow-sm border border-border/50 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-primary/30 transition-all group',
                      dragItem === c.id ? 'opacity-30 scale-95' : 'opacity-100'
                    )}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">{c.nome}</p>
                          <p className="text-[10px] text-muted-foreground truncate font-medium mt-0.5">{c.telefone}</p>
                        </div>
                        {c.valor_conversa > 0 && (
                          <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded-lg shrink-0">
                            {c.valor_conversa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        )}
                      </div>
                      {c.ultima_mensagem && <p className="text-[11px] text-muted-foreground line-clamp-2 bg-secondary/30 p-2 rounded-lg italic">"{c.ultima_mensagem}"</p>}
                      {c.etiquetas && c.etiquetas.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {c.etiquetas.slice(0, 3).map(tag => (
                            <span key={tag.id} className="text-[9px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1" style={{ backgroundColor: tag.cor + '15', color: tag.cor, borderColor: tag.cor + '30' }}>
                              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: tag.cor }} />
                              {tag.nome}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                          <CalendarClock size={12} className="text-muted-foreground/60" />
                          {formatWhatsAppDate(c.atualizado_em)}
                        </div>
                        <button onClick={() => navigate(`/?chat=${c.id}`)} className="flex items-center gap-1 text-[10px] font-bold text-primary hover:opacity-80 transition-opacity">
                          <MessageCircle size={12} /> Chat
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-border/20 rounded-2xl text-muted-foreground/30">
                    <Users size={20} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Vazio</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
