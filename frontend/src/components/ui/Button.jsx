const variants = {
  primary:
    "bg-brand-accent text-brand-primary hover:-translate-y-0.5 hover:shadow-lg hover:shadow-yellow-200",
  secondary:
    "bg-brand-primary text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-300/40",
  outline:
    "border border-brand-primary text-brand-primary bg-white/70 hover:bg-brand-primary/10",
};

export default function Button({ as = "button", variant = "primary", className = "", children, ...props }) {
  const Component = as;
  return (
    <Component
      className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
