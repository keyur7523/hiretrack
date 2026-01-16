import { Link } from 'react-router-dom';

export function UnauthorizedPage() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-semibold mb-4">Access Denied</h1>
      <p className="text-muted-foreground mb-6">You don't have permission to access this page.</p>
      <Link to="/app" className="text-primary hover:underline">Go to Home</Link>
    </div>
  );
}
