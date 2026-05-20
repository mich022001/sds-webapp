import { Check, Star } from "lucide-react";
import { PACKAGES } from "../../lib/sdsData";

export default function PackagesSection() {
  function scrollToContact() {
    const el = document.querySelector("#contact");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section id="packages" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <div className="mb-2 text-sm font-semibold uppercase tracking-widest text-yellow-500">
            Membership Packages
          </div>
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Choose Your Package
          </h2>
          <p className="mx-auto max-w-2xl text-gray-500">
            Start your SDS journey with a package that matches your wellness and business goals.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative overflow-hidden rounded-2xl border-2 bg-white shadow-md transition-all duration-300 hover:shadow-xl ${
                pkg.recommended ? "border-yellow-400 shadow-yellow-100" : "border-gray-100"
              }`}
            >
              {pkg.recommended && (
                <div className="absolute left-0 right-0 top-0 bg-yellow-400 py-1.5 text-center">
                  <span className="flex items-center justify-center gap-1 text-xs font-bold text-gray-900">
                    <Star size={12} fill="currentColor" /> MOST POPULAR
                  </span>
                </div>
              )}

              <div className={`p-6 ${pkg.recommended ? "pt-10" : ""}`}>
                <div className="mb-5 text-center">
                  <h3 className="mb-1 text-xl font-bold text-gray-900">{pkg.name}</h3>
                  <div className="text-3xl font-bold text-blue-700">
                    ₱{pkg.price.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400 line-through">
                    SRP ₱{pkg.srp.toLocaleString()}
                  </div>
                </div>

                <p className="mb-4 text-center text-sm leading-relaxed text-gray-500">
                  {pkg.description}
                </p>

                <div className="mb-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-700">
                    Included Products
                  </div>
                  {pkg.included_products.map((p) => (
                    <div key={p} className="flex items-center gap-2 py-1 text-sm text-gray-600">
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                      {p}
                    </div>
                  ))}
                </div>

                <div className="mb-5 border-t border-gray-100 pt-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-700">
                    Benefits
                  </div>
                  {pkg.benefits.map((b) => (
                    <div key={b} className="flex items-start gap-2 py-0.5 text-sm text-gray-600">
                      <Check size={14} className="mt-0.5 shrink-0 text-blue-600" />
                      {b}
                    </div>
                  ))}
                </div>

                <button
                  onClick={scrollToContact}
                  className={`w-full rounded-xl py-3 text-sm font-bold transition-all ${
                    pkg.recommended
                      ? "bg-yellow-400 text-gray-900 shadow-md hover:bg-yellow-300"
                      : "bg-blue-700 text-white hover:bg-blue-800"
                  }`}
                >
                  Get Started
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
