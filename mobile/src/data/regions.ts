import type { Lang } from '../types';

/**
 * `/api/enterprise-birth-region` returns English column identifiers regardless
 * of the `lang` parameter, so labels are mapped here for display.
 */
const REGION_LABELS: Record<string, Record<Lang, string>> = {
  Tbilisi: { ka: 'ქ. თბილისი', en: 'Tbilisi' },
  Abkhazia_A_R: { ka: 'აფხაზეთის ა.რ', en: 'Abkhazia A.R.' },
  Adjara: { ka: 'აჭარის ა.რ', en: 'Adjara A.R.' },
  Guria: { ka: 'გურია', en: 'Guria' },
  Imereti: { ka: 'იმერეთი', en: 'Imereti' },
  Kakheti: { ka: 'კახეთი', en: 'Kakheti' },
  Mtskheta_Mtianeti: { ka: 'მცხეთა-მთიანეთი', en: 'Mtskheta-Mtianeti' },
  Racha_Lechkhumi_and_Kvemo_Svaneti: { ka: 'რაჭა-ლეჩხუმი', en: 'Racha-Lechkhumi' },
  Samegrelo_Zemo_Svaneti: { ka: 'სამეგრელო-ზ. სვანეთი', en: 'Samegrelo-Z. Svaneti' },
  Samtskhe_Javakheti: { ka: 'სამცხე-ჯავახეთი', en: 'Samtskhe-Javakheti' },
  Kvemo_Kartli: { ka: 'ქვემო ქართლი', en: 'Kvemo Kartli' },
  Shida_Kartli: { ka: 'შიდა ქართლი', en: 'Shida Kartli' },
  Unknown: { ka: 'უცნობი', en: 'Unknown' },
};

export function regionLabel(key: string, lang: Lang): string {
  const entry = REGION_LABELS[key];
  if (entry) return entry[lang] ?? entry.ka;
  return String(key).replace(/_/g, ' ');
}
