import { createContext, useContext, useState, ReactNode } from 'react';

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
}

const EtiquetasContext = createContext<EtiquetasContextType | null>(null);

const defaultEtiquetas: Etiqueta[] = [
  { id: '1', nome: 'VIP', cor: 'hsl(262 83% 58%)' },
  { id: '2', nome: 'Novo', cor: 'hsl(199 89% 48%)' },
  { id: '3', nome: 'Recorrente', cor: 'hsl(142 71% 45%)' },
  { id: '4', nome: 'Atacado', cor: 'hsl(38 92% 50%)' },
  { id: '5', nome: 'Urgente', cor: 'hsl(0 84% 60%)' },
];

export function EtiquetasProvider({ children }: { children: ReactNode }) {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>(defaultEtiquetas);

  const addEtiqueta = (e: Omit<Etiqueta, 'id'>) => {
    setEtiquetas(prev => [...prev, { ...e, id: Date.now().toString() }]);
  };

  const removeEtiqueta = (id: string) => {
    setEtiquetas(prev => prev.filter(e => e.id !== id));
  };

  const updateEtiqueta = (id: string, data: Partial<Etiqueta>) => {
    setEtiquetas(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };

  return (
    <EtiquetasContext.Provider value={{ etiquetas, setEtiquetas, addEtiqueta, removeEtiqueta, updateEtiqueta }}>
      {children}
    </EtiquetasContext.Provider>
  );
}

export function useEtiquetas() {
  const ctx = useContext(EtiquetasContext);
  if (!ctx) throw new Error('useEtiquetas must be used within EtiquetasProvider');
  return ctx;
}
