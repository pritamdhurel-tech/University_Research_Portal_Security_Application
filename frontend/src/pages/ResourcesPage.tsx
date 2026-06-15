import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { resourcesApi } from '../services/api';
import {
  ResourceTypeBadge,
  SensitivityBadge,
  DepartmentBadge,
  AccessDecisionBadge,
} from '../components/ui/Badges';
import type { Resource, ResourceType, SensitivityLevel } from '../types';
import clsx from 'clsx';
import ResourceDetailModal from '../components/resources/ResourceDetailModal';

// ─── Filter Bar ────────────────────────────────────────────────────────────────

const TYPES: ResourceType[] = ['PAPER', 'DATASET', 'THESIS', 'REPORT'];
const SENSITIVITIES: SensitivityLevel[] = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'];

function FilterBar({
  search, onSearch,
  typeFilter, onTypeFilter,
  sensitivityFilter, onSensitivityFilter,
}: {
  search: string; onSearch: (v: string) => void;
  typeFilter: string; onTypeFilter: (v: string) => void;
  sensitivityFilter: string; onSensitivityFilter: (v: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="search"
          placeholder="Search resources…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      <select
        value={typeFilter}
        onChange={(e) => onTypeFilter(e.target.value)}
        className="input w-full sm:w-36"
      >
        <option value="">All types</option>
        {TYPES.map((t) => (
          <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
        ))}
      </select>

      <select
        value={sensitivityFilter}
        onChange={(e) => onSensitivityFilter(e.target.value)}
        className="input w-full sm:w-40"
      >
        <option value="">All sensitivity</option>
        {SENSITIVITIES.map((s) => (
          <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Resource Card ─────────────────────────────────────────────────────────────

function ResourceCard({
  resource,
  onClick,
}: {
  resource: Resource;
  onClick: () => void;
}) {
  const isDenied = resource.accessDecision === 'DENY';

  return (
    <button
      onClick={onClick}
      className={clsx(
        'card p-5 w-full text-left transition-all duration-200 group',
        isDenied
          ? 'opacity-60 hover:opacity-80 cursor-not-allowed'
          : 'hover:shadow-card-hover cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-1.5">
          <ResourceTypeBadge type={resource.type} />
          <SensitivityBadge level={resource.sensitivity} />
          <DepartmentBadge dept={resource.department} />
        </div>
        {resource.accessDecision && (
          <AccessDecisionBadge
            decision={resource.accessDecision}
            denyReason={resource.denyReason}
          />
        )}
      </div>

      <h3 className={clsx(
        'font-semibold text-base leading-snug mb-1',
        isDenied ? 'text-stone-500' : 'text-stone-900 group-hover:text-brand-600'
      )}>
        {resource.title}
      </h3>

      <p className="text-sm text-stone-400 line-clamp-2 mb-3">
        {resource.description}
      </p>

      <div className="flex items-center gap-4 text-xs text-stone-400">
        {resource.requiresOnCampusAccess && (
          <span className="flex items-center gap-1 text-amber-600">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            On-campus only
          </span>
        )}
        {resource.owner && (
          <span>
            {resource.owner.firstName} {resource.owner.lastName}
          </span>
        )}
        <span className="ml-auto">
          {new Date(resource.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </span>
      </div>

      {/* ABAC deny reason inline */}
      {isDenied && resource.denyReason && (
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-start gap-2 text-xs text-red-500">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {resource.denyReason}
        </div>
      )}
    </button>
  );
}

// ─── Empty / Error States ──────────────────────────────────────────────────────

function EmptyState({ search }: { search: string }) {
  return (
    <div className="card p-12 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-3xl bg-stone-100 flex items-center justify-center mb-4">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path d="M4 6h16M4 10h16M4 14h8M4 18h6" stroke="#b8b4aa" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="font-semibold text-stone-700">
        {search ? `No results for "${search}"` : 'No accessible resources'}
      </p>
      <p className="text-sm text-stone-400 mt-1 max-w-xs">
        {search
          ? 'Try adjusting your search or filters.'
          : 'Resources you have access to will appear here.'}
      </p>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sensitivityFilter, setSensitivityFilter] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const params: Record<string, string> = {};
  if (typeFilter) params.type = typeFilter;
  if (sensitivityFilter) params.sensitivity = sensitivityFilter;

  const { data, isLoading, error } = useQuery({
    queryKey: ['resources', params],
    queryFn: async () => {
      const res = await resourcesApi.list(params);
      return (res.data?.data ?? res.data) as Resource[];
    },
  });

  const resources = data ?? [];

  const filtered = resources.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  });

  const allowedCount = filtered.filter((r) => r.accessDecision !== 'DENY').length;
  const deniedCount = filtered.filter((r) => r.accessDecision === 'DENY').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Resources</h1>
        <p className="page-sub">
          Research papers, datasets, theses and reports — filtered by your ABAC access policy
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        search={search} onSearch={setSearch}
        typeFilter={typeFilter} onTypeFilter={setTypeFilter}
        sensitivityFilter={sensitivityFilter} onSensitivityFilter={setSensitivityFilter}
      />

      {/* Summary bar */}
      {!isLoading && filtered.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-stone-500">
          <span>{filtered.length} resource{filtered.length !== 1 ? 's' : ''}</span>
          {allowedCount > 0 && (
            <span className="text-green-600">✓ {allowedCount} accessible</span>
          )}
          {deniedCount > 0 && (
            <span className="text-red-500">✗ {deniedCount} restricted</span>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-2 mb-3">
                <div className="h-5 w-16 bg-stone-100 rounded-full" />
                <div className="h-5 w-20 bg-stone-100 rounded-full" />
              </div>
              <div className="h-5 w-3/4 bg-stone-100 rounded-lg mb-2" />
              <div className="h-4 w-full bg-stone-50 rounded-lg mb-1" />
              <div className="h-4 w-2/3 bg-stone-50 rounded-lg" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="alert-error">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="shrink-0">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Failed to load resources. Please refresh and try again.
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onClick={() => setSelectedResource(resource)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedResource && (
        <ResourceDetailModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}
    </div>
  );
}
