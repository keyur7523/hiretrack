import { Link } from 'react-router-dom';

export function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md bg-background rounded-lg shadow-md p-8 text-center">
        <h1 className="text-2xl font-semibold text-primary mb-6">HireTrack</h1>
        <h2 className="text-xl font-medium mb-4">Reset Password</h2>
        <p className="text-muted-foreground mb-6">Password reset functionality is not available in this demo.</p>
        <Link to="/login" className="text-primary hover:underline">Back to Login</Link>
      </div>
    </div>
  );
}
