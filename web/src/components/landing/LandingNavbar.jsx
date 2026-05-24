import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SDS_LOGO } from "../../lib/sdsData";

export default function LandingNavbar({ onLogin }) {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "#hero" },
    { label: "Products", href: "#products" },
    { label: "Packages", href: "#packages" },
    { label: "Opportunity", href: "#opportunity" },
    { label: "Contact", href: "#contact" },
  ];

  function scrollTo(href) {
    setOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button onClick={() => scrollTo("#hero")} className="flex items-center gap-2">
            <img src={SDS_LOGO} alt="SDS" className="h-10 w-10 object-contain" />
            <div className="hidden text-left sm:block">
              <div className="text-sm font-bold leading-tight text-blue-800">SDS</div>
              <div className="text-xs font-semibold leading-tight text-yellow-500">
                Sure-Fit Wellness
              </div>
            </div>
          </button>

          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-700"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={onLogin}
              className="text-sm font-semibold text-blue-700 transition-colors hover:text-blue-900"
            >
              Login
            </button>
            <button
              onClick={() => scrollTo("#contact")}
              className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-bold text-gray-900 shadow-md transition-all hover:bg-yellow-500 hover:shadow-lg"
            >
              Become Member
            </button>
          </div>

          <button onClick={() => setOpen(!open)} className="p-2 text-gray-600 md:hidden">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-white shadow-lg md:hidden">
          <div className="space-y-3 px-4 py-4">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                className="block w-full border-b border-gray-50 py-2 text-left text-sm font-medium text-gray-700 hover:text-blue-700"
              >
                {link.label}
              </button>
            ))}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setOpen(false);
                  onLogin?.();
                }}
                className="flex-1 rounded-full border border-blue-700 py-2 text-center text-sm font-semibold text-blue-700"
              >
                Login
              </button>
              <button
                onClick={() => scrollTo("#contact")}
                className="flex-1 rounded-full bg-yellow-400 py-2 text-sm font-bold text-gray-900"
              >
                Become Member
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
