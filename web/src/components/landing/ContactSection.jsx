import { Globe, Mail, MapPin, Phone } from "lucide-react";

const CONTACT_ITEMS = [
  {
    icon: <Phone size={22} />,
    label: "Owner Contact Number",
    value: "0950 596 1338",
    helper: "Call or message directly for SDS inquiries.",
    link: "tel:09505961338",
  },
  {
    icon: <Globe size={22} />,
    label: "Official Facebook Page",
    value: "SDS Sure-Fit Wellness",
    helper: "Message us through Facebook.",
    link: "https://www.facebook.com/share/183Za6Qkvp/",
  },
  {
    icon: <Mail size={22} />,
    label: "Email Address",
    value: "surefitds@gmail.com",
    helper: "Send inquiries through email.",
    link: "mailto:surefitds@gmail.com",
  },
  {
    icon: <MapPin size={22} />,
    label: "Address",
    value:
      "Zone 6 Barangay Pinamopoan, Capoocan Leyte, Tacloban City, Philippines, 6500",
    helper: "Visit or locate SDS operations.",
    link:
      "https://maps.google.com/?q=Zone+6+Barangay+Pinamopoan+Capoocan+Leyte+Tacloban+City+Philippines+6500",
  },
];

export default function ContactSection() {
  return (
    <section id="contact" className="bg-gray-900 py-20 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        <div className="mb-14 text-center">
          <div className="mb-2 text-sm font-semibold uppercase tracking-widest text-yellow-400">
            Contact SDS
          </div>

          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Contact Sure-Fit Wellness
          </h2>

          <p className="mx-auto max-w-2xl text-gray-400">
            Reach us directly for products, membership, wellness support,
            and business opportunities.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">

          {CONTACT_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur transition hover:border-yellow-400/40 hover:bg-white/10"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-md">
                {item.icon}
              </div>

              <div className="text-sm font-semibold uppercase tracking-wide text-yellow-400">
                {item.label}
              </div>

              <div className="mt-2 text-lg font-bold text-white break-words">
                {item.value}
              </div>

              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                {item.helper}
              </p>
            </a>
          ))}
        </div>


        <div className="mt-10 rounded-3xl bg-gradient-to-br from-blue-800 to-blue-950 p-6 text-center shadow-2xl sm:p-8">

          <h3 className="text-2xl font-bold text-white">
            Need Help?
          </h3>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-blue-100">
            Message our Facebook page or contact the owner number directly
            for membership, products, and SDS opportunities.
          </p>

        </div>

      </div>
    </section>
  );
}
