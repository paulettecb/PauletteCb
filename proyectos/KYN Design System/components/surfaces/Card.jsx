import React from 'react';

/** KYN surface card — soft rounded container with low periwinkle-tinted shadow. */
export function Card({
  interactive = false,
  as = 'div',
  children,
  className = '',
  ...rest
}) {
  const Tag = as;
  const classes = ['kyn-card', interactive ? 'kyn-card--interactive' : '', className]
    .filter(Boolean).join(' ');
  return <Tag className={classes} {...rest}>{children}</Tag>;
}
