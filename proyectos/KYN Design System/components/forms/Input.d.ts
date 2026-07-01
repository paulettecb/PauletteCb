import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: boolean;
  errorText?: string;
}

/** Text field with periwinkle focus ring and 16px rounded corners. */
export function Input(props: InputProps): JSX.Element;
