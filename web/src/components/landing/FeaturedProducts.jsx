import { useState } from "react";
import { X } from "lucide-react";

import { PRODUCTS } from "../../lib/sdsData";
import ProductCard from "./ProductCard";

export default function FeaturedProducts() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  function closeModal() {
    setSelectedProduct(null);
  }

  function scrollToContact() {
    closeModal();

    setTimeout(() => {
      const el = document.querySelector("#contact");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  return (
    <section id="products" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <div className="mb-2 text-sm font-semibold uppercase tracking-widest text-yellow-500">
            Our Products
          </div>

          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Premium Wellness Products
          </h2>

          <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-500">
            Carefully selected wellness products designed to support your health,
            daily lifestyle, and direct sales journey.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.filter((product) => product.active).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onView={setSelectedProduct}
            />
          ))}
        </div>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-gray-700 shadow-lg transition hover:bg-gray-100"
              aria-label="Close product details"
            >
              <X size={20} />
            </button>

            <div className="grid lg:grid-cols-2">
              <div className="bg-gray-50 p-6 sm:p-8">
                <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    className="h-80 w-full object-cover sm:h-[28rem]"
                  />
                </div>

                <div className="mt-6 rounded-2xl bg-blue-50 p-5 text-center">
                  <div className="text-xs font-bold uppercase tracking-wide text-blue-600">
                    SRP
                  </div>
                  <div className="mt-1 text-4xl font-black text-blue-900">
                    ₱{selectedProduct.srp.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
                  {selectedProduct.landing_title}
                </div>

                <h3 className="mb-4 text-3xl font-bold text-gray-900">
                  {selectedProduct.name}
                </h3>

                <p className="mb-6 text-sm leading-relaxed text-gray-600">
                  {selectedProduct.full_description}
                </p>

                <div className="mb-6 flex flex-wrap gap-2">
                  {selectedProduct.highlights?.map((highlight) => (
                    <span
                      key={highlight}
                      className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>

                <div className="mb-6">
                  <h4 className="mb-3 text-lg font-bold text-gray-900">
                    Key Benefits
                  </h4>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedProduct.benefits?.map((benefit) => (
                      <div
                        key={benefit}
                        className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                      >
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="mb-3 text-lg font-bold text-gray-900">
                    Ingredient Focus
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.ingredients_focus?.map((ingredient) => (
                      <span
                        key={ingredient}
                        className="rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-800"
                      >
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <h4 className="text-lg font-bold text-gray-900">
                    Product Details
                  </h4>

                  {selectedProduct.detailed_sections?.map((section) => (
                    <div
                      key={section.title}
                      className="rounded-2xl border border-gray-100 p-4"
                    >
                      <div className="mb-1 font-bold text-gray-900">
                        {section.title}
                      </div>
                      <p className="text-sm leading-relaxed text-gray-600">
                        {section.text}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mb-6 rounded-2xl bg-gray-50 p-4 text-xs leading-relaxed text-gray-500">
                  {selectedProduct.disclaimer}
                </div>

                <button
                  type="button"
                  onClick={scrollToContact}
                  className="w-full rounded-xl bg-yellow-400 py-3 text-sm font-bold text-gray-900 transition hover:bg-yellow-300"
                >
                  Contact SDS About This Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
