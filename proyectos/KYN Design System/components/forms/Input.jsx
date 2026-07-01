import React from 'react';

/** KYN text input with optional label and hint/error. */
export function Input({
  label,
  hint,
  error = false,
  errorText,
  id,
  className = '',
  ...rest
}) {
  const inputId = id || (label ? `kyn-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const inputClasses = ['kyn-input', error ? 'kyn-input--error' : '', className]
    .filter(Boolean).join(' ');
  return (
    <div className="kyn-field">
      {label && <label className="kyn-field__label" htmlFor={inputId}>{label}</label>}
      <input id={inputId} className={inputClasses} aria-invalid={error || undefined} {...rest} />
      {(error && errorText) ? (
        <span className="kyn-field__hint" style={{ color: 'var(--danger)' }}>{errorText}</span>
      ) : hint ? (
        <span className="kyn-field__hint">{hint}</span>
      ) : null}
    </div>
  );
}
