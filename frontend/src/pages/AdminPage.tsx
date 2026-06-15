import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { RoleBadge, DepartmentBadge } from '../components/ui/Badges';
import type { PendingUser, Role, Department, ClearanceLevel } from '../types';
import clsx from 'clsx';

// ─── Schema ────────────────────────────────────────────────────────────────────

const createUserSchema = z.object({
  firstName: z.string().min(1, 'Required').max(50),
  lastName: z.string().min(1, 'Required').max(50),
  email: z
    .string()
    .email('Valid email required')
    .refine((v) => v.endsWith('@gmail.com'), {
      message: 'Must be @gmail.com',
    }),
  role: z.enum(['ADMIN', 'STAFF', 'PROFESSOR', 'RESEARCHER', 'STUDENT']),
  department: z.enum([
    'COMPUTER_SCIENCE', 'MEDICINE', 'ENGINEERING', 'PHYSICS',
    'CHEMISTRY', 'BIOLOGY', 'MATHEMATICS',
  ]),
  clearanceLevel: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

// ─── Create User Form ──────────────────────────────────────────────────────────

function CreateUserForm({ onSuccess }: { onSuccess: () => void }) {
  const [serverError, setServerError] = useState('');
  const [setupToken, setSetupToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'STUDENT', department: 'COMPUTER_SCIENCE', clearanceLevel: 'PUBLIC' },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateUserForm) => adminApi.createUser(data),
    onSuccess: (res) => {
      const payload = res.data?.data ?? res.data;
      setSetupToken(payload.setupToken ?? null);
      reset();
      onSuccess();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setServerError(err.response?.data?.message ?? 'Failed to create user.');
    },
  });

  if (setupToken) {
    return (
      <div className="alert-success">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
          <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138Z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <div>
          <p className="font-medium">User account created</p>
          <p className="text-xs mt-1 text-green-600">
            A password setup email has been sent. The account will be active once they complete setup.
          </p>
          <button
            onClick={() => setSetupToken(null)}
            className="text-xs underline mt-1 text-green-700"
          >
            Create another user
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
      {serverError && (
        <div className="alert-error">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">First name</label>
          <input className={clsx('input', errors.firstName && 'input-error')} {...register('firstName')} />
          {errors.firstName && <p className="field-error">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="label">Last name</label>
          <input className={clsx('input', errors.lastName && 'input-error')} {...register('lastName')} />
          {errors.lastName && <p className="field-error">{errors.lastName.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Institutional email</label>
        <input
          type="email"
          placeholder="name@gmail.com"
          className={clsx('input', errors.email && 'input-error')}
          {...register('email')}
        />
        {errors.email && <p className="field-error">{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Role</label>
          <select className="input" {...register('role')}>
            {(['STUDENT', 'RESEARCHER', 'PROFESSOR', 'STAFF', 'ADMIN'] as Role[]).map((r) => (
              <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Department</label>
          <select className="input" {...register('department')}>
            {(['COMPUTER_SCIENCE', 'MEDICINE', 'ENGINEERING', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'MATHEMATICS'] as Department[]).map((d) => (
              <option key={d} value={d}>{d.replace('_', ' ').charAt(0) + d.replace('_', ' ').slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Clearance</label>
          <select className="input" {...register('clearanceLevel')}>
            {(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'] as ClearanceLevel[]).map((c) => (
              <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* GDPR note */}
      <p className="text-xs text-stone-400 bg-stone-50 rounded-2xl px-4 py-3">
        <strong className="text-stone-600">UK GDPR note:</strong> You are collecting personal data on behalf of the institution. Ensure this user has been informed and consents per the institution's Privacy Notice. Data is stored in line with Article 5 minimisation principles.
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full"
      >
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}

// ─── Pending Users List ────────────────────────────────────────────────────────

function PendingUsers() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pending-users'],
    queryFn: async () => {
      const res = await adminApi.getPendingUsers();
      return (res.data?.data ?? res.data) as PendingUser[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-stone-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const pending = data ?? [];

  if (pending.length === 0) {
    return (
      <p className="text-sm text-stone-400 text-center py-6">
        No accounts awaiting approval
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {pending.map((user) => (
        <li key={user.id} className="flex items-center justify-between gap-3 card p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="font-medium text-stone-900 text-sm">
                {user.firstName} {user.lastName}
              </p>
              <RoleBadge role={user.role} />
              <DepartmentBadge dept={user.department} />
            </div>
            <p className="text-xs text-stone-400 truncate">{user.email}</p>
            {user.createdBy && (
              <p className="text-xs text-stone-400 mt-0.5">
                Requested by {user.createdBy.firstName} {user.createdBy.lastName}
              </p>
            )}
          </div>
          <button
            onClick={() => approveMutation.mutate(user.id)}
            disabled={approveMutation.isPending}
            className="btn-primary btn-sm shrink-0"
          >
            Approve
          </button>
        </li>
      ))}
    </ul>
  );
}

// ─── Admin Page ────────────────────────────────────────────────────────────────

type Tab = 'create' | 'pending';

export default function AdminPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const queryClient = useQueryClient();

  if (!user || !['ADMIN', 'STAFF'].includes(user.role)) {
    return (
      <div className="card p-12 text-center">
        <p className="font-semibold text-stone-700">Access denied</p>
        <p className="text-sm text-stone-400 mt-1">Admin or Staff role required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">User management</h1>
        <p className="page-sub">
          Create accounts and approve pending registrations
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-2xl w-fit">
        {(['create', 'pending'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150',
              activeTab === tab
                ? 'bg-white text-stone-900 shadow-card'
                : 'text-stone-500 hover:text-stone-700'
            )}
          >
            {tab === 'create' ? 'Create account' : 'Pending approvals'}
          </button>
        ))}
      </div>

      <div className="card p-6">
        {activeTab === 'create' ? (
          <>
            <h2 className="font-semibold text-stone-900 mb-1">New user account</h2>
            <p className="text-sm text-stone-400 mb-5">
              The user will receive a setup email to activate their account.
              {user.role === 'STAFF' && ' New accounts will require admin approval before activation.'}
            </p>
            <CreateUserForm
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ['pending-users'] })}
            />
          </>
        ) : (
          <>
            <h2 className="font-semibold text-stone-900 mb-1">Pending approvals</h2>
            <p className="text-sm text-stone-400 mb-5">
              These accounts were created by Staff and require your approval to activate.
            </p>
            <PendingUsers />
          </>
        )}
      </div>
    </div>
  );
}
