// Mobile app store links for the Statistical Business Register app.
// Shared by the header badges and the /app device-aware redirect page.

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=ge.geostat.businessregister";

export const APP_STORE_URL =
  "https://apps.apple.com/us/app/business-register/id6795051115";

// The URL encoded in the QR code — points at the /app route below, which
// forwards the visitor to the store matching their device.
// Keep in sync with src/assets/images/app-download-qr.svg if it ever changes.
export const APP_DOWNLOAD_URL = "https://br.geostat.ge/app";
