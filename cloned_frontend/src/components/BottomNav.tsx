import { NavLink as RouterNavLink } from 'react-router-dom';
import { MessageSquare, Columns3, BarChart3, Settings, CalendarClock, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: MessageSquare, label: 'Inbox' },
  { to: '/kanban', icon: Columns3, label: 'Funil' },
  { to: '/followup', icon: CalendarClock, label: 'Aviso' },
  { to: '/broadcast', icon: Send, label: 'Massa' },
  { to: '/dashboard', icon: BarChart3, label: 'Dash' },
  { to: '/settings', icon: Settings, label: 'Config' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-nav/95 border-t border-border/30 backdrop-blur-xl safe-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => (
          <RouterNavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-2xl transition-all duration-200 active:scale-95',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'flex items-center justify-center w-10 h-7 rounded-full transition-all',
                  isActive && 'bg-primary/15'
                )}>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={cn(
                  'text-[10px] leading-tight',
                  isActive ? 'font-bold' : 'font-medium'
                )}>{item.label}</span>
              </>
            )}
          </RouterNavLink>
        ))}
      </div>
    </nav>
  );
}
