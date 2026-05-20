import { Star } from "lucide-react";
import { TESTIMONIALS } from "../../lib/sdsData";

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <div className="mb-2 text-sm font-semibold uppercase tracking-widest text-yellow-500">
            Testimonials
          </div>
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            What Our Members Say
          </h2>
          <p className="mx-auto max-w-2xl text-gray-500">
            Stories from SDS members and leaders.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md transition duration-300 hover:shadow-xl"
            >
              <div className="mb-4 flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className="fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="mb-5 text-sm italic leading-relaxed text-gray-600">
                “{t.message}”
              </p>

              <div className="flex items-center gap-3">
                <img
                  src={t.photo_url}
                  alt={t.name}
                  className="h-10 w-10 rounded-full border-2 border-blue-100 object-cover"
                />
                <div>
                  <div className="text-sm font-bold text-gray-900">{t.name}</div>
                  <div className="text-xs text-blue-600">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
