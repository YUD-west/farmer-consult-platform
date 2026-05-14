import { TrendingUp } from "lucide-react";
import Button from "./ui/Button";

export default function ProductCard({ product }) {
  return (
    <article className="rounded-3xl border border-green-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <img src={product.image} alt={product.name} className="h-36 w-full rounded-2xl object-cover" />
      <div className="mt-4 space-y-2">
        <h4 className="heading-font text-lg font-semibold text-brand-text">{product.name}</h4>
        <p className="text-sm text-brand-muted">{product.location}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-brand-primary">{product.price}</span>
          {product.trend ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
              <TrendingUp size={14} /> {product.trend}
            </span>
          ) : null}
        </div>
        <Button variant="secondary" className="w-full">
          View Listing
        </Button>
      </div>
    </article>
  );
}
