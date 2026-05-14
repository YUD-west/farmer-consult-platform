import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import Button from "./ui/Button";
import { Input } from "./ui/Input";
import { externalPage } from "../lib/api";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Marketplace", href: "#market" },
  { label: "Services", href: "#services" },
  { label: "Guides", href: "#guides" },
  { label: "Experts", href: "#experts" },
  { label: "AI Help", href: "#chat" },
];

export default function Navbar({ onSearchFocus }) {
  const [open, setOpen] = useState(false);
  const signupHref = externalPage("/signup.html");
  const chatHref = externalPage("/chat.html");

  return (
    <header className="sticky top-0 z-50 border-b border-green-100/70 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
        <a href="#home" className="heading-font text-lg font-bold text-brand-primary">
          YegnaFarm AI
        </a>
        <nav className="hidden flex-1 items-center justify-center gap-5 lg:flex">
          {navItems.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-sm font-medium text-brand-muted transition hover:text-brand-primary"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="hidden w-52 lg:block">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <Input
              placeholder="Search market..."
              className="pl-9"
              onFocus={onSearchFocus}
              aria-label="Focus marketplace search"
            />
          </div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Button as="a" href={signupHref} variant="outline">
            Login
          </Button>
          <Button as="a" href={signupHref}>
            Get Started
          </Button>
          <Button as="a" href={chatHref} variant="outline" className="hidden xl:inline-flex">
            Full Chat
          </Button>
        </div>
        <button
          className="ml-auto rounded-lg p-2 text-brand-primary lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          type="button"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-green-100 bg-white px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {navItems.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-sm font-medium text-brand-muted"
                onClick={() => setOpen(false)}
              >
                {label}
              </a>
            ))}
            <Button as="a" href={signupHref} variant="outline">
              Login
            </Button>
            <Button as="a" href={signupHref}>
              Get Started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
