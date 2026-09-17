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
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink/60">
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
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`w-full rounded-lg border bg-navy-900/60 px-4 py-2.5 text-sm text-ink outline-none transition-all duration-200 placeholder:text-ink/30 focus:bg-navy-900 disabled:cursor-not-allowed disabled:opacity-50 ${
            error
              ? 'border-red-400/60 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
              : 'border-ink/15 focus:border-gold-500/70 focus:ring-2 focus:ring-gold-500/20'
          } ${rightElement ? 'pr-11' : ''}`}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">{rightElement}</div>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink/35">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export default FormField
