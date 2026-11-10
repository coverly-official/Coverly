import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { sampleProducts } from "@/data/products";
import { productCategories } from "@/data/productCategories";
import { ProductDetailClient } from "@/components/browse/ProductDetailClient";

interface ProductPageProps {
  params: {
    id: string;
  };
}

export function generateStaticParams() {
  return sampleProducts.map((p) => ({
    id: p.id,
  }));
}

export function generateMetadata({ params }: ProductPageProps): Metadata {
  const product = sampleProducts.find((p) => p.id === params.id);
  if (!product) {
    return {
      title: "Product Not Found | Coverly",
    };
  }

  return {
    title: `${product.name} | Coverly Marketplace`,
    description: `Sample listing: ${product.name} from ${product.supplierName} (${product.city}, ${product.state}). Listed at ${product.priceRange}.`,
  };
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const product = sampleProducts.find((p) => p.id === params.id);
  if (!product) {
    notFound();
  }

  const category = productCategories.find((c) => c.id === product.categoryId);
  const categoryName = category ? category.name : "Category";

  const relatedProducts = sampleProducts.filter(
    (p) => p.categoryId === product.categoryId && p.id !== product.id
  );

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <ProductDetailClient
          product={product}
          categoryName={categoryName}
          relatedProducts={relatedProducts}
        />
      </main>
      <Footer />
    </>
  );
}
