import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** Adds hover lift + pointer cursor. */
  interactive?: boolean;
  as?: keyof JSX.IntrinsicElements;
  children?: React.ReactNode;
}

/** Generic rounded surface container. */
export function Card(props: CardProps): JSX.Element;
