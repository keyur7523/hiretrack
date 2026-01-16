import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">404</h1>
        <p className="text-muted-foreground mb-6">Page not found</p>
        <Link to="/" className="text-primary hover:underline">Go Home</Link>
      </div>
    </div>
  );
}
