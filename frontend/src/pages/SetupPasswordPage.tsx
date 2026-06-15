// src/pages/SetupPasswordPage.tsx
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../services/api';
import PasswordStrength from '../components/ui/PasswordStrength';
import { ShieldCheck, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

export default function SetupPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: { token: string; password: string }) => 
      authApi.setupPassword(data.token, data.password),
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to set password. The link may be expired.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (token) {
      mutation.mutate({ token, password });
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2rem] p-10 shadow-xl shadow-stone-200/50 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Setup Complete</h1>
            <p className="text-stone-500 mt-2">
              Your password has been set successfully. You can now access your university account.
            </p>
          </div>
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold hover:bg-stone-800 transition shadow-lg shadow-stone-900/10"
          >
            Go to Login
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2rem] p-10 shadow-xl shadow-stone-200/50 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Finalize Account</h1>
          <p className="text-sm text-stone-500">
            Welcome to the Research Portal. Please choose a strong password to secure your internal profile.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 text-center animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700 ml-1">New password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition"
              placeholder="••••••••"
            />
            <PasswordStrength password={password} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700 ml-1">Confirm password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
              className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {mutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Set Password & Finish'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-stone-400">
           By setting your password, you agree to the university's data protection policy and internal research guidelines.
        </p>
      </div>
    </div>
  );
}
