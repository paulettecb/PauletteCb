import React from 'react';

/** KYN checkbox. Pass a check icon as `checkIcon` (e.g. Lucide <Check/>). */
export function Checkbox({
  label,
  checked,
  defaultChecked,
  onChange,
  checkIcon = null,
  className = '',
  ...rest
}) {
  return (
    <label className={['kyn-check', className].filter(Boolean).join(' ')}>
      <input
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        {...rest}
      />
      <span className="kyn-check__box">{checkIcon}</span>
      {label && <span>{label}</span>}
    </label>
  );
}
