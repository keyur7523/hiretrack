import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { CommandPalette } from '@/components/CommandPalette';
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useUIStore } from '@/stores/uiStore';

export function AppLayout() {
  useKeyboardShortcuts();
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className={`pt-14 pb-14 lg:pb-0 transition-all ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-60'}`}>
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>

      <MobileNav />
      <CommandPalette />
      <KeyboardShortcutsHelp />
    </div>
  );
}
