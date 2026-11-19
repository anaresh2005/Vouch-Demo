import type { Product, Variant } from '@/lib/demoStore';
import { cn } from '@/lib/utils';

// A product's picture in the chosen color: an AI-generated studio photo (scripts/product-photos),
// all in the same setup so the catalog matches. The brand and its products are fictional.
export function ProductArt({ product, variant, className }: { product: Product; variant?: Variant; className?: string }) {
  const chosen = variant ?? product.variants[0];
  return <img src={chosen.image} alt={`${product.title} in ${chosen.name}`} className={cn('aspect-square w-full object-cover', className)} />;
}
