import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import { LocationBadge } from '../components/ui/Badges';
import type { AuditLogEntry, AccessLogEntry } from '../types';
import clsx from 'clsx';

type Tab = 'audit' | 'access';

function AuditRow({ entry }: { entry: AuditLogEntry }) {
  return (
    <tr className="border-t border-stone-100 hover:bg-stone-50 transition-colors">
      <td className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap">
        {new Date(entry.createdAt).toLocaleString('en-GB', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        })}
      </td>
      <td className="px-4 py-3 text-sm text-stone-700">
        {entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : entry.userId.slice(0, 8)}
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded-lg">
          {entry.action}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={clsx(
          'badge text-xs',
          entry.result === 'SUCCESS' ? 'badge-green' : 'badge-red'
        )}>
          {entry.result}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-stone-400 font-mono">
        {entry.ipAddress}
      </td>
    </tr>
  );
}

function AccessRow({ entry }: { entry: AccessLogEntry }) {
  return (
    <tr className="border-t border-stone-100 hover:bg-stone-50 transition-colors">
      <td className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap">
        {new Date(entry.createdAt).toLocaleString('en-GB', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        })}
      </td>
      <td className="px-4 py-3 text-sm text-stone-700 max-w-[180px] truncate">
        {entry.resource?.title ?? entry.resourceId.slice(0, 8)}
      </td>
      <td className="px-4 py-3 text-xs text-stone-500">{entry.userRole}</td>
      <td className="px-4 py-3">
        <LocationBadge location={entry.userLocation} />
      </td>
      <td className="px-4 py-3">
        <span className={clsx(
          'badge text-xs',
          entry.decision === 'ALLOW' ? 'badge-green' : 'badge-red'
        )}>
          {entry.decision}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-stone-400 max-w-[160px] truncate" title={entry.denyReason ?? ''}>
        {entry.policyMatched ?? '—'}
      </td>
    </tr>
  );
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="border-t border-stone-100">
          {[...Array(cols)].map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-stone-100 rounded-lg animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function AuditLogsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('audit');

  const auditQuery = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await adminApi.getAuditLogs({ limit: '50' });
      return (res.data?.data?.items ?? res.data?.data ?? res.data) as AuditLogEntry[];
    },
    enabled: activeTab === 'audit',
  });

  const accessQuery = useQuery({
    queryKey: ['access-logs'],
    queryFn: async () => {
      const res = await adminApi.getAccessLogs({ limit: '50' });
      return (res.data?.data?.items ?? res.data?.data ?? res.data) as AccessLogEntry[];
    },
    enabled: activeTab === 'access',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Audit logs</h1>
        <p className="page-sub">
          Security and access events — retained 730 days per UK Cyber Essentials
        </p>
      </div>

      <div className="alert-info">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span>
          Logs are immutable and stored in compliance with <strong>UK GDPR Article 30</strong> record-keeping requirements.
          All CONFIDENTIAL and RESTRICTED resource accesses are logged regardless of outcome.
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-2xl w-fit">
        {(['audit', 'access'] as Tab[]).map((tab) => (
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
            {tab === 'audit' ? 'Authentication events' : 'Resource access'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'audit' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50">
                  {['Time', 'User', 'Action', 'Result', 'IP address'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditQuery.isLoading ? (
                  <TableSkeleton cols={5} />
                ) : (auditQuery.data ?? []).map((entry) => (
                  <AuditRow key={entry.id} entry={entry} />
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50">
                  {['Time', 'Resource', 'Role', 'Location', 'Decision', 'Policy'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accessQuery.isLoading ? (
                  <TableSkeleton cols={6} />
                ) : (accessQuery.data ?? []).map((entry) => (
                  <AccessRow key={entry.id} entry={entry} />
                ))}
              </tbody>
            </table>
          )}

          {/* Empty state */}
          {activeTab === 'audit' && !auditQuery.isLoading && (auditQuery.data ?? []).length === 0 && (
            <div className="py-12 text-center text-sm text-stone-400">No audit events recorded yet</div>
          )}
          {activeTab === 'access' && !accessQuery.isLoading && (accessQuery.data ?? []).length === 0 && (
            <div className="py-12 text-center text-sm text-stone-400">No access events recorded yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
