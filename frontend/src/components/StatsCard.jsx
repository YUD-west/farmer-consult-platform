export default function StatsCard({ label, value }) {
  return (
    <article className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-brand-muted">{label}</p>
      <p className="heading-font mt-2 text-3xl font-bold text-brand-primary">{value}</p>
    </article>
  );
}
