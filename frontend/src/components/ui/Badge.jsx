export default function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-brand-primary ${className}`}
    >
      {children}
    </span>
  );
}
