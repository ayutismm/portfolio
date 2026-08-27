/*
  Placeholder brand mark.
  REPLACE ME: swap these two shapes for your own logo paths. The `part` class
  names are used by IntroLoader and Footer to animate the pieces independently,
  so keep them if you want those animations to keep working.
*/
export default function Logo({ className = '', partClassName = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        className={partClassName}
        data-part="a"
        x="0"
        y="0"
        width="9.5"
        height="9.5"
        rx="1.5"
        fill="currentColor"
      />
      <rect
        className={partClassName}
        data-part="b"
        x="0"
        y="12.5"
        width="9.5"
        height="9.5"
        rx="1.5"
        fill="currentColor"
      />
      <path
        className={partClassName}
        data-part="c"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24 22H13V0H24V22ZM17.5 17.38H19.5V4.62H17.5V17.38Z"
        fill="currentColor"
      />
    </svg>
  )
}
