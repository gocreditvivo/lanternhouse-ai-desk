/**
 * Server Components fetch before rendering, so the per-page spinners that used
 * to run in useEffect move here. Applies to every nested /dashboard route.
 */
export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );
}
