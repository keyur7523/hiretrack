import { useAuth } from '@/auth/useAuth';
import { PageContainer } from '@/components/layout/PageContainer';

export function AccountPage() {
  const { user, logout } = useAuth();
  return (
    <PageContainer title="Account">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md">
        <div className="space-y-4">
          <div><span className="text-sm text-muted-foreground">Email</span><p className="font-medium">{user?.email}</p></div>
          <div><span className="text-sm text-muted-foreground">Role</span><p className="font-medium capitalize">{user?.role}</p></div>
          <button onClick={logout} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md font-medium hover:opacity-90">Logout</button>
        </div>
      </div>
    </PageContainer>
  );
}
