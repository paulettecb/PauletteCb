import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color tone. Use "pop" sparingly for the one hot label per view. */
  tone?: 'pop' | 'brand' | 'soft' | 'blush' | 'mint' | 'butter' | 'outline';
  /** Optional small icon before the label. */
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/** Uppercase pill tag for product status, categories, and labels. */
export function Badge(props: BadgeProps): JSX.Element;
