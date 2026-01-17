import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b border-border z-50 flex items-center px-4 lg:pl-[calc(var(--sidebar-width)+1rem)]">
      <div className="flex items-center gap-2 lg:hidden">
        <Link to="/app" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="HireTrack" className="w-8 h-8" />
          <span className="text-xl font-semibold text-primary">HireTrack</span>
        </Link>
      </div>

      <div className="ml-auto flex items-center gap-4">
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
