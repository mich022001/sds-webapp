import { Globe, Mail, MapPin, Phone, Send } from "lucide-react";

export default function ContactSection() {
  return (
    <section id="contact" className="bg-gray-900 py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <div className="mb-2 text-sm font-semibold uppercase tracking-widest text-yellow-400">
            Get Started
          </div>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Start Your SDS Journey
          </h2>
          <p className="mx-auto max-w-2xl text-gray-400">
            Contact SDS to learn more about products, membership, and business
            opportunities.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <h3 className="mb-4 text-xl font-bold text-white">
              Contact Information
            </h3>

            {[
              {
                icon: <Mail size={18} />,
                label: "Email",
                value: "info@sds-surefitwellness.com",
              },
              {
                icon: <Phone size={18} />,
                label: "Phone",
                value: "+63 XXX XXX XXXX",
              },
              {
                icon: <MapPin size={18} />,
                label: "Address",
                value: "Philippines",
              },
              {
                icon: <Globe size={18} />,
                label: "Social Page",
                value: "SDS Sure-Fit Wellness",
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white">
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs text-gray-400">{item.label}</div>
                  <div className="text-sm font-medium text-white">
                    {item.value}
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-8 rounded-2xl bg-gradient-to-br from-blue-800 to-blue-900 p-6">
              <div className="mb-2 text-lg font-bold">Become a Member</div>
              <p className="mb-4 text-sm text-blue-200">
                You need a registration code from an existing member or admin to
                join. Contact SDS to get started.
              </p>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-yellow-400 px-3 py-1.5 text-xs font-bold text-gray-900">
                  Member
                </span>
                <span className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">
                  Distributor
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-blue-900">
                  Area Manager
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h3 className="mb-6 text-xl font-bold">Send an Inquiry</h3>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="Juan"
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-400">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="dela Cruz"
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">
                  Email / Phone
                </label>
                <input
                  type="text"
                  placeholder="your@email.com or 09XX XXX XXXX"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">
                  Interested In
                </label>
                <select className="w-full rounded-xl border border-white/20 bg-gray-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-400">
                  <option value="">Select...</option>
                  <option value="member">Becoming a Member</option>
                  <option value="products">Product Inquiry</option>
                  <option value="business">Business Opportunity</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">
                  Message
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us how we can help..."
                  className="w-full resize-none rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-400"
                />
              </div>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 py-3 font-bold text-gray-900 transition hover:bg-yellow-300"
              >
                <Send size={16} /> Send Inquiry
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
