import React from 'react';

/**
 * KYN ProductCard — the signature commerce tile.
 * Media area accepts an image (or a placeholder), an optional badge,
 * and a favorite icon button.
 */
export function ProductCard({
  name,
  description,
  price,
  badge = null,        // e.g. <Badge tone="pop">New</Badge>
  favIcon = null,      // icon for the favorite button (e.g. <Heart/>)
  media = null,        // <img/> or placeholder node
  swatches = [],       // array of color hex strings
  interactive = true,
  onFavorite,
  className = '',
  ...rest
}) {
  const classes = ['kyn-product', interactive ? 'kyn-product--interactive' : '', className]
    .filter(Boolean).join(' ');
  return (
    <article className={classes} {...rest}>
      <div className="kyn-product__media">
        {media}
        {badge}
        {favIcon && (
          <button
            type="button"
            className="kyn-iconbtn kyn-iconbtn--sm kyn-product__fav"
            aria-label="Add to favorites"
            onClick={onFavorite}
          >
            {favIcon}
          </button>
        )}
      </div>
      <div className="kyn-product__body">
        <h3 className="kyn-product__name">{name}</h3>
        {description && <p className="kyn-product__desc">{description}</p>}
        <div className="kyn-product__row">
          <span className="kyn-product__price">{price}</span>
          {swatches.length > 0 && (
            <span className="kyn-product__swatches">
              {swatches.map((c, i) => (
                <i key={i} style={{ background: c }} />
              ))}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
