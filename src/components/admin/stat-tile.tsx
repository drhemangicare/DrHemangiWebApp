export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/80 border border-black/5 rounded-2xl p-5 shadow-sm">
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted font-semibold mb-1.5">{label}</div>
      <div className="font-serif text-3xl text-plum-deep leading-none">{value}</div>
      {sub && <div className="text-xs text-muted mt-2">{sub}</div>}
    </div>
  );
}
