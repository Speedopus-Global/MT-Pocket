export default function MtPocketLogo({ className = "w-6 h-6", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Outer pocket silhouette */}
      <path
        d="M5 4.5C5 3.67157 5.67157 3 6.5 3H17.5C18.3284 3 19 3.67157 19 4.5V11.5C19 16.2 15.87 20 12 20C8.13 20 5 16.2 5 11.5V4.5Z"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner pocket chevron / arrow */}
      <path
        d="M8.5 10L12 13.5L15.5 10"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
