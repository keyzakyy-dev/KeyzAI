export function KeyMark({ className, ...rest }) {
  return (
    <svg
      viewBox="0 0 15 15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <circle cx="4.3" cy="7.5" r="2.9" />
      <circle cx="4.3" cy="7.5" r="0.8" />
      <path d="M7.2 7.5h6.3M11 7.5v2.3M13.5 7.5v2.9" />
    </svg>
  )
}
