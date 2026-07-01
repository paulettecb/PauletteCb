import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  /** Icon shown when checked (e.g. a Lucide Check, ~14px). */
  checkIcon?: React.ReactNode;
}

/** Periwinkle checkbox with rounded box. */
export function Checkbox(props: CheckboxProps): JSX.Element;
