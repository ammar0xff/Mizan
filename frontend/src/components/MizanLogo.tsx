interface MizanLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
  theme?: "light" | "dark" | "auto";
  locale?: "ar" | "en";
  showWordmark?: boolean;
}

export function MizanLogo({
  className = "",
  size = "md",
  variant = "full",
  theme = "auto",
  locale,
  showWordmark = true,
}: MizanLogoProps) {
  const actualVariant = showWordmark === false ? "icon" : variant;
  // Determine text direction from HTML if locale not passed
  const isArabic =
    locale === "ar" ||
    (typeof document !== "undefined" && document.documentElement.lang === "ar");

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  // Icon SVG: The signature origami geometric M emblem symbolizing balance & architectural equilibrium
  const Mark = (
    <svg
      viewBox="0 0 48 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${iconSizes[size]} shrink-0 transition-transform duration-300 hover:scale-105`}
      aria-hidden="true"
    >
      <defs>
        {/* Subtle linear gradients for rich origami faceting */}
        <linearGradient id="mizan-left-outer" x1="4" y1="4" x2="16" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8A293B" />
          <stop offset="100%" stopColor="#5E1B28" />
        </linearGradient>
        <linearGradient id="mizan-left-inner" x1="12" y1="4" x2="24" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#48151F" />
          <stop offset="100%" stopColor="#2E0D14" />
        </linearGradient>
        <linearGradient id="mizan-right-inner" x1="36" y1="4" x2="24" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#48151F" />
          <stop offset="100%" stopColor="#2E0D14" />
        </linearGradient>
        <linearGradient id="mizan-right-outer" x1="44" y1="4" x2="32" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8A293B" />
          <stop offset="100%" stopColor="#5E1B28" />
        </linearGradient>
      </defs>

      {/* Left Outer Facet */}
      <polygon
        points="3,36 9,6 18,17 11,36"
        fill="url(#mizan-left-outer)"
      />
      {/* Left Inner Fold */}
      <polygon
        points="9,6 24,36 18,17"
        fill="url(#mizan-left-inner)"
      />
      {/* Right Inner Fold */}
      <polygon
        points="39,6 24,36 30,17"
        fill="url(#mizan-right-inner)"
      />
      {/* Right Outer Facet */}
      <polygon
        points="45,36 39,6 30,17 37,36"
        fill="url(#mizan-right-outer)"
      />
      {/* Subtle top highlights for metallic/origami architectural edge */}
      <polygon
        points="9,6 12,10 18,17"
        fill="#A63A4E"
        opacity="0.35"
      />
      <polygon
        points="39,6 36,10 30,17"
        fill="#A63A4E"
        opacity="0.35"
      />
    </svg>
  );

  if (actualVariant === "icon") {
    return <div className={`inline-flex items-center ${className}`}>{Mark}</div>;
  }

  // Text color based on theme
  const textColorClass =
    theme === "dark"
      ? "text-[#FAF6F0]"
      : theme === "light"
      ? "text-[#262321]"
      : "text-foreground";

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {Mark}
      <span
        className={`font-semibold tracking-tight ${textSizes[size]} ${textColorClass} ${
          isArabic ? "font-serif-ar pt-0.5" : "font-serif-en tracking-wide"
        }`}
      >
        {isArabic ? "ميزان" : "Mizan"}
      </span>
    </div>
  );
}

export default MizanLogo;
