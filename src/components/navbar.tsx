import { Home, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const items = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border px-4 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(id)}
            className={`flex-col gap-1 h-auto py-2 ${
              currentPage === id || (currentPage === 'space' && id === 'home')
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}

