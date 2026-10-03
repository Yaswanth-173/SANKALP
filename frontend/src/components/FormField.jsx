function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  autoComplete,
  hint,
  rightElement,
  disabled = false,
  ...rest
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-fg-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          {...rest}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`h-11 w-full rounded-lg border bg-surface px-3.5 text-sm text-fg outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-fg-subtle hover:border-fg-subtle/60 disabled:cursor-not-allowed disabled:opacity-50 ${
            error
              ? 'border-danger/70 focus:border-danger focus:ring-4 focus:ring-danger/15'
              : 'border-line focus:border-gold-500 focus:ring-4 focus:ring-gold-500/15'
          } ${rightElement ? 'pr-11' : ''}`}
        />
        {rightElement && <div className="absolute inset-y-0 right-0 flex items-center pr-3">{rightElement}</div>}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 text-xs text-danger">
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0">
            <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1Zm0 3.25a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0V5A.75.75 0 0 0 8 4.25ZM8 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
          </svg>
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export default FormField
