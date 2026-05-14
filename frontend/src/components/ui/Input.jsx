export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-xl border border-green-200 bg-white px-4 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/80 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${className}`}
      {...props}
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select
      className="w-full rounded-xl border border-green-200 bg-white px-4 py-2.5 text-sm text-brand-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
      {...props}
    >
      {children}
    </select>
  );
}
