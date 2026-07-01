import React from 'react';

/**
 * KYN Button — the primary action element.
 * Periwinkle is the default action color; "pop" (magenta) is reserved
 * for one rare high-emphasis moment per view.
 */
export function Button({
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'pop'
  size = 'md',         // 'sm' | 'md' | 'lg'
  disabled = false,
  iconLeft = null,
  iconRight = null,
  as = 'button',
  children,
  className = '',
  ...rest
}) {
  const Tag = as;
  const classes = [
    'kyn-btn',
    `kyn-btn--${variant}`,
    `kyn-btn--${size}`,
    disabled ? 'kyn-btn--disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Tag className={classes} disabled={Tag === 'button' ? disabled : undefined} {...rest}>
      {iconLeft}
      {children}
      {iconRight}
    </Tag>
  );
}
