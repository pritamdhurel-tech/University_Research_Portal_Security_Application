import { useEffect } from 'react';
import type { Resource } from '../../types';
import {
  ResourceTypeBadge,
  SensitivityBadge,
  DepartmentBadge,
  AccessDecisionBadge,
} from '../ui/Badges';
import clsx from 'clsx';

interface Props {
  resource: Resource;
  onClose: () => void;
}

const DENY_REASON_LABELS: Record<string, string> = {
  ACCOUNT_STATUS:       'Your account is inactive, unverified, or locked.',
  OFF_CAMPUS_REQUIRED:  'This resource requires on-campus or VPN access.',
  MEDICAL_DATASET:      'Medical datasets require Medicine department membership, CONFIDENTIAL+ clearance, and on-campus/VPN access.',
  CLEARANCE_LEVEL:      'Your clearance level is below the sensitivity of this resource.',
  NO_MATCHING_POLICY:   'No access policy grants you permission to this resource.',
};

export default function ResourceDetailModal({ resource, onClose }: Props) {
  const isDenied = resource.accessDecision === 'DENY';

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const denyExplanation = resource.denyReason
    ? DENY_REASON_LABELS[resource.denyReason] ?? resource.denyReason
    : null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resource-modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg card p-0 overflow-hidden animate-fade-up">
        {/* Colour top strip based on access */}
        <div className={clsx(
          'h-1.5 w-full',
          isDenied ? 'bg-red-400' : 'bg-green-400'
        )} />

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              <ResourceTypeBadge type={resource.type} />
              <SensitivityBadge level={resource.sensitivity} />
              <DepartmentBadge dept={resource.department} />
            </div>
            <button
              onClick={onClose}
              className="btn-ghost btn-sm p-1.5 -mt-0.5 -mr-0.5"
              aria-label="Close"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Title */}
          <div>
            <h2 id="resource-modal-title" className="font-display font-semibold text-xl text-stone-900 leading-snug">
              {resource.title}
            </h2>
            {resource.owner && (
              <p className="text-sm text-stone-400 mt-1">
                by {resource.owner.firstName} {resource.owner.lastName}
              </p>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-stone-600 leading-relaxed">
            {resource.description}
          </p>

          {/* Access decision */}
          {resource.accessDecision && (
            <div className={clsx(
              'rounded-2xl p-4',
              isDenied
                ? 'bg-red-50 border border-red-100'
                : 'bg-green-50 border border-green-100'
            )}>
              <div className="flex items-center gap-2 mb-2">
                <AccessDecisionBadge
                  decision={resource.accessDecision}
                  denyReason={resource.denyReason}
                />
                <span className={clsx('text-xs font-medium', isDenied ? 'text-red-700' : 'text-green-700')}>
                  ABAC policy decision
                </span>
              </div>
              {isDenied && denyExplanation && (
                <p className="text-xs text-red-600">{denyExplanation}</p>
              )}
              {!isDenied && (
                <p className="text-xs text-green-600">
                  You meet the access requirements for this resource.
                </p>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {resource.requiresOnCampusAccess && (
              <div className="col-span-2 flex items-center gap-2 text-amber-600">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="text-xs font-medium">On-campus or VPN access required</span>
              </div>
            )}

            <div>
              <p className="text-xs text-stone-400 mb-0.5">Added</p>
              <p className="text-stone-700">
                {new Date(resource.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>

            {resource.emailContact && (
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Contact</p>
                <a
                  href={`mailto:${resource.emailContact}`}
                  className="text-brand-600 hover:underline text-sm"
                >
                  {resource.emailContact}
                </a>
              </div>
            )}

            {resource.projectTag && (
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Project</p>
                <p className="text-stone-700">{resource.projectTag}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {resource.tags.map((tag) => (
                <span key={tag} className="badge-gray text-xs">{tag}</span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {!isDenied && resource.externalUrl ? (
              <a
                href={resource.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex-1"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Open resource
              </a>
            ) : isDenied && resource.emailContact ? (
              <a
                href={`mailto:${resource.emailContact}?subject=Access request: ${encodeURIComponent(resource.title)}`}
                className="btn-secondary flex-1"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Request access
              </a>
            ) : (
              <button disabled className="btn-secondary flex-1 opacity-50 cursor-not-allowed">
                Not accessible
              </button>
            )}
            <button onClick={onClose} className="btn-ghost">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
