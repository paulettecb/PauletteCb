import React from 'react';

/**
 * KYN IconButton — a round, hairline icon affordance.
 * Pass a single icon element (e.g. a Lucide icon) as children.
 */
export function IconButton({
  size = 'md',        // 'sm' | 'md'
  label,              // accessible label (required)
  children,
  className = '',
  ...rest
}) {
  const classes = ['kyn-iconbtn', `kyn-iconbtn--${size}`, className]
    .filter(Boolean).join(' ');
  return (
    <button type="button" className={classes} aria-label={label} {...rest}>
      {children}
    </button>
  );
}
