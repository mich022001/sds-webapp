import { ArrowDown } from "lucide-react";
import { BONUS_TYPES } from "../../lib/sdsData";

const steps = [
  {
    step: "01",
    title: "Register",
    desc: "Sign up as a member with a valid registration code.",
    color: "bg-blue-700",
  },
  {
    step: "02",
    title: "Buy Package",
    desc: "Choose a wellness package to start your SDS journey.",
    color: "bg-blue-600",
  },
  {
    step: "03",
    title: "Refer Members",
    desc: "Share SDS products and invite new members.",
    color: "bg-blue-500",
  },
  {
    step: "04",
    title: "Earn Bonuses",
    desc: "Receive eligible direct, indirect, and development bonuses.",
    color: "bg-yellow-500",
  },
  {
    step: "05",
    title: "Become Distributor",
    desc: "Grow your network and build your team.",
    color: "bg-yellow-400",
  },
  {
    step: "06",
    title: "Area Manager",
    desc: "Lead an area and manage a bigger SDS community.",
    color: "bg-yellow-300",
  },
];

export default function OpportunitySection() {
  return (
    <section id="opportunity" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <div className="mb-2 text-sm font-semibold uppercase tracking-widest text-yellow-500">
            Business Opportunity
          </div>
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Your Path to Growth
          </h2>
          <p className="mx-auto max-w-2xl text-gray-500">
            SDS combines wellness products, membership growth, and transparent
            bonus tracking.
          </p>
        </div>

        <div className="grid items-start gap-16 lg:grid-cols-2">
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={s.step}>
                <div className="flex items-start gap-4 rounded-2xl bg-gray-50 p-4 transition hover:bg-blue-50">
                  <div
                    className={`${s.color} flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white`}
                  >
                    {s.step}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{s.title}</div>
                    <div className="text-sm text-gray-500">{s.desc}</div>
                  </div>
                </div>

                {i < steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown size={16} className="text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div>
            <h3 className="mb-6 text-xl font-bold text-gray-900">
              Income Streams
            </h3>

            <div className="space-y-4">
              {BONUS_TYPES.map((b) => (
                <div
                  key={b.name}
                  className="flex items-start gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-4 transition hover:shadow-md"
                >
                  <div className="text-2xl">{b.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-bold text-gray-900">
                        {b.name}
                      </div>
                      <div className="text-sm font-bold text-blue-700">
                        {b.amount}
                      </div>
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {b.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-gradient-to-br from-blue-800 to-blue-900 p-6 text-white">
              <div className="mb-2 text-lg font-bold">Ready to Start?</div>
              <p className="mb-4 text-sm text-blue-200">
                Contact SDS to learn how to become a member.
              </p>
              <button
                type="button"
                onClick={() => {
                  const el = document.querySelector("#contact");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-gray-900 transition hover:bg-yellow-300"
              >
                Become a Member Today
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
