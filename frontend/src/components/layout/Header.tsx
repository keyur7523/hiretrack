import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';

export function Header() {
  const { user, logout } = useAuth();
  const openCommandPalette = useUIStore((state) => state.openCommandPalette);
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);

  return (
    <header className={`fixed top-0 left-0 right-0 h-14 bg-background border-b border-border z-40 flex items-center px-4 transition-all ${isSidebarCollapsed ? 'lg:left-16' : 'lg:left-60'}`}>
      <div className="flex items-center gap-2 lg:hidden">
        <Link to="/app" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="HireTrack" className="w-8 h-8" />
          <span className="text-xl font-semibold text-primary">HireTrack</span>
        </Link>
      </div>

      <div className="hidden lg:flex items-center">
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground"
          onClick={openCommandPalette}
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search...
          <kbd className="ml-4 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        {user && (
          <>
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.email}
            </span>
            <button
              onClick={logout}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
