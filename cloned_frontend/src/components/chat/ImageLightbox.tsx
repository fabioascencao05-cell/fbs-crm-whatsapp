import { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, onClose }: Props) {
  const [zoom, setZoom] = useState(1);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button onClick={e => { e.stopPropagation(); setZoom(z => Math.min(z + 0.5, 3)); }}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all">
          <ZoomIn size={18} />
        </button>
        <button onClick={e => { e.stopPropagation(); setZoom(z => Math.max(z - 0.5, 0.5)); }}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all">
          <ZoomOut size={18} />
        </button>
        <a href={src} download onClick={e => e.stopPropagation()} target="_blank" rel="noopener"
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all">
          <Download size={18} />
        </a>
        <button onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all">
          <X size={18} />
        </button>
      </div>
      <img
        src={src}
        alt={alt || 'Imagem'}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg transition-transform duration-200"
        style={{ transform: `scale(${zoom})` }}
        onClick={e => e.stopPropagation()}
        draggable={false}
      />
    </div>
  );
}
