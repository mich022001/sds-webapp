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
      desc: "A system built for members, distributors, and area managers.",
    },
  ];

  return (
    <section
      id="about"
      className="bg-white py-20"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        <div className="text-center">

          <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-yellow-500">
            About SDS
          </div>

          <h2 className="mb-6 text-3xl font-bold text-gray-900 sm:text-4xl">
            Sure-Fit Wellness — Building Wellness Across the Philippines
          </h2>

          <p className="mx-auto mb-4 max-w-3xl leading-relaxed text-gray-500">
            SDS Sure-Fit Wellness focuses on premium wellness products,
            membership growth, and creating opportunities through direct sales.
          </p>

          <p className="mx-auto mb-12 max-w-3xl leading-relaxed text-gray-500">
            From product packages to bonuses and community support,
            SDS helps members build wellness and additional income opportunities.
          </p>

        </div>


        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {values.map((value) => (
            <div
              key={value.title}
              className="
                rounded-2xl
                border
                border-gray-100
                bg-gray-50
                p-6
                transition
                hover:-translate-y-1
                hover:shadow-lg
              "
            >

              <div className="mb-3 text-3xl">
                {value.icon}
              </div>

              <h3 className="mb-2 font-bold text-gray-900">
                {value.title}
              </h3>

              <p className="text-sm leading-relaxed text-gray-500">
                {value.desc}
              </p>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}
