import { useEffect, useState } from "react";
import { SDS_LOGO } from "../../lib/sdsData";

export default function HeroSection() {
  const [activeMembers, setActiveMembers] = useState(null);

  function scrollTo(href) {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      try {
        const res = await fetch("/api/members");
        const json = await res.json().catch(() => ({}));
        const rows = Array.isArray(json?.data) ? json.data : [];

        if (!cancelled) setActiveMembers(rows.length);
      } catch {
        if (!cancelled) setActiveMembers(null);
      }
    }

    loadMembers();

    return () => {
      cancelled = true;
    };
  }, []);

  const memberCount = activeMembers === null ? "—" : `${activeMembers}+`;

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden bg-[#061b4f]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(59,130,246,0.35),transparent_34%),linear-gradient(135deg,#061b4f_0%,#0d3fa3_42%,#123f9d_70%,#071b47_100%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-white/10 px-4 py-2 text-xs font-semibold text-yellow-300 backdrop-blur">
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
                type="button"
                onClick={() => scrollTo("#contact")}
                className="rounded-full bg-yellow-400 px-8 py-4 font-bold text-gray-900 transition hover:bg-yellow-300"
              >
                Become a Member
              </button>

              <button
                type="button"
                onClick={() => scrollTo("#products")}
                className="rounded-full border-2 border-white/30 px-8 py-4 font-semibold text-white transition hover:bg-white/10"
              >
                View Products →
              </button>
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-5">
              {[
                { num: memberCount, label: "Active Members" },
                { num: "4", label: "Products" },
                { num: "4", label: "Packages" },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className={index ? "border-l border-white/20 pl-5" : ""}
                >
                  <div className="text-2xl font-bold text-yellow-400">
                    {stat.num}
                  </div>

                  <div className="text-sm text-blue-100">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative flex h-[20rem] w-[20rem] items-center justify-center sm:h-[30rem] sm:w-[30rem] lg:h-[36rem] lg:w-[36rem]">
              <div className="absolute inset-0 rounded-full border border-white/10" />

              <div className="absolute inset-[0.5%] overflow-hidden rounded-full">
                <img
                  src={SDS_LOGO}
                  alt="SDS Logo"
                  className="h-full w-full scale-[1.22] object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.35)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 80L1440 80L1440 40C1200 80 960 0 720 20C480 40 240 80 0 40L0 80Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
