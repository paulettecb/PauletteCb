import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md';
  /** Accessible label — required since there is no text. */
  label: string;
  /** A single icon element (rounded line icon, ~20px). */
  children: React.ReactNode;
  className?: string;
}

/** Round hairline icon button. Use rounded line icons (Lucide). */
export function IconButton(props: IconButtonProps): JSX.Element;
