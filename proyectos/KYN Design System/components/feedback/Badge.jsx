import React from 'react';

/** KYN badge / tag. Pastel tones for soft labels; "pop" for the rare hot tag. */
export function Badge({
  tone = 'soft', // 'pop' | 'brand' | 'soft' | 'blush' | 'mint' | 'butter' | 'outline'
  icon = null,
  children,
  className = '',
  ...rest
}) {
  const classes = ['kyn-badge', `kyn-badge--${tone}`, className].filter(Boolean).join(' ');
  return (
    <span className={classes} {...rest}>
      {icon}
      {children}
    </span>
  );
}
