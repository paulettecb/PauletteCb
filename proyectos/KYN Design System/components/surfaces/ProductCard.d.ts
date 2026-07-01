import React from 'react';

export interface ProductCardProps extends React.HTMLAttributes<HTMLElement> {
  name: string;
  description?: string;
  /** Formatted price string, e.g. "$25". */
  price: string;
  /** Optional status badge node (use <Badge/>). */
  badge?: React.ReactNode;
  /** Favorite icon (e.g. Lucide <Heart/>); renders a small icon button. */
  favIcon?: React.ReactNode;
  /** Product image or placeholder node. */
  media?: React.ReactNode;
  /** Color swatch hexes shown bottom-right. */
  swatches?: string[];
  interactive?: boolean;
  onFavorite?: () => void;
}

/**
 * Signature KYN product tile — serif name, price, color swatches, hover lift.
 * @startingPoint section="Components" subtitle="Commerce product tile" viewport="700x420"
 */
export function ProductCard(props: ProductCardProps): JSX.Element;
