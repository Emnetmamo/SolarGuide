/** Small line illustrations for the issue cards — no external images, nothing to load. */
export function IssueIllustration({ kind = "dust", className }) {
  const common = "h-24 w-full";
  if (kind === "dust") {
    return (
      <svg viewBox="0 0 120 80" className={className ?? common} role="img" aria-label="Illustration of dusty panels">
        <rect x="8" y="18" width="104" height="46" rx="6" fill="oklch(0.3 0.06 250)" stroke="oklch(0.55 0.05 250)" />
        <g stroke="oklch(0.75 0.03 250)" strokeWidth="1">
          <path d="M43 18v46M78 18v46M8 41h104" />
        </g>
        <g fill="oklch(0.86 0.05 85)">
          <circle cx="30" cy="30" r="2.4" />
          <circle cx="58" cy="52" r="2" />
          <circle cx="86" cy="32" r="2.6" />
          <circle cx="98" cy="56" r="1.8" />
          <circle cx="22" cy="56" r="1.7" />
        </g>
      </svg>
    );
  }
  if (kind === "shade") {
    return (
      <svg viewBox="0 0 120 80" className={className ?? common} role="img" aria-label="Illustration of shade over panels">
        <circle cx="96" cy="20" r="11" fill="oklch(0.84 0.15 88)" />
        <rect x="34" y="42" width="78" height="30" rx="5" fill="oklch(0.3 0.06 250)" stroke="oklch(0.55 0.05 250)" />
        <path d="M34 42 L60 72 H34Z" fill="oklch(0.55 0.03 250)" opacity="0.75" />
        <path d="M40 42 L82 72 H54Z" fill="oklch(0.62 0.03 250)" opacity="0.55" />
        <path d="M22 74V52" stroke="oklch(0.45 0.09 60)" strokeWidth="5" strokeLinecap="round" />
        <circle cx="22" cy="44" r="14" fill="oklch(0.6 0.12 145)" />
      </svg>
    );
  }
  if (kind === "inverter") {
    return (
      <svg viewBox="0 0 120 80" className={className ?? common} role="img" aria-label="Illustration of an inverter display">
        <rect x="34" y="10" width="52" height="60" rx="8" fill="oklch(0.98 0.01 95)" stroke="oklch(0.6 0.03 160)" strokeWidth="2" />
        <rect x="42" y="20" width="36" height="20" rx="4" fill="oklch(0.35 0.06 180)" />
        <text x="60" y="34" textAnchor="middle" fontSize="9" fill="oklch(0.95 0.03 120)" fontFamily="monospace">
          3.2 kW
        </text>
        <circle cx="50" cy="56" r="4" fill="oklch(0.55 0.16 145)" />
        <circle cx="62" cy="56" r="4" fill="oklch(0.84 0.15 88)" />
        <circle cx="74" cy="56" r="4" fill="oklch(0.62 0.03 250)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 80" className={className ?? common} role="img" aria-label="Illustration of a qualified installer">
      <rect x="10" y="24" width="60" height="34" rx="5" fill="oklch(0.3 0.06 250)" stroke="oklch(0.55 0.05 250)" />
      <path d="M70 41h14" stroke="oklch(0.55 0.16 145)" strokeWidth="3" strokeDasharray="4 3" />
      <rect x="84" y="26" width="26" height="30" rx="5" fill="oklch(0.98 0.01 95)" stroke="oklch(0.6 0.03 160)" strokeWidth="2" />
      <circle cx="97" cy="41" r="6" fill="oklch(0.4 0.08 160)" />
      <path d="M18 66h84" stroke="oklch(0.75 0.02 160)" strokeWidth="3" strokeLinecap="round" />
      <text x="60" y="76" textAnchor="middle" fontSize="8" fill="oklch(0.47 0.03 160)">
        qualified installer only
      </text>
    </svg>
  );
}