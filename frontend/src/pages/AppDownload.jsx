import { useEffect, useState } from "react";
import StoreBadge from "../components/common/StoreBadge";
import { PLAY_STORE_URL, APP_STORE_URL } from "../constants/appLinks";
import appQrCode from "/src/assets/images/app-download-qr.svg";

// Detect the platform so a QR scan lands on the right store.
function detectPlatform() {
  if (typeof navigator === "undefined") return "other";

  const ua = navigator.userAgent || "";

  if (/Android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/i.test(ua)) return "ios";

  // iPadOS 13+ reports a desktop Safari UA — fall back to touch-point sniffing
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return "ios";

  return "other";
}

const content = {
  ge: {
    title: "მობილური აპლიკაცია",
    subtitle: "სტატისტიკური ბიზნეს რეგისტრი",
    redirecting: "გადამისამართება პლატფორმაზე...",
    chooseStore: "აირჩიეთ თქვენი მოწყობილობის შესაბამისი პლატფორმა",
    scanHint: "ან დაასკანერეთ QR კოდი ტელეფონით",
    backHome: "მთავარ გვერდზე დაბრუნება",
  },
  en: {
    title: "Mobile Application",
    subtitle: "Statistical Business Register",
    redirecting: "Redirecting to the store...",
    chooseStore: "Choose the store for your device",
    scanHint: "Or scan the QR code with your phone",
    backHome: "Back to home page",
  },
};

function AppDownload({ isEnglish }) {
  const t = content[isEnglish ? "en" : "ge"];
  const [platform, setPlatform] = useState(null);

  useEffect(() => {
    const detected = detectPlatform();
    setPlatform(detected);

    if (detected === "android") {
      window.location.replace(PLAY_STORE_URL);
    } else if (detected === "ios") {
      window.location.replace(APP_STORE_URL);
    }
  }, []);

  const isRedirecting = platform === "android" || platform === "ios";

  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 font-bpg-nino">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center">
        {t.title}
      </h1>
      <p className="text-[#0080be] text-lg font-bold mt-1 text-center">
        {t.subtitle}
      </p>

      {isRedirecting ? (
        <div className="flex flex-col items-center gap-4 mt-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0080BE]" />
          <p className="text-gray-600">{t.redirecting}</p>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mt-8 text-center">{t.chooseStore}</p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-5">
            <StoreBadge store="play" isEnglish={isEnglish} size="lg" />
            <StoreBadge store="ios" isEnglish={isEnglish} size="lg" />
          </div>

          <p className="text-gray-500 text-sm mt-10 text-center">
            {t.scanHint}
          </p>
          <div className="mt-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <img
              src={appQrCode}
              alt={t.scanHint}
              width="180"
              height="180"
              className="w-[180px] h-[180px]"
            />
          </div>
        </>
      )}

      <a
        href="/"
        className="mt-10 text-[#0080BE] hover:text-[#005580] hover:underline text-sm transition-colors"
      >
        {t.backHome}
      </a>
    </div>
  );
}

export default AppDownload;
