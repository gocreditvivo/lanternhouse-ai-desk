import { Building2 } from 'lucide-react';

/**
 * Shown when the signed-in account has no `businesses` row carrying its
 * `settings.owner_id`. Every RLS policy keys off that field, so without it
 * every query legitimately returns nothing — this says so instead of
 * rendering an empty table that looks like a business with no customers.
 */
export function NoBusinessLinked() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-12 text-center max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
        <Building2 className="w-6 h-6 text-brand-600" />
      </div>
      <h2 className="font-semibold text-gray-900 mb-2">No business linked yet</h2>
      <p className="text-sm text-gray-500 mb-6">
        This account is not connected to a business, so there is no data to show. Signing out and
        back in finishes the link automatically.
      </p>
      <a
        href="/login"
        className="inline-flex px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition"
      >
        Sign in again
      </a>
    </div>
  );
}
