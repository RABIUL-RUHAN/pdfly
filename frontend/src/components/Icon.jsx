// A small, consistent line-icon set for the tool grid and sidebar.
// Every icon shares the same stroke weight and a 24x24 canvas so the
// grid reads as one family, with color coming from the tool's accent.
export default function Icon({ name, size = 22 }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (name) {
    case "merge":
      return (
        <svg {...props}>
          <path d="M6 3v8.5a3.5 3.5 0 0 0 3.5 3.5H14" />
          <path d="M18 3v8.5a3.5 3.5 0 0 1-3.5 3.5" />
          <path d="M11 12.5 14 15l-3 2.5" />
          <path d="M12 17v4" />
        </svg>
      );
    case "split":
      return (
        <svg {...props}>
          <rect x="4" y="3" width="7" height="18" rx="1.3" />
          <rect x="13" y="3" width="7" height="18" rx="1.3" />
          <path d="M11 12h2" strokeDasharray="1.5 2.2" />
        </svg>
      );
    case "compress":
      return (
        <svg {...props}>
          <path d="M4 9V5a1.5 1.5 0 0 1 1.5-1.5H9" />
          <path d="M20 9V5a1.5 1.5 0 0 0-1.5-1.5H15" />
          <path d="M4 15v4a1.5 1.5 0 0 0 1.5 1.5H9" />
          <path d="M20 15v4a1.5 1.5 0 0 1-1.5 1.5H15" />
          <path d="M9 9 6.5 6.5M15 9l2.5-2.5M9 15l-2.5 2.5M15 15l2.5 2.5" />
        </svg>
      );
    case "convert":
      return (
        <svg {...props}>
          <rect x="3.5" y="4.5" width="12" height="15" rx="1.3" />
          <circle cx="8" cy="10" r="1.3" />
          <path d="M5.5 17.5 9 13.8l2 2.1 3.5-4 2 2.4" />
          <path d="M18 8v6M18 8l-2 2M18 8l2 2" />
        </svg>
      );
    case "imagetopdf":
      return (
        <svg {...props}>
          <rect x="3.5" y="4.5" width="11" height="14" rx="1.3" />
          <circle cx="7.3" cy="9" r="1.1" />
          <path d="M5 15.5 8 12l2 2 2.5-3 2 2.5" />
          <path d="M18 9v9M15 15.5 18 18l3-2.5" />
        </svg>
      );
    case "toword":
      return (
        <svg {...props}>
          <path d="M7 3.5h7L18 7.5V19a1.3 1.3 0 0 1-1.3 1.3H7A1.3 1.3 0 0 1 5.7 19V4.8A1.3 1.3 0 0 1 7 3.5Z" />
          <path d="M14 3.5V7h3.7" />
          <path d="M8 13l1.4 5 1.4-4 1.4 4L13.6 13" />
        </svg>
      );
    case "wordtopdf":
      return (
        <svg {...props}>
          <path d="M7 3.5h7L18 7.5V19a1.3 1.3 0 0 1-1.3 1.3H7A1.3 1.3 0 0 1 5.7 19V4.8A1.3 1.3 0 0 1 7 3.5Z" />
          <path d="M14 3.5V7h3.7" />
          <path d="M8.5 12.5h3.2a1.6 1.6 0 0 1 0 3.2H9v2.3" strokeDasharray="0" />
          <path d="M13.5 12.5v5.5" />
        </svg>
      );
    case "watermark":
      return (
        <svg {...props}>
          <path d="M12 3c2 2.2 4 4.6 4 7.2a4 4 0 0 1-8 0C8 7.6 10 5.2 12 3Z" />
          <path d="M6.5 19.5c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0" />
        </svg>
      );
    case "rotate":
      return (
        <svg {...props}>
          <path d="M4.5 12a7.5 7.5 0 1 1 2.4 5.5" />
          <path d="M4.5 17v-4.2h4.2" />
        </svg>
      );
    case "editpdf":
      return (
        <svg {...props}>
          <path d="M6 3.5h8.5L19 8v12.2a1.3 1.3 0 0 1-1.3 1.3H6a1.3 1.3 0 0 1-1.3-1.3V4.8A1.3 1.3 0 0 1 6 3.5Z" />
          <path d="M14.3 3.5V8H19" />
          <path d="m10 17.5 1-3 5.3-5.3a1.2 1.2 0 0 1 1.7 1.7L12.9 16.3l-2.9 1.2Z" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
        </svg>
      );
  }
}
