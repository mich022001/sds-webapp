import { PRODUCTS } from "../../lib/sdsData";
import ProductCard from "./ProductCard";

export default function FeaturedProducts() {
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
            Carefully selected wellness products designed to support your health and
            direct sales journey.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
