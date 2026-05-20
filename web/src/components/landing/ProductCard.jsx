export default function ProductCard({ product }) {
  function scrollToContact() {
    const el = document.querySelector("#contact");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-all duration-300 hover:shadow-xl">
      <div className="relative h-56 overflow-hidden bg-gray-50">
        <img
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute right-3 top-3 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-gray-900 shadow">
          ₱{product.price.toLocaleString()}
        </div>
      </div>

      <div className="p-5">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
          {product.landing_title}
        </div>
        <h3 className="mb-2 text-lg font-bold text-gray-900">{product.name}</h3>
        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-500">
          {product.description}
        </p>

        <div className="mb-4 flex flex-wrap gap-1">
          {product.highlights?.slice(0, 3).map((h) => (
            <span key={h} className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
              {h}
            </span>
          ))}
        </div>

        <button
          onClick={scrollToContact}
          className="w-full rounded-xl bg-blue-700 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-800"
        >
          View Product
        </button>
      </div>
    </div>
  );
}
