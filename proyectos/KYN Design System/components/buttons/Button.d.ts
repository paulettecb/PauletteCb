import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. Periwinkle primary by default; use "pop" sparingly. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'pop';
  /** Size token. */
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  /** Optional icon element rendered before the label. */
  iconLeft?: React.ReactNode;
  /** Optional icon element rendered after the label. */
  iconRight?: React.ReactNode;
  /** Render as a different element, e.g. "a". */
  as?: 'button' | 'a';
  children?: React.ReactNode;
  className?: string;
}

/**
 * KYN pill button. Primary = periwinkle, the standard action color.
 * @startingPoint section="Components" subtitle="Pill button — primary action" viewport="700x200"
 */
export function Button(props: ButtonProps): JSX.Element;
