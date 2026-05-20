import { SDS_LOGO } from "../../lib/sdsData";

export default function AboutSection() {
  const values = [
    {
      icon: "🌿",
      title: "Wellness Focus",
      desc: "Products selected for practical daily wellness support.",
    },
    {
      icon: "💼",
      title: "Income Opportunity",
      desc: "A direct sales model with transparent tracking.",
    },
    {
      icon: "🤝",
      title: "Community",
      desc: "A growing network of SDS members and leaders.",
    },
    {
      icon: "🏆",
      title: "Growth",
      desc: "A system built for members, distributors, and regional managers.",
    },
  ];

  return (
    <section id="about" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-yellow-500">
              About SDS
            </div>
            <h2 className="mb-6 text-3xl font-bold text-gray-900 sm:text-4xl">
              Sure-Fit Direct Sales — Building Wellness Across the Philippines
            </h2>

            <p className="mb-4 leading-relaxed text-gray-500">
              SDS Sure-Fit Wellness is a direct sales platform focused on
              wellness products, member growth, and transparent business
              operations.
            </p>

            <p className="mb-6 leading-relaxed text-gray-500">
              From product packages to member bonuses and regional reports, SDS
              is designed to support both product distribution and member
              network management.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {values.map((v) => (
                <div key={v.title} className="rounded-xl bg-blue-50 p-4">
                  <div className="mb-2 text-2xl">{v.icon}</div>
                  <div className="mb-1 text-sm font-bold text-gray-900">
                    {v.title}
                  </div>
                  <div className="text-xs text-gray-500">{v.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <div
              className="relative w-full max-w-md overflow-hidden rounded-3xl shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #0d2a6e, #1a4eb8)",
              }}
            >
              <div className="flex flex-col items-center p-12 text-center text-white">
                <img
                  src={SDS_LOGO}
                  alt="SDS"
                  className="mb-6 h-40 w-40 object-contain"
                />

                <h3 className="mb-2 text-2xl font-bold">
                  SDS Sure-Fit Wellness
                </h3>
                <p className="mb-6 text-sm text-blue-200">
                  Direct Sales Web System
                </p>

                <div className="grid w-full grid-cols-3 gap-4">
                  {[
                    { num: "56+", label: "Members" },
                    { num: "4", label: "Products" },
                    { num: "4+", label: "Regions" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-white/10 p-3">
                      <div className="text-xl font-bold text-yellow-400">
                        {s.num}
                      </div>
                      <div className="text-xs text-blue-200">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
