import { Star } from "lucide-react";
import Button from "./ui/Button";

export default function ExpertCard({ expert }) {
  return (
    <article className="rounded-3xl border border-green-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <img src={expert.avatar} alt={expert.name} className="mx-auto h-20 w-20 rounded-full object-cover" />
      <h4 className="heading-font mt-3 text-lg font-semibold text-brand-text">{expert.name}</h4>
      <p className="text-sm text-brand-muted">{expert.specialization}</p>
      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs text-yellow-700">
        <Star size={14} className="fill-current" /> {expert.rating}
      </div>
      <Button className="mt-4 w-full">Book Now</Button>
    </article>
  );
}
