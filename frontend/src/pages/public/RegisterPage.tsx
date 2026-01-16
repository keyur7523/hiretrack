import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { validateRegisterForm } from '@/utils/validators';
import type { UserRole } from '@/types';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('applicant');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateRegisterForm(email, password, confirmPassword, role);
    if (!validation.isValid) { setErrors(validation.errors); return; }
    setErrors({}); setApiError(''); setIsLoading(true);
    try {
      await register(email, password, role);
      navigate('/login');
    } catch (err: unknown) {
      setApiError((err as { message?: string })?.message || 'Registration failed');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md bg-background rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-semibold text-center text-primary mb-6">HireTrack</h1>
        <h2 className="text-xl font-medium text-center mb-6">Create Account</h2>
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
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
            {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">I am a...</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={role === 'applicant'} onChange={() => setRole('applicant')} className="accent-primary" />
                <span>Job Seeker</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={role === 'employer'} onChange={() => setRole('employer')} className="accent-primary" />
                <span>Employer</span>
              </label>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-hover disabled:opacity-50">
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm">Already have an account? <Link to="/login" className="text-primary hover:underline">Sign In</Link></div>
      </div>
    </div>
  );
}
