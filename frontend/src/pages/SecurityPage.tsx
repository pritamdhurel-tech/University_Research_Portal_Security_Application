// src/pages/SecurityPage.tsx
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Check, X, Copy, Loader2, KeyRound, Smartphone } from 'lucide-react';
import { mfaApi, authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import PasswordStrength from '../components/ui/PasswordStrength';
import clsx from 'clsx';

export default function SecurityPage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  // General state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ─── MFA STATE ─────────────────────────────────────────────────────────────
  const [setupStep, setSetupStep] = useState<'idle' | 'qr' | 'verify'>('idle');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  
  // Disable MFA state
  const [disablePassword, setDisablePassword] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [showDisableModal, setShowDisableModal] = useState(false);

  // ─── PASSWORD CHANGE STATE ────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Load MFA status
  const { data: status, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['mfa-status'],
    queryFn: async () => {
      const res = await mfaApi.status();
      return res.data?.data ?? res.data;
    },
  });

  // Start MFA setup
  const handleStartSetup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await mfaApi.setup();
      const payload = response.data?.data ?? response.data;

      // Ported robust QR detection from MfaSetupPage
      const qr = payload?.qrCodeDataUrl || payload?.qrCode || payload?.qr || payload?.dataUrl;
      const sec = payload?.secret || payload?.base32 || payload?.uri;

      setQrCode(qr);
      setSecret(sec);
      setSetupStep('qr');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to setup MFA');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify MFA setup
  const handleVerifySetup = async () => {
    if (verificationCode.length !== 6) {
      setError('Enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await mfaApi.verifySetup(verificationCode);
      const payload = response.data?.data ?? response.data;

      setBackupCodes(payload.backupCodes || payload.backup_codes || []);
      setSuccess('Two-factor authentication enabled successfully!');
      setSetupStep('idle');
      setVerificationCode('');
      
      if (user) setUser({ ...user, isMfaEnabled: true });
      queryClient.invalidateQueries({ queryKey: ['mfa-status'] });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Disable MFA
  const handleDisableMfa = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await mfaApi.disable(disablePassword, disableToken);
      setSuccess('Two-factor authentication disabled successfully');
      setShowDisableModal(false);
      setDisablePassword('');
      setDisableToken('');
      if (user) setUser({ ...user, isMfaEnabled: false });
      queryClient.invalidateQueries({ queryKey: ['mfa-status'] });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to disable MFA');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── PASSWORD LOGIC ──────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsChangingPassword(true);
      setError(null);
      await authApi.changePassword({ currentPassword, newPassword });
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Security Settings</h1>
        <p className="text-gray-500">Manage your account protection and authentication</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start">
          <X className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-start">
          <Check className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ── MFA Section ── */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-brand-50 rounded-2xl">
                <Smartphone className="w-6 h-6 text-brand-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-stone-900">Two-factor authentication</h2>
                <p className="text-sm text-stone-500 mt-1">
                  Add an extra layer of security using an authenticator app.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl mb-6">
              <div>
                <span className={clsx(
                  "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
                  status?.isEnabled ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                )}>
                  {status?.isEnabled ? 'Protected' : 'Unprotected'}
                </span>
                <p className="text-xs text-stone-400 mt-2">
                  {status?.isEnabled ? 'MFA is active' : 'MFA is currently disabled'}
                </p>
              </div>
              
              {!status?.isEnabled ? (
                <button
                  onClick={handleStartSetup}
                  disabled={isLoading || setupStep !== 'idle'}
                  className="px-4 py-2 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition disabled:opacity-50"
                >
                  Enable 2FA
                </button>
              ) : (
                <button
                  onClick={() => setShowDisableModal(true)}
                  className="px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-xl transition"
                >
                  Disable 2FA
                </button>
              )}
            </div>

            {/* Setup view (merged) */}
            {setupStep === 'qr' && qrCode && (
              <div className="space-y-6 pt-6 border-t border-stone-100">
                <div className="flex justify-center">
                  <div className="p-4 bg-white border-2 border-stone-100 rounded-3xl">
                    <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                  </div>
                </div>

                <div className="bg-stone-50 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-stone-500 uppercase mb-2">Manual setup key</p>
                  <div className="flex items-center justify-between">
                    <code className="text-xs font-mono text-stone-900 break-all">{secret}</code>
                    <button onClick={() => copyToClipboard(secret!)} className="text-stone-400 hover:text-stone-600">
                      <Copy className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-stone-700">Enter 6-digit code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                  />
                  <button
                    onClick={handleVerifySetup}
                    disabled={isLoading || verificationCode.length !== 6}
                    className="w-full py-3 bg-stone-900 text-white rounded-2xl font-medium hover:bg-stone-800 transition disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying...' : 'Verify and Activate'}
                  </button>
                </div>
              </div>
            )}

            {/* Backup codes view */}
            {backupCodes.length > 0 && setupStep === 'idle' && (
              <div className="mt-6 pt-6 border-t border-stone-100 space-y-4">
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-2xl">
                   <Shield className="w-4 h-4 shrink-0" />
                   <p className="text-xs font-medium">Save these backup codes in a safe place!</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-stone-50 border border-stone-100 rounded-xl px-3 py-2 font-mono text-xs text-stone-600">
                      {code}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                  className="w-full py-2 text-sm font-medium text-stone-500 hover:text-stone-700"
                >
                  Copy all backup codes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Password Section ── */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-amber-50 rounded-2xl">
                <KeyRound className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-stone-900">Change password</h2>
                <p className="text-sm text-stone-500 mt-1">
                  Ensure your account is using a long, random password.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Current password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">New password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition"
                  placeholder="••••••••"
                />
                <PasswordStrength password={newPassword} />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Confirm new password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword || !newPassword || newPassword !== confirmPassword}
                className="w-full py-3 bg-stone-900 text-white rounded-2xl font-medium hover:bg-stone-800 transition disabled:opacity-50 mt-4"
              >
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Disable MFA Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-stone-900">Disable 2FA?</h3>
              <p className="text-sm text-stone-500 mt-1">
                Your account will be less secure. Enter your password and token to confirm.
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className="w-full px-4 py-3 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Account password"
              />
              <input
                type="text"
                maxLength={6}
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value)}
                className="w-full px-4 py-3 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 text-center font-mono tracking-widest"
                placeholder="000000"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDisableModal(false)}
                className="flex-1 py-3 text-stone-600 font-medium hover:bg-stone-50 rounded-2xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDisableMfa}
                disabled={isLoading || !disablePassword || disableToken.length < 6}
                className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {isLoading ? 'Disabling...' : 'Confirm Disable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}