export function ElectionBannerFallback({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1600 500"
      preserveAspectRatio="xMidYMid slice"
      className={`absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="ebf-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#15100D" />
          <stop offset="100%" stopColor="#0C0A09" />
        </linearGradient>
        <radialGradient id="ebf-beam" cx="50%" cy="0%" r="85%">
          <stop offset="0%" stopColor="#E8C547" stopOpacity="0.22" />
          <stop offset="55%" stopColor="#D4A574" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#D4A574" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ebf-glow" cx="50%" cy="100%" r="60%">
          <stop offset="0%" stopColor="#E8C547" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#E8C547" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1600" height="500" fill="url(#ebf-bg)" />

      <g opacity="0.9">
        <polygon points="480,-40 620,-40 900,540 660,540" fill="url(#ebf-beam)" />
        <polygon points="760,-40 860,-40 980,540 780,540" fill="url(#ebf-beam)" />
        <polygon points="980,-40 1120,-40 1300,540 1000,540" fill="url(#ebf-beam)" />
      </g>

      <ellipse cx="800" cy="500" rx="700" ry="120" fill="url(#ebf-glow)" />

      <g fill="#E8C547">
        <path d="M220 120 l6 16 16 6 -16 6 -6 16 -6 -16 -16 -6 16 -6 z" opacity="0.55" />
        <path d="M1360 90 l5 13 13 5 -13 5 -5 13 -5 -13 -13 -5 13 -5 z" opacity="0.45" />
        <path d="M1120 210 l4 11 11 4 -11 4 -4 11 -4 -11 -11 -4 11 -4 z" opacity="0.4" />
        <path d="M340 260 l4 11 11 4 -11 4 -4 11 -4 -11 -11 -4 11 -4 z" opacity="0.35" />
        <path d="M1460 300 l5 13 13 5 -13 5 -5 13 -5 -13 -13 -5 13 -5 z" opacity="0.4" />
        <path d="M90 340 l4 11 11 4 -11 4 -4 11 -4 -11 -11 -4 11 -4 z" opacity="0.3" />
      </g>

      <g fill="#FAF7F2" opacity="0.5">
        <circle cx="500" cy="80" r="1.6" />
        <circle cx="700" cy="150" r="1.6" />
        <circle cx="1000" cy="60" r="1.6" />
        <circle cx="1250" cy="180" r="1.6" />
        <circle cx="180" cy="220" r="1.6" />
        <circle cx="1500" cy="150" r="1.6" />
      </g>
    </svg>
  );
}
