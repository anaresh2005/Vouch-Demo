import type { ArtKind, Product, Variant } from '@/lib/demoStore';
import { cn } from '@/lib/utils';

// A product's picture: the photo when there is one, otherwise a simple drawing in the variant's
// color on the same pale backdrop as the bottle renders. These drawings stand in for product
// photography; the brand and its products are fictional.
export function ProductArt({ product, variant, className }: { product: Product; variant?: Variant; className?: string }) {
  const chosen = variant ?? product.variants[0];
  if (chosen.image) {
    return <img src={chosen.image} alt={`${product.title} in ${chosen.name}`} className={cn('aspect-square w-full object-cover', className)} />;
  }
  return (
    <div className={cn('aspect-square w-full bg-[#eef0f2]', className)} role="img" aria-label={`${product.title} in ${chosen.name}`}>
      <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
        <Drawing kind={product.art ?? 'lid'} color={chosen.swatch} />
      </svg>
    </div>
  );
}

const STEEL = '#c3c8ce';
const STEEL_DARK = '#9aa1a9';

function Drawing({ kind, color }: { kind: ArtKind; color: string }) {
  switch (kind) {
    case 'tumbler':
      return (
        <g>
          <ellipse cx="100" cy="170" rx="34" ry="5" fill="#000" opacity=".06" />
          <path d="M66 58h68l-8 108a6 6 0 0 1-6 6H80a6 6 0 0 1-6-6Z" fill={color} />
          <path d="M70 70h60" stroke="#000" strokeOpacity=".06" strokeWidth="2" />
          <rect x="62" y="44" width="76" height="16" rx="5" fill={STEEL} />
          <rect x="88" y="47" width="24" height="5" rx="2.5" fill={STEEL_DARK} />
        </g>
      );
    case 'lid':
      return (
        <g>
          <ellipse cx="100" cy="150" rx="46" ry="6" fill="#000" opacity=".06" />
          <path d="M64 96h72v44a8 8 0 0 1-8 8H72a8 8 0 0 1-8-8Z" fill={color} />
          <path d="M64 112h72M64 124h72" stroke="#000" strokeOpacity=".07" strokeWidth="2" />
          <path d="M82 96c0-30 36-30 36 0" fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" />
          <path d="M82 96c0-30 36-30 36 0" fill="none" stroke="#000" strokeOpacity=".08" strokeWidth="2" />
        </g>
      );
    case 'sling':
      return (
        <g>
          <path d="M70 70C48 30 152 30 130 70" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />
          <path d="M70 70C48 30 152 30 130 70" fill="none" stroke="#000" strokeOpacity=".1" strokeWidth="1.5" strokeDasharray="3 4" />
          <rect x="70" y="66" width="60" height="104" rx="14" fill={color} />
          <path d="M70 92h60M70 146h60" stroke="#000" strokeOpacity=".08" strokeWidth="3" />
          <rect x="94" y="102" width="12" height="34" rx="3" fill="#000" opacity=".08" />
        </g>
      );
    case 'straw':
      return (
        <g>
          <ellipse cx="100" cy="158" rx="40" ry="6" fill="#000" opacity=".06" />
          <rect x="62" y="110" width="76" height="44" rx="8" fill={color} />
          <path d="M62 128h76" stroke="#000" strokeOpacity=".07" strokeWidth="2" />
          <path d="M112 110 128 52" stroke={STEEL} strokeWidth="9" strokeLinecap="round" />
          <circle cx="129" cy="50" r="5" fill={STEEL_DARK} />
          <rect x="80" y="100" width="40" height="12" rx="4" fill={color} />
        </g>
      );
    case 'brush':
      return (
        <g>
          <g transform="rotate(-24 100 100)">
            <rect x="94" y="22" width="12" height="96" rx="6" fill={color} />
            <rect x="86" y="118" width="28" height="58" rx="10" fill="#e9e1d4" />
            <path d="M86 128h28M86 138h28M86 148h28M86 158h28M86 168h28" stroke="#000" strokeOpacity=".08" strokeWidth="2" />
          </g>
          <g transform="rotate(14 140 120)">
            <rect x="136" y="70" width="8" height="70" rx="4" fill={color} />
            <rect x="132" y="138" width="16" height="26" rx="6" fill="#e9e1d4" />
          </g>
          <rect x="44" y="66" width="5" height="100" rx="2.5" fill={STEEL_DARK} transform="rotate(10 46 116)" />
        </g>
      );
  }
}
