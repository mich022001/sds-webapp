import { SDS_LOGO } from "../../lib/sdsData";

export default function HeroSection() {
  function scrollTo(href) {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden bg-[#061b4f]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(59,130,246,0.35),transparent_34%),linear-gradient(135deg,#061b4f_0%,#0d3fa3_42%,#123f9d_70%,#071b47_100%)]" />
      <div className="pointer-events-none absolute right-[-10rem] top-10 h-[42rem] w-[42rem] rounded-full border border-white/10" />
      <div className="pointer-events-none absolute right-[-6rem] top-24 h-[34rem] w-[34rem] rounded-full border border-white/10" />
      <div className="pointer-events-none absolute bottom-24 left-10 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-white/10 px-4 py-2 text-xs font-semibold text-yellow-300 shadow-lg backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
              High grade organic quality
            </div>

            <h1 className="mb-6 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Premium Wellness Products.
            </h1>

            <p className="mb-8 max-w-xl text-lg leading-relaxed text-blue-100">
              Join Sure-Fit Wellness and discover premium wellness products,
              rewarding memberships, and income opportunities across the
              Philippines.
            </p>

            <div className="mb-12 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => scrollTo("#contact")}
                className="rounded-full bg-yellow-400 px-8 py-4 text-base font-bold text-gray-900 shadow-lg transition-all hover:bg-yellow-300 hover:shadow-xl"
              >
                Become a Member
              </button>

              <button
                type="button"
                onClick={() => scrollTo("#products")}
                className="rounded-full border-2 border-white/40 px-8 py-4 text-base font-semibold text-white transition-all hover:border-white hover:bg-white/10"
              >
                View Products →
              </button>
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-5">
              {[
                { num: "56+", label: "Active Members" },
                { num: "4", label: "Products" },
                { num: "4", label: "Packages" },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className={index > 0 ? "border-l border-white/20 pl-5" : ""}
                >
                  <div className="text-2xl font-bold text-yellow-400">
                    {stat.num}
                  </div>
                  <div className="text-sm text-blue-100">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end lg:pt-4">
            <div className="relative h-[19rem] w-[19rem] sm:h-[27rem] sm:w-[27rem] lg:h-[34rem] lg:w-[34rem]">
              <div className="absolute inset-0 rounded-full border border-white/15 bg-white/5 shadow-2xl backdrop-blur" />
              <div className="absolute inset-6 rounded-full border border-white/10 bg-white/5" />

              <div className="absolute inset-8 overflow-hidden rounded-full bg-white shadow-[0_30px_90px_rgba(0,0,0,0.35)] ring-[10px] ring-yellow-400 sm:inset-10">
                <img
                  src={SDS_LOGO}
                  alt="SDS Sure-Fit Wellness"
                  className="h-full w-full scale-[1.72] object-cover"
                />
              </div>

              <div className="absolute -right-2 top-8 rounded-2xl bg-yellow-400 px-4 py-3 shadow-xl sm:right-0 sm:top-12">
                <div className="text-xs font-medium text-gray-700">
                  Products
                </div>
                <div className="text-lg font-bold text-gray-900">
                  4 Premium
                </div>
              </div>

              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-2xl bg-white px-4 py-3 shadow-xl sm:bottom-10 lg:left-8 lg:translate-x-0">
                <div className="text-xs font-medium text-gray-500">
                  Member Earnings
                </div>
                <div className="text-lg font-bold text-blue-800">
                  ₱600 / Referral
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
