import { Link } from 'react-router-dom'
import Spinner from '../Spinner.jsx'

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}
const SIZES = { sm: 'btn-sm', md: '', lg: 'btn-lg' }

/**
 * The one button. Renders a router <Link> when given `to`, an <a> when
 * given `href`, otherwise a <button>. Styling lives in the btn-* utilities
 * in index.css so non-React markup can match it exactly.
 */
function Button({
  variant = 'primary',
  size = 'md',
  to,
  href,
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}) {
  const classes = `btn ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim()
  const content = (
    <>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    )
  }
  return (
    <button type={type} disabled={disabled || loading} className={classes} {...rest}>
      {content}
    </button>
  )
}

export default Button
