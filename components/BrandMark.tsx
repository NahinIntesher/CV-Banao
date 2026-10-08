/** Original CV Banao monogram: an open page and a forward check. */
export default function BrandMark({ size = 38 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="1" width="46" height="46" rx="14" fill="currentColor" />
      <path
        d="M29 12H19a7 7 0 0 0-7 7v10a7 7 0 0 0 7 7h11"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="m22 24 6 7 10-15"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 18h7"
        stroke="white"
        strokeOpacity=".5"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
