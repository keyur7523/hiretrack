import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { ToastContainer } from '@/components/ui/ToastContainer';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      
      <main className="pt-14 pb-14 lg:pb-0 lg:pl-60">
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>

      <MobileNav />
      <ToastContainer />
    </div>
  );
}
