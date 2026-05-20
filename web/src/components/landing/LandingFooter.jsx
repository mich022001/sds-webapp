import { SDS_LOGO } from "../../lib/sdsData";

export default function LandingFooter() {
  function scrollTo(href) {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <footer className="bg-gray-950 py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <img
                src={SDS_LOGO}
                alt="SDS"
                className="h-12 w-12 object-contain"
              />
              <div>
                <div className="text-lg font-bold text-white">SDS</div>
                <div className="text-sm font-medium text-yellow-400">
                  Sure-Fit Wellness
                </div>
              </div>
            </div>

            <p className="max-w-xs text-sm leading-relaxed text-gray-400">
              Building wellness and income opportunities across the Philippines
              through products, membership, and direct sales operations.
            </p>
          </div>

          <div>
            <div className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
              Quick Links
            </div>
            <div className="space-y-2">
              {[
                { label: "Products", href: "#products" },
                { label: "Packages", href: "#packages" },
                { label: "Opportunity", href: "#opportunity" },
                { label: "Testimonials", href: "#testimonials" },
                { label: "Contact", href: "#contact" },
              ].map((link) => (
                <button
                  type="button"
                  key={link.label}
                  onClick={() => scrollTo(link.href)}
                  className="block text-sm text-gray-400 transition hover:text-yellow-400"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
              Contact
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <div>info@sds-surefitwellness.com</div>
              <div>+63 XXX XXX XXXX</div>
              <div>Philippines</div>

              <div className="mt-4 flex gap-3">
                <a
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-xs font-bold transition hover:bg-blue-600"
                >
                  f
                </a>
                <a
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600 text-xs font-bold transition hover:bg-pink-500"
                >
                  in
                </a>
                <a
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-700 text-xs font-bold transition hover:bg-gray-600"
                >
                  tk
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-gray-800 pt-6 sm:flex-row">
          <div className="text-xs text-gray-500">
            © {new Date().getFullYear()} SDS Sure-Fit Wellness. All rights
            reserved.
          </div>
          <div className="text-xs text-gray-500">
            Direct Sales Web System — Admin Portal
          </div>
        </div>
      </div>
    </footer>
  );
}
