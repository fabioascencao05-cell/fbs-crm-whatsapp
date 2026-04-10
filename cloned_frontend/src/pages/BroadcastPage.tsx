import { useState, useEffect, useMemo } from 'react';
import { Send, Users, Filter, CheckCircle2, AlertCircle, Loader2, MessageSquare, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { fetchConversas, fetchRespostas, enviarBroadcast } from '@/services/api';
import type { Conversa, RespostaRapida } from '@/types/crm';
import { toast } from 'sonner';

export default function BroadcastPage() {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [respostas, setRespostas] = useState<RespostaRapida[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState('Todos');
  const [selectedTag, setSelectedTag] = useState('Todas');
  const [mensagem, setMensagem] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchConversas().then(setConversas);
    fetchRespostas().then(setRespostas);
  }, []);

  const tagsDisponiveis = useMemo(() => {
    const ts = new Set<string>();
    conversas.forEach(c => c.etiquetas?.forEach(e => ts.add(e.nome)));
    return ['Todas', ...Array.from(ts)];
  }, [conversas]);

  const alvos = useMemo(() => {
    let list = conversas;
    if (selectedPipeline !== 'Todos') {
      list = list.filter(c => c.status_kanban === selectedPipeline);
    }
    if (selectedTag !== 'Todas') {
      list = list.filter(c => c.etiquetas?.some(e => e.nome === selectedTag));
    }
    return list;
  }, [conversas, selectedPipeline, selectedTag]);

  const handleSend = async () => {
    if (alvos.length === 0) return toast.error('Nenhum cliente selecionado');
    if (!mensagem.trim()) return toast.error('Digite a mensagem');

    setIsSending(true);
    try {
      const res = await enviarBroadcast(alvos.map(a => a.id), mensagem) as { message: string };
      toast.success(res.message);
      setMensagem('');
    } catch (err) {
      toast.error('Erro ao iniciar disparo');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background p-6 overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Send className="text-primary" /> Central de Transmissão
          </h1>
          <p className="text-sm text-muted-foreground">Envie mensagens em massa para seus clientes com segurança.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Configuração */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-card rounded-2xl border p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                <Filter size={16} className="text-primary" /> 1. Definir Público do Disparo
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Filtro por Etapa</label>
                  <select
                    value={selectedPipeline}
                    onChange={e => setSelectedPipeline(e.target.value)}
                    className="w-full text-xs border rounded-xl px-3 py-2.5 bg-secondary text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  >
                    <option value="Todos">Todas as etapas do funil</option>
                    {['Novos', 'Em Negociação', 'Aguardando Pagamento', 'Pedido Aprovado', 'Pedido Entregue'].map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Filtro por Etiqueta</label>
                  <select
                    value={selectedTag}
                    onChange={e => setSelectedTag(e.target.value)}
                    className="w-full text-xs border rounded-xl px-3 py-2.5 bg-secondary text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  >
                    <option value="Todas">Todas as etiquetas estratégicas</option>
                    {tagsDisponiveis.filter(t => t !== 'Todas').map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 space-y-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                     <MessageSquare size={16} /> 2. O que vamos enviar?
                   </div>
                   <div className="flex gap-2 items-center">
                    <Tag size={12} className="text-primary" />
                    <select
                      onChange={e => {
                        const r = respostas.find(res => res.id === e.target.value);
                        if (r) setMensagem(r.texto);
                      }}
                      className="text-[10px] font-bold bg-primary/10 text-primary border-none rounded-lg px-2 py-1 cursor-pointer hover:bg-primary/20 transition-all focus:outline-none"
                    >
                      <option value="">PUXAR MENSAGEM PRONTA...</option>
                      {respostas.map(r => (
                        <option key={r.id} value={r.id}>{r.atalho}</option>
                      ))}
                    </select>
                   </div>
                </div>
                
                <Textarea
                  placeholder="Olá! Temos uma oferta especial para você hoje..."
                  className="min-h-[160px] text-sm bg-secondary border-0 rounded-2xl resize-none p-4 focus:ring-2 focus:ring-primary transition-all"
                  value={mensagem}
                  onChange={e => setMensagem(e.target.value)}
                />

                <div className="bg-secondary/30 rounded-xl p-3 flex gap-3 text-[11px] text-muted-foreground">
                   <AlertCircle size={14} className="shrink-0 text-amber-500" />
                   <p>O sistema enviará mensagens uma por uma com intervalos aleatórios de 3 a 5 segundos para proteger seu número.</p>
                </div>

                <Button 
                  className="w-full h-12 rounded-2xl text-sm font-bold gap-2 shadow-lg shadow-primary/20"
                  disabled={isSending || alvos.length === 0}
                  onClick={handleSend}
                >
                  {isSending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  {isSending ? 'Enviando disparo...' : `Disparar para ${alvos.length} clientes`}
                </Button>
              </div>
            </div>
          </div>

          {/* Resumo lateral */}
          <div className="space-y-4">
             <div className="bg-card rounded-2xl border p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                  <Users size={16} className="text-primary" /> Resumo do Grupo
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-muted-foreground">Selecionados:</span>
                     <span className="font-bold text-foreground">{alvos.length}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-muted-foreground">Público Estimado:</span>
                     <Badge variant="secondary" className="font-bold">WhatsApp Direto</Badge>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-muted-foreground">Risco de Ban:</span>
                     <span className="text-success font-bold flex items-center gap-1">Baixo <CheckCircle2 size={10} /></span>
                   </div>
                </div>
             </div>

             <div className="bg-primary/5 rounded-2xl border border-primary/10 p-5 space-y-3">
                <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                  Dica da Natália
                </h4>
                <p className="text-[11px] leading-relaxed text-foreground/80">
                  "Use o Envio em Massa para avisar sobre promoções rápidas ou novidades. Evite mandar mensagens muito longas e tente sempre ser o mais pessoal possível."
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
