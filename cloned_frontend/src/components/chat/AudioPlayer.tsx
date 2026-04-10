import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  src: string;
  className?: string;
}

export function AudioPlayer({ src, className }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => { setPlaying(false); setProgress(0); };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); } else { audio.play(); }
    setPlaying(!playing);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * duration;
  };

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className={cn('flex items-center gap-2.5 min-w-[180px] max-w-[260px]', className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={toggle}
        className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform"
      >
        {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-2 rounded-full bg-muted cursor-pointer relative overflow-hidden" onClick={seek}>
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary/70 transition-[width] duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">{fmt(progress)}</span>
          <span className="text-[10px] text-muted-foreground">{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}
