import { SDS_LOGO } from "../../lib/sdsData";

export default function HeroSection() {
  function scrollTo(href) {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #061b4f 0%, #0d3fa3 40%, #123f9d 68%, #071b47 100%)",
      }}
    >
      <div className="pointer-events-none absolute right-0 top-16 h-[36rem] w-[36rem] rounded-full bg-blue-300/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-24 left-10 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-white/10 px-4 py-2 text-xs font-semibold text-yellow-300 shadow-lg backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
              High grade organic quality
            </div>

            <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Premium Wellness Products.
            </h1>

            <p className="mb-8 max-w-xl text-lg leading-relaxed text-blue-100">
              Join Sure-Fit Wellness and discover premium wellness products,
              rewarding memberships, and income opportunities across the
              Philippines.
            </p>

            <div className="mb-12 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => scrollTo("#contact")}
                className="rounded-full bg-yellow-400 px-8 py-4 text-base font-bold text-gray-900 shadow-lg transition-all hover:bg-yellow-300 hover:shadow-xl"
              >
                Become a Member
              </button>

              <button
                onClick={() => scrollTo("#products")}
                className="rounded-full border-2 border-white/40 px-8 py-4 text-base font-semibold text-white transition-all hover:border-white hover:bg-white/10"
              >
                View Products →
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {[
                { num: "56+", label: "Active Members" },
                { num: "4", label: "Products" },
                { num: "4", label: "Packages" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-yellow-400">
                    {stat.num}
                  </div>
                  <div className="text-sm text-blue-200">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="flex h-80 w-80 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-2xl backdrop-blur sm:h-[25rem] sm:w-[25rem] lg:h-[34rem] lg:w-[34rem]">
                <div className="flex h-64 w-64 items-center justify-center rounded-full border border-white/20 bg-white/10 p-3 shadow-inner backdrop-blur sm:h-[21rem] sm:w-[21rem] lg:h-[29rem] lg:w-[29rem]">
                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white shadow-2xl ring-8 ring-yellow-400/90">
                    <img
                      src={SDS_LOGO}
                      alt="SDS Sure-Fit Wellness"
                      className="h-full w-full scale-[1.42] object-cover drop-shadow-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-2xl bg-white px-4 py-3 shadow-xl sm:-left-4 sm:left-auto sm:translate-x-0">
                <div className="text-xs font-medium text-gray-500">
                  Member Earnings
                </div>
                <div className="text-lg font-bold text-blue-800">
                  ₱600 / Referral
                </div>
              </div>

              <div className="absolute -right-2 -top-4 rounded-2xl bg-yellow-400 px-4 py-3 shadow-xl sm:-right-4">
                <div className="text-xs font-medium text-gray-700">
                  Products
                </div>
                <div className="text-lg font-bold text-gray-900">
                  4 Premium
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 80L1440 80L1440 40C1200 80 960 0 720 20C480 40 240 80 0 40L0 80Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
