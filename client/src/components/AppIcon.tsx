interface AppIconProps {
  name:
    | "search"
    | "bell"
    | "plus"
    | "posts"
    | "user"
    | "mail"
    | "settings"
    | "menu"
    | "close"
    | "chevron-left"
    | "chevron-right"
    | "map-pin"
    | "tag"
    | "bookmark"
    | "message-circle"
    | "share";
  size?: number;
  className?: string;
}

export function AppIcon({ name, size = 18, className }: AppIconProps) {
  const baseProps = {
    className: className ?? "ui-icon",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": "true"
  };

  if (name === "search") {
    return (
      <svg {...baseProps}>
        <circle cx="11" cy="11" r="7" />
        <line x1="20" y1="20" x2="16.65" y2="16.65" />
      </svg>
    );
  }
  if (name === "bell") {
    return (
      <svg {...baseProps}>
        <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V10a6 6 0 1 0-12 0v4.2c0 .5-.2 1-.6 1.4L4 17h5" />
        <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
      </svg>
    );
  }
  if (name === "plus") {
    return (
      <svg {...baseProps}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    );
  }
  if (name === "posts") {
    return (
      <svg {...baseProps}>
        <rect x="4" y="4" width="7" height="7" rx="1.4" />
        <rect x="13" y="4" width="7" height="7" rx="1.4" />
        <rect x="4" y="13" width="7" height="7" rx="1.4" />
        <rect x="13" y="13" width="7" height="7" rx="1.4" />
      </svg>
    );
  }
  if (name === "user") {
    return (
      <svg {...baseProps}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.8-3.2 5-5 8-5s6.2 1.8 8 5" />
      </svg>
    );
  }
  if (name === "mail") {
    return (
      <svg {...baseProps}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <polyline points="3 7 12 13 21 7" />
      </svg>
    );
  }
  if (name === "settings") {
    return (
      <svg {...baseProps}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1 0 2.8 2 2 0 0 1-2.8 0l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 0 1-2.8 0 2 2 0 0 1 0-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 0 1 0-2.8 2 2 0 0 1 2.8 0l.1.1a1.7 1.7 0 0 0 1.9.3h.1A1.7 1.7 0 0 0 10 3.2V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 0 1 2.8 0 2 2 0 0 1 0 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
    );
  }
  if (name === "menu") {
    return (
      <svg {...baseProps}>
        <line x1="4" y1="7" x2="20" y2="7" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="17" x2="20" y2="17" />
      </svg>
    );
  }
  if (name === "close") {
    return (
      <svg {...baseProps}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }
  if (name === "chevron-left") {
    return (
      <svg {...baseProps}>
        <polyline points="15 18 9 12 15 6" />
      </svg>
    );
  }
  if (name === "chevron-right") {
    return (
      <svg {...baseProps}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    );
  }
  if (name === "map-pin") {
    return (
      <svg {...baseProps}>
        <path d="M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }
  if (name === "tag") {
    return (
      <svg {...baseProps}>
        <path d="M20 12l-8 8-9-9 8-8h6l3 3z" />
        <circle cx="14.5" cy="8.5" r="1.4" />
      </svg>
    );
  }
  if (name === "bookmark") {
    return (
      <svg {...baseProps}>
        <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" />
      </svg>
    );
  }
  if (name === "message-circle") {
    return (
      <svg {...baseProps}>
        <path d="M21 11.5a8.5 8.5 0 1 1-4.3-7.4A8.4 8.4 0 0 1 21 11.5z" />
        <path d="M8.5 19.2 7 22l2.9-1.6" />
      </svg>
    );
  }
  if (name === "share") {
    return (
      <svg {...baseProps}>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.8" y1="10.8" x2="15.2" y2="6.2" />
        <line x1="8.8" y1="13.2" x2="15.2" y2="17.8" />
      </svg>
    );
  }

  return null;
}
