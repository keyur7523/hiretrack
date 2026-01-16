import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { validateLoginForm } from '@/utils/validators';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateLoginForm(email, password);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setApiError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err: unknown) {
      setApiError((err as { message?: string })?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md bg-background rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-semibold text-center text-primary mb-6">HireTrack</h1>
        <h2 className="text-xl font-medium text-center mb-6">Sign In</h2>
        
        {apiError && <div className="mb-4 p-3 bg-danger-soft text-destructive rounded-md text-sm">{apiError}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
            {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-hover disabled:opacity-50">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm">
          <Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
        </div>
        <div className="mt-2 text-center text-sm">
          Don't have an account? <Link to="/register" className="text-primary hover:underline">Register</Link>
        </div>
      </div>
    </div>
  );
}
