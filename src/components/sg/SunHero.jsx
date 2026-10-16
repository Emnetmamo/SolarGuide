export function SunHero() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm" aria-hidden>
      <div className="animate-float-sun absolute right-4 top-2 h-28 w-28 rounded-full bg-sun-glow" />
      <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full">
        <path d="M200 70 C 170 140, 120 170, 80 250" fill="none" stroke="oklch(var(--sun))" strokeWidth="3" className="animate-flow" />
        <rect x="40" y="250" width="70" height="30" rx="6" fill="oklch(var(--primary-foreground))" opacity="0.9" />
        <text x="75" y="270" textAnchor="middle" fontSize="12" fill="oklch(var(--primary))" fontWeight="700">
          HOME
        </text>
      </svg>
      <div className="absolute bottom-16 left-1/2 w-56 -translate-x-1/2 [perspective:600px]">
        <div className="relative h-36 overflow-hidden rounded-lg border-4 border-primary-foreground/80 bg-panel-cells shadow-lift [transform:rotateX(38deg)]">
          <div className="animate-sweep absolute inset-y-0 w-1/2 bg-panel-shine" />
        </div>
      </div>
    </div>
  );
}