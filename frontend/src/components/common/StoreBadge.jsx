import { PLAY_STORE_URL, APP_STORE_URL } from "../../constants/appLinks";

// Inline brand marks so the badges stay self-contained (no external requests).
const PLAY_ICON_PATH =
  "M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.397 12l2.5-2.491zM5.864 2.658L16.802 8.99l-2.302 2.302-8.636-8.635z";

const APPLE_ICON_PATH =
  "M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09l-.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z";

const STORES = {
  play: {
    url: PLAY_STORE_URL,
    icon: PLAY_ICON_PATH,
    name: "Google Play",
    tagline: { ge: "ხელმისაწვდომია", en: "Get it on" },
    ariaLabel: { ge: "გადმოწერე Google Play-დან", en: "Download on Google Play" },
  },
  ios: {
    url: APP_STORE_URL,
    icon: APPLE_ICON_PATH,
    name: "App Store",
    tagline: { ge: "გადმოწერე", en: "Download on the" },
    ariaLabel: { ge: "გადმოწერე App Store-დან", en: "Download on the App Store" },
  },
};

// size: "compact" -> single-line, for the tight nav row
//       "sm" / "lg" -> two-line badge with tagline
function StoreBadge({ store, isEnglish, size = "sm", className = "" }) {
  const config = STORES[store];
  if (!config) return null;

  const lang = isEnglish ? "en" : "ge";
  const isLarge = size === "lg";
  const isCompact = size === "compact";

  const padding = isLarge ? "gap-3 px-5 py-3" : isCompact ? "gap-1.5 px-2 py-1.5" : "gap-2 px-3 py-1.5";
  const iconSize = isLarge ? "w-8 h-8" : isCompact ? "w-4 h-4" : "w-5 h-5";

  return (
    <a
      href={config.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={config.ariaLabel[lang]}
      title={isCompact ? config.ariaLabel[lang] : undefined}
      className={`flex items-center shrink-0 bg-[#0070aa] hover:bg-[#005580] text-white rounded-lg transition-colors shadow-sm ${padding} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`shrink-0 ${iconSize}`}
        fill="currentColor"
        aria-hidden="true"
      >
        <path d={config.icon} />
      </svg>
      {isCompact ? (
        // Label is dropped on narrow viewports so the nav row never overflows
        <span className="hidden xl:inline text-xs font-bold whitespace-nowrap">
          {config.name}
        </span>
      ) : (
        <span className="flex flex-col leading-tight text-left whitespace-nowrap">
          <span
            className={`opacity-90 uppercase tracking-wide ${
              isLarge ? "text-[11px]" : "text-[9px]"
            }`}
          >
            {config.tagline[lang]}
          </span>
          <span
            className={`font-bold -mt-0.5 ${isLarge ? "text-lg" : "text-sm"}`}
          >
            {config.name}
          </span>
        </span>
      )}
    </a>
  );
}

export default StoreBadge;
