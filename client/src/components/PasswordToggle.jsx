function PasswordToggle({ visible, onToggle, label = 'password' }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? `Hide ${label}` : `Show ${label}`}
      className="text-ink/40 transition-colors duration-200 hover:text-gold-400"
    >
      {visible ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4.5 w-4.5">
          <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.83 2.83M9.5 5.6C10.3 5.2 11.1 5 12 5c5 0 8.5 4.5 9.5 7-.4 1-1 2-1.8 2.9M6.2 6.6C4 8.1 2.5 10.2 2.5 12c1 2.5 4.5 7 9.5 7 1.4 0 2.7-.3 3.9-.9" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4.5 w-4.5">
          <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  )
}

export default PasswordToggle
