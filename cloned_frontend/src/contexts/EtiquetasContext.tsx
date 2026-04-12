import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Etiqueta {
  id: string;
  nome: string;
  cor: string;
  followup_texto?: string;
  followup_horas?: number;
}

interface EtiquetasContextType {
  etiquetas: Etiqueta[];
  setEtiquetas: React.Dispatch<React.SetStateAction<Etiqueta[]>>;
  addEtiqueta: (e: Omit<Etiqueta, 'id'>) => void;
  removeEtiqueta: (id: string) => void;
  updateEtiqueta: (id: string, data: Partial<Etiqueta>) => void;
  loading: boolean;
}

const EtiquetasContext = createContext<EtiquetasContextType | null>(null);

export function EtiquetasProvider({ children }: { children: ReactNode }) {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEtiquetas = async () => {
    try {
      const res = await fetch('/api/etiquetas');
      const data = await res.json();
      setEtiquetas(data);
    } catch (err) {
      console.error('Erro ao carregar etiquetas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEtiquetas();
  }, []);

  const addEtiqueta = async (e: Omit<Etiqueta, 'id'>) => {
    try {
      const res = await fetch('/api/etiquetas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(e)
      });
      const nova = await res.json();
      setEtiquetas(prev => [...prev, nova]);
    } catch (err) {
       console.error('Erro ao adicionar etiqueta:', err);
    }
  };

  const removeEtiqueta = async (id: string) => {
    try {
      await fetch(`/api/etiquetas/${id}`, { method: 'DELETE' });
      setEtiquetas(prev => prev.filter(e => String(e.id) !== String(id)));
    } catch (err) {
      console.error('Erro ao remover etiqueta:', err);
    }
  };

  const updateEtiqueta = async (id: string, data: Partial<Etiqueta>) => {
    try {
      const res = await fetch(`/api/etiquetas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const atualizada = await res.json();
      setEtiquetas(prev => prev.map(e => String(e.id) === String(id) ? atualizada : e));
    } catch (err) {
      console.error('Erro ao atualizar etiqueta:', err);
    }
  };

  return (
    <EtiquetasContext.Provider value={{ etiquetas, setEtiquetas, addEtiqueta, removeEtiqueta, updateEtiqueta, loading }}>
      {children}
    </EtiquetasContext.Provider>
  );
}

export function useEtiquetas() {
  const ctx = useContext(EtiquetasContext);
  if (!ctx) throw new Error('useEtiquetas must be used within EtiquetasProvider');
  return ctx;
}
