import { PLAY_STORE_URL, APP_STORE_URL } from "../../constants/appLinks";
// Apple ships an official English badge — used as-is on the English site.
// The Georgian variant is drawn below, since Apple provides no Georgian artwork.
import appleBadgeEn from "/src/assets/images/Download_on_the_App_Store_Badge_US.svg";

// Official-style store badges drawn inline as SVG so the page stays
// self-contained (no external image requests, crisp at any size).
//
// Google Play mark colours are taken from the official logo artwork:
//   left fan #3BCCFF · top #48FF48 · bottom #FF3333 · tip #FFD400
const BADGE_FONT = "Roboto, 'Helvetica Neue', Arial, Helvetica, sans-serif";

function PlayBadge({ tagline }) {
  return (
    <svg
      viewBox="0 0 140 40"
      className="h-full w-auto block"
      role="img"
      aria-hidden="true"
    >
      <rect x="0" y="0" width="140" height="40" rx="6" fill="#000000" />
      <g transform="translate(8.21, 8.81) scale(0.931)">
        <path
          fill="#3BCCFF"
          d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92z"
        />
        <path fill="#48FF48" d="M5.864 2.658L16.802 8.99l-2.302 2.302-8.636-8.635z" />
        <path fill="#FF3333" d="M14.499 12.707l2.302 2.302-10.937 6.333 8.635-8.635z" />
        <path
          fill="#FFD400"
          d="M17.698 9.509l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.397 12l2.5-2.491z"
        />
      </g>
      <text
        x="33"
        y="15.5"
        fill="#ffffff"
        fontFamily={BADGE_FONT}
        fontSize="11"
        letterSpacing="0.4"
      >
        {tagline}
      </text>
      <text
        x="33"
        y="30.5"
        fill="#ffffff"
        fontFamily={BADGE_FONT}
        fontSize="14.5"
        fontWeight="500"
      >
        Google Play
      </text>
    </svg>
  );
}

function AppleBadge({ tagline }) {
  return (
    <svg
      viewBox="0 0 111 40"
      className="h-full w-auto block"
      role="img"
      aria-hidden="true"
    >
      <rect x="0" y="0" width="111" height="40" rx="6" fill="#000000" />
      <g transform="translate(8.31, 8.61) scale(0.963)">
        <path
          fill="#ffffff"
          d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09l-.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
        />
      </g>
      <text
        x="33"
        y="15.5"
        fill="#ffffff"
        fontFamily={BADGE_FONT}
        fontSize="11"
        letterSpacing="0.2"
      >
        {tagline}
      </text>
      <text
        x="33"
        y="30.5"
        fill="#ffffff"
        fontFamily={BADGE_FONT}
        fontSize="14.5"
        fontWeight="500"
      >
        App Store
      </text>
    </svg>
  );
}

const STORES = {
  play: {
    url: PLAY_STORE_URL,
    Badge: PlayBadge,
    tagline: { ge: "ხელმისაწვდომია", en: "GET IT ON" },
    ariaLabel: { ge: "გადმოწერე Google Play-დან", en: "Get it on Google Play" },
  },
  ios: {
    url: APP_STORE_URL,
    Badge: AppleBadge,
    tagline: { ge: "გადმოწერე", en: "Download on the" },
    ariaLabel: { ge: "გადმოწერე App Store-დან", en: "Download on the App Store" },
  },
};

// size: "compact" (nav row — shrinks on mid-size screens so the row stays on one line)
//       "sm" | "lg" (modal / download page)
const HEIGHTS = { compact: "h-8 xl:h-9", sm: "h-10", lg: "h-14" };

function StoreBadge({ store, isEnglish, size = "sm", className = "" }) {
  const config = STORES[store];
  if (!config) return null;

  const lang = isEnglish ? "en" : "ge";
  const { Badge } = config;

  // English App Store uses Apple's official artwork; everything else is drawn inline.
  const useOfficialApple = store === "ios" && isEnglish;

  return (
    <a
      href={config.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={config.ariaLabel[lang]}
      title={config.ariaLabel[lang]}
      className={`shrink-0 rounded-md hover:opacity-85 transition-opacity ${
        HEIGHTS[size] || HEIGHTS.sm
      } ${className}`}
    >
      {useOfficialApple ? (
        <img
          src={appleBadgeEn}
          alt=""
          className="h-full w-auto block"
          aria-hidden="true"
        />
      ) : (
        <Badge tagline={config.tagline[lang]} />
      )}
    </a>
  );
}

export default StoreBadge;
