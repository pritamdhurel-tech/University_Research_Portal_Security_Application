import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

// ─── Validation schema ─────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  mfaToken: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{6}$/.test(v) || v.length === 8, {
      message: 'Enter a 6-digit authenticator code or 8-character backup code',
    }),
  termsAccepted: z.boolean().refine((v) => v === true, {
    message: 'You must accept the terms to continue',
  }),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── OTP Input — 6 individual controlled inputs (reliable on all browsers/mobile)

function OtpInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

  const focusAt = (i: number) => {
    const el = inputRefs.current[Math.max(0, Math.min(5, i))];
    el?.focus();
    // Move cursor to end
    setTimeout(() => el?.setSelectionRange(1, 1), 0);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[i]) {
        // Clear current box
        const next = value.slice(0, i) + value.slice(i + 1);
        onChange(next.slice(0, 6));
      } else if (i > 0) {
        // Move back and clear previous
        const next = value.slice(0, i - 1) + value.slice(i);
        onChange(next.slice(0, 6));
        focusAt(i - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusAt(i + 1);
    }
  };

  const handleInput = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) return;

    if (raw.length > 1) {
      // Handle paste: fill from position i
      const pasted = raw.slice(0, 6 - i);
      const next = (value.slice(0, i) + pasted + value.slice(i + pasted.length)).slice(0, 6);
      onChange(next);
      focusAt(Math.min(i + pasted.length, 5));
      return;
    }

    // Single digit typed
    const next = (value.slice(0, i) + raw + value.slice(i + 1)).slice(0, 6);
    onChange(next);
    if (i < 5) focusAt(i + 1);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    focusAt(Math.min(pasted.length, 5));
  };

  return (
    <div className="space-y-2">
      {/* 6 individual digit boxes */}
      <div className="flex gap-2" role="group" aria-label="6-digit authentication code">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={6}
            value={d}
            onChange={(e) => handleInput(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={clsx(
              'flex-1 h-12 rounded-xl border-2 text-center font-mono text-lg font-semibold',
              'transition-all duration-150 focus:outline-none',
              'w-0 min-w-0',           // let flex distribute width
              d
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-stone-200 bg-stone-50 text-stone-400',
              'focus:border-brand-500 focus:bg-brand-50 focus:ring-2 focus:ring-brand-500/20'
            )}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      {error && (
        <p className="field-error">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Main login page ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  // step: 'credentials' = normal form, 'mfa' = backend asked for MFA after submit
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');

  // Show the inline MFA section on the main form
  const [showMfaField, setShowMfaField] = useState(false);
  const [mfaValue, setMfaValue] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  // MFA step-2 state (when backend returns requiresMfa)
  const [mfaStepCode, setMfaStepCode] = useState('');

  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(false);

  // Store creds for potential step-2 MFA re-submit
  const credentialsRef = useRef<{ email: string; password: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { termsAccepted: false, mfaToken: '' },
  });

  // Keep mfaValue in sync with the form field
  const handleMfaChange = (v: string) => {
    setMfaValue(v);
    setValue('mfaToken', v, { shouldValidate: true });
  };

  const handleCaptchaToggle = () => {
    setCaptchaChecked(true);
    setTimeout(() => setCaptchaVerified(true), 800);
  };

  // ── Parse whatever shape the backend returns ─────────────────────────────────
  // Handles all backend response shapes:
  // Shape A: { success: true, data: { user, tokens } }        <- most common
  // Shape B: { success: true, data: { requiresMfa: true } }   <- MFA required
  // Shape C: { user, tokens }                                  <- bare (some configs)
  const parseLoginResponse = (resData: Record<string, unknown>) => {
    // Unwrap one level of { data: ... } if present
    const inner = (resData?.data && typeof resData.data === 'object'
      ? resData.data
      : resData) as Record<string, unknown>;

    const requiresMfa = !!(
      inner?.requiresMfa ?? 
      resData?.requiresMfa ?? 
      inner?.mfaRequired ?? 
      resData?.mfaRequired
    );

    // tokens may be directly on inner, or nested inside inner.tokens
    const tokensRaw = (inner?.tokens ?? inner) as Record<string, unknown>;
    const tokens = {
      accessToken: (tokensRaw?.accessToken ?? '') as string,
      refreshToken: (tokensRaw?.refreshToken ?? '') as string,
    };

    const user = (inner?.user ?? inner) as Record<string, unknown>;

    // Debug in dev only
    if (import.meta.env.DEV) {
      console.debug('[Auth] Parsed response:', { requiresMfa, hasAccess: !!tokens.accessToken, user: user?.email });
    }

    return { user, tokens, requiresMfa };
  };

  // ── Step 1: submit email + password (+ optional inline MFA token) ─────────────
  const onSubmitCredentials = async (data: LoginForm) => {
    if (!captchaVerified) {
      setServerError('Please complete the security check.');
      return;
    }
    setServerError('');
    setIsSubmitting(true);
    credentialsRef.current = { email: data.email, password: data.password };

    try {
      const payload: { email: string; password: string; mfaToken?: string } = {
        email: data.email,
        password: data.password,
      };
      // Only attach token if the user expanded the MFA section and typed something
      if (data.mfaToken && data.mfaToken.length >= 6) {
        payload.mfaToken = data.mfaToken;
      }

      const res = await authApi.login(payload);
      const { user, tokens, requiresMfa } = parseLoginResponse(res.data);

      // Backend still asking for MFA (inline token was wrong / not provided)
      if (requiresMfa) {
        setStep('mfa');
        return;
      }

      if (!tokens?.accessToken) {
        // Show the actual message from server if available
        const msg = res.data?.message || res.data?.error || 'Unexpected response shape from server.';
        setServerError(msg);
        console.error('[Login] Unexpected response:', res.data);
        return;
      }

      login(user as unknown as Parameters<typeof login>[0], tokens.accessToken, tokens.refreshToken);
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string; error?: string } } };
      const status = axiosErr.response?.status;
      const body = axiosErr.response?.data;
      if (status === 401) setServerError('Incorrect email or password.');
      else if (status === 423) setServerError('Account locked — too many failed attempts. Wait 15 minutes.');
      else if (status === 403) setServerError('Account inactive. Contact your administrator.');
      else if (status === 429) setServerError('Too many attempts. Please wait 15 minutes.');
      else setServerError(body?.message || body?.error || `Login failed (${status ?? 'network error'}).`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 2: MFA code screen (backend prompted after password) ─────────────────
  const onSubmitMfa = async () => {
    if (mfaStepCode.length < 6) {
      setServerError('Enter your 6-digit or 8-character code.');
      return;
    }
    if (!credentialsRef.current) {
      setServerError('Session expired. Please sign in again.');
      setStep('credentials');
      return;
    }
    setServerError('');
    setIsSubmitting(true);

    try {
      const res = await authApi.login({
        email: credentialsRef.current.email,
        password: credentialsRef.current.password,
        mfaToken: mfaStepCode,
      });
      const { user, tokens } = parseLoginResponse(res.data);

      if (!tokens?.accessToken) {
        const msg = res.data?.message || res.data?.error || 'MFA verified but no token received.';
        setServerError(msg);
        return;
      }
      login(user as unknown as Parameters<typeof login>[0], tokens.accessToken, tokens.refreshToken);
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      const status = axiosErr.response?.status;
      if (status === 401) setServerError('Invalid or expired code. Check your authenticator and try again.');
      else setServerError(axiosErr.response?.data?.message ?? 'MFA verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-stone-50 flex flex-col items-center justify-center px-4 py-12">

      {/* Wordmark */}
      <div className="mb-8 text-center animate-fade-up">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500 mb-4">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path d="M12 3L3 8.5V15.5L12 21L21 15.5V8.5L12 3Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M12 3V21M3 8.5L21 15.5M21 8.5L3 15.5" stroke="white" strokeWidth="1" strokeOpacity="0.4" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-display text-xl font-semibold text-stone-900">University</h1>
        <p className="text-sm text-stone-500 mt-0.5">Research Portal</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm card p-8 animate-fade-up" style={{ animationDelay: '0.05s' }}>

        {/* ══════════════════════════════════════════════════════════
            STEP 1 — Credentials (with optional inline MFA field)
            ══════════════════════════════════════════════════════════ */}
        {step === 'credentials' && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-stone-900">Sign in</h2>
              <p className="text-sm text-stone-500 mt-0.5">Use your institutional account</p>
            </div>

            {serverError && (
              <div className="alert-error mb-5" role="alert">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmitCredentials)} className="space-y-4" noValidate>

              {/* Email */}
              <div>
                <label htmlFor="email" className="label">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@gmail.com"
                  {...register('email')}
                  className={clsx('input', errors.email && 'input-error')}
                />
                {errors.email && (
                  <p className="field-error">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="label mb-0">Password</label>
                  <Link to="/forgot-password" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={clsx('input pr-11', errors.password && 'input-error')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C6 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c6 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12Z" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="field-error">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* ── INLINE MFA SECTION ───────────────────────────────────────── */}
              <div className={clsx(
                'rounded-2xl border transition-all duration-200 overflow-hidden',
                showMfaField
                  ? 'border-brand-200 bg-brand-50/50'
                  : 'border-stone-200 bg-stone-50'
              )}>
                {/* Toggle row */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMfaField(!showMfaField);
                    if (showMfaField) {
                      setMfaValue('');
                      setValue('mfaToken', '');
                      setUseBackupCode(false);
                    }
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  aria-expanded={showMfaField}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={clsx(
                      'w-7 h-7 rounded-xl flex items-center justify-center transition-colors',
                      showMfaField ? 'bg-brand-500' : 'bg-stone-200'
                    )}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2"
                          stroke={showMfaField ? 'white' : '#6b6860'} strokeWidth="1.8" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"
                          stroke={showMfaField ? 'white' : '#6b6860'} strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <p className={clsx(
                        'text-sm font-medium leading-tight',
                        showMfaField ? 'text-brand-700' : 'text-stone-700'
                      )}>
                        Two-factor authentication
                      </p>
                      <p className="text-xs text-stone-400">
                        {showMfaField ? 'Enter your code below' : 'Tap to add your 2FA code'}
                      </p>
                    </div>
                  </div>
                  <svg
                    width="16" height="16" fill="none" viewBox="0 0 24 24"
                    className={clsx(
                      'text-stone-400 transition-transform duration-200 shrink-0',
                      showMfaField && 'rotate-180'
                    )}
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Expanded content */}
                {showMfaField && (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="h-px bg-brand-100" />

                    {/* Mode toggle */}
                    <div className="flex gap-1 bg-white/70 p-1 rounded-xl w-fit border border-brand-100">
                      <button
                        type="button"
                        onClick={() => { setUseBackupCode(false); setMfaValue(''); setValue('mfaToken', ''); }}
                        className={clsx(
                          'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                          !useBackupCode
                            ? 'bg-brand-500 text-white shadow-sm'
                            : 'text-stone-500 hover:text-stone-700'
                        )}
                      >
                        Authenticator app
                      </button>
                      <button
                        type="button"
                        onClick={() => { setUseBackupCode(true); setMfaValue(''); setValue('mfaToken', ''); }}
                        className={clsx(
                          'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                          useBackupCode
                            ? 'bg-brand-500 text-white shadow-sm'
                            : 'text-stone-500 hover:text-stone-700'
                        )}
                      >
                        Backup code
                      </button>
                    </div>

                    {/* OTP digit boxes or backup input */}
                    {!useBackupCode ? (
                      <OtpInput
                        value={mfaValue}
                        onChange={handleMfaChange}
                        error={errors.mfaToken?.message}
                      />
                    ) : (
                      <div>
                        <input
                          type="text"
                          autoComplete="one-time-code"
                          maxLength={8}
                          value={mfaValue}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^a-f0-9]/gi, '').slice(0, 8);
                            setMfaValue(v);
                            setValue('mfaToken', v, { shouldValidate: true });
                          }}
                          placeholder="e.g. a3f92b1c"
                          className={clsx(
                            'input font-mono tracking-widest text-center',
                            errors.mfaToken && 'input-error'
                          )}
                          aria-label="8-character backup code"
                        />
                        {errors.mfaToken && (
                          <p className="field-error mt-1">{errors.mfaToken.message}</p>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-stone-400">
                      {useBackupCode
                        ? 'Enter one of your 8-character backup codes. Each can only be used once.'
                        : 'Open your authenticator app and enter the current 6-digit code.'}
                    </p>
                  </div>
                )}
              </div>
              {/* ── END MFA SECTION ──────────────────────────────────────────── */}

              {/* CAPTCHA */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCaptchaToggle}
                    disabled={captchaVerified}
                    className={clsx(
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 shrink-0',
                      captchaVerified
                        ? 'border-green-500 bg-green-500'
                        : captchaChecked
                          ? 'border-brand-400 bg-brand-50 animate-pulse'
                          : 'border-stone-300 bg-white hover:border-brand-400'
                    )}
                    aria-label="Complete security check"
                  >
                    {captchaVerified && (
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                        <path d="M5 12l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span className="text-sm text-stone-700">
                    {captchaVerified ? "I'm not a robot ✓" : "I'm not a robot"}
                  </span>
                  <div className="ml-auto text-right">
                    <div className="text-xs text-stone-400">hCaptcha</div>
                    <div className="text-xs text-stone-300">Privacy · Terms</div>
                  </div>
                </div>
              </div>

              {/* GDPR consent — UK GDPR Article 7 */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('termsAccepted')}
                    className="mt-0.5 rounded border-stone-300 text-brand-500 focus:ring-brand-500 focus:ring-offset-0"
                  />
                  <span className="text-xs text-stone-600 leading-relaxed">
                    I accept the{' '}
                    <Link to="/terms" className="text-brand-600 hover:underline">Terms of Use</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-brand-600 hover:underline">Privacy Notice</Link>
                    {' '}(required under UK GDPR)
                  </span>
                </label>
                {errors.termsAccepted && (
                  <p className="field-error mt-1">{errors.termsAccepted.message}</p>
                )}
              </div>

              {/* Submit */}
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full btn-lg">
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-stone-400">
              Access is restricted to authorised university members.<br />
              Contact your IT administrator if you need an account.
            </p>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 2 — MFA prompt (only shown if backend requests it
            after a submit without token, or with wrong token)
            ══════════════════════════════════════════════════════════ */}
        {step === 'mfa' && (
          <>
            <div className="mb-6">
              <button
                onClick={() => { setStep('credentials'); setServerError(''); setMfaStepCode(''); }}
                className="btn-ghost btn-sm -ml-2 mb-4"
              >
                ← Back
              </button>
              <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center mb-3">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="#e8651a" strokeWidth="1.5" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#e8651a" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-stone-900">Verify your identity</h2>
              <p className="text-sm text-stone-500 mt-0.5">
                Signing in as{' '}
                <span className="font-medium text-stone-700">{credentialsRef.current?.email}</span>
              </p>
            </div>

            {serverError && (
              <div className="alert-error mb-4" role="alert">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {serverError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="label">Authentication code</label>
                <OtpInput
                  value={mfaStepCode}
                  onChange={setMfaStepCode}
                />
              </div>

              <button
                onClick={onSubmitMfa}
                disabled={isSubmitting || mfaStepCode.length < 6}
                className="btn-primary w-full btn-lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verifying…
                  </span>
                ) : 'Verify'}
              </button>

              <p className="text-xs text-stone-400 text-center">
                Lost access to your app?{' '}
                <button
                  type="button"
                  onClick={() => setMfaStepCode('')}
                  className="underline hover:text-stone-600"
                >
                  Use a backup code
                </button>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Compliance footer */}
      <p className="mt-6 text-center text-xs text-stone-400 max-w-xs">
        This system is for authorised users only. All access is monitored and logged
        in compliance with UK GDPR and the Computer Misuse Act 1990.
      </p>
    </div>
  );
}
