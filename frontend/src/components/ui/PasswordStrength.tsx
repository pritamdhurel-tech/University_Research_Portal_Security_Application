import { useMemo } from 'react';
import zxcvbn from 'zxcvbn';
import clsx from 'clsx';

interface Props {
  password: string;
  className?: string;
}

const LEVELS = [
  { label: 'Very weak',  color: 'bg-red-500',    text: 'text-red-600' },
  { label: 'Weak',       color: 'bg-orange-400',  text: 'text-orange-600' },
  { label: 'Fair',       color: 'bg-amber-400',   text: 'text-amber-600' },
  { label: 'Strong',     color: 'bg-green-400',   text: 'text-green-600' },
  { label: 'Very strong',color: 'bg-green-500',   text: 'text-green-700' },
];

// UK Cyber Essentials minimum requirements
const REQUIREMENTS = [
  { label: 'At least 8 characters',            test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter',                  test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter',                  test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number',                            test: (p: string) => /[0-9]/.test(p) },
  { label: 'Special character (!@#$%^&*...)',   test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function PasswordStrength({ password, className }: Props) {
  const result = useMemo(() => zxcvbn(password), [password]);
  const score = password.length === 0 ? -1 : result.score;
  const level = score >= 0 ? LEVELS[score] : null;

  const requirements = REQUIREMENTS.map(req => ({
    ...req,
    met: req.test(password),
  }));

  if (!password) return null;

  return (
    <div className={clsx('mt-3 space-y-3', className)}>
      {/* Strength bars */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={clsx(
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              score >= i && level ? level.color : 'bg-stone-200'
            )}
          />
        ))}
      </div>

      {/* Score label */}
      {level && (
        <div className={clsx('text-xs font-medium', level.text)}>
          {level.label}
          {result.feedback.warning && (
            <span className="text-stone-400 font-normal ml-2">— {result.feedback.warning}</span>
          )}
        </div>
      )}

      {/* Requirements checklist */}
      <ul className="space-y-1">
        {requirements.map((req) => (
          <li
            key={req.label}
            className={clsx(
              'flex items-center gap-2 text-xs transition-colors duration-200',
              req.met ? 'text-green-600' : 'text-stone-400'
            )}
          >
            <span className="text-xs">
              {req.met ? '✓' : '○'}
            </span>
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
