const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_URL || "https://br-api.geostat.ge/api";

// ─── Constants ───────────────────────────────────────────────────────────────

const NACE_SECTION_ORDER = ["B","C","D","E","F","G","H","I","J","K","L","M","N","P","Q","R","S","unknown"];
const NACE_BIRTH_YEARS   = ["2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"];
const NACE_DEATH_YEARS   = ["2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"];
const SECTOR_YEARS       = ["2014","2015","2016","2017","2018","2019","2020","2021","2022","2023"];

const SECTION_NAMES = {
  ge: {
    B: "სამთომომპოვებელი მრე...", C: "დამამუშავებელი მრეწვე...",
    D: "ელექტროენერგია მიწო...", E: "წყალმომარაგება ნარჩე...",
    F: "მშენებლობა",             G: "ვაჭრობა რემონტი",
    H: "ტრანსპორტირება დასა...", I: "განთავსება საკვები",
    J: "ინფორმაცია კომუნიკ...", K: "ფინანსური საქმიანო...",
    L: "უძრავი ქონება",          M: "პროფესიული საქმია...",
    N: "ადმინისტრაციული მომ...", P: "განათლება",
    Q: "ჯანდაცვა სოციალუ...",   R: "ხელოვნება გართობა",
    S: "სხვა მომსახურება",       unknown: "უცნობი საქმიანობა",
  },
  en: {
    B: "Mining and Quarrying",   C: "Manufacturing",
    D: "Electricity Supply",     E: "Water Supply Waste...",
    F: "Construction",           G: "Trade Repair",
    H: "Transportation Stor...", I: "Accommodation Food...",
    J: "Information Comm...",    K: "Financial Activities",
    L: "Real Estate Activities", M: "Professional Activ...",
    N: "Administrative Sup...",  P: "Education",
    Q: "Health Social Work",     R: "Arts Entertainment",
    S: "Other Services",         unknown: "Unknown Activity",
  },
};

export const SECTION_COLOR_MAPPING = [
  { section: "B", color: "#0080BE" }, { section: "C", color: "#EA1E30" },
  { section: "D", color: "#19C219" }, { section: "E", color: "#F2741F" },
  { section: "F", color: "#5B21A4" }, { section: "G", color: "#F2CF1F" },
  { section: "H", color: "#149983" }, { section: "I", color: "#C21979" },
  { section: "J", color: "#1B6D9A" }, { section: "K", color: "#8FDE1D" },
  { section: "L", color: "#F2F21F" }, { section: "M", color: "#477054" },
  { section: "N", color: "#b4b299" }, { section: "P", color: "#07f187" },
  { section: "Q", color: "#af4fff" }, { section: "R", color: "#e4748b" },
  { section: "S", color: "#61b562" }, { section: "unknown", color: "#000000" },
];

export const getSectionColorMapping = () => SECTION_COLOR_MAPPING;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getSectionName = (sectionCode, lang = "ge") =>
  (SECTION_NAMES[lang] || SECTION_NAMES.ge)[sectionCode] ?? SECTION_NAMES.ge.unknown;

const buildNaceYearData = (data, years, lang) =>
  years.map((year) => {
    const yearData = { year };
    NACE_SECTION_ORDER.forEach((sectionCode) => {
      const item = data.find((d) =>
        sectionCode === "unknown" ? d.section_division === null : d.section_division === sectionCode
      );
      if (item) yearData[getSectionName(sectionCode, lang)] = item[year] || 0;
    });
    return yearData;
  });

const createNaceFetcher = (endpoint, years) => async (lang = "ge") => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}?lang=${lang}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return buildNaceYearData(data, years, lang);
  } catch {
    return [];
  }
};

const createSectorFetcher = (endpoint) => async (lang = "ge") => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}?lang=${lang}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    const rawData = data.recordset || data;
    const filteredData = (Array.isArray(rawData) ? rawData : []).filter(
      (item) => item.legend_title !== "სულ"
    );
    return SECTOR_YEARS.map((year) => {
      const yearData = { year: parseInt(year) };
      filteredData.forEach((item) => {
        yearData[lang === "ge" ? item.legend_title : item.legend_title_en] = item[year] || 0;
      });
      return yearData;
    });
  } catch {
    return [];
  }
};

// ─── Report API ──────────────────────────────────────────────────────────────

const handleReportApiResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText || "Network response was not ok"}`);
  }
  try {
    const data = await response.json();
    return data.recordset || data;
  } catch {
    throw new Error("Failed to parse response as JSON");
  }
};

const createReportApiCall = (reportNumber) => async (lang = "ge") => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(
      `${API_BASE_URL}/report${reportNumber}?lang=${lang}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    return await handleReportApiResponse(response);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") throw new Error(`Request timeout for report ${reportNumber}`);
    throw error;
  }
};

const REPORT_ENDPOINTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const reportFunctions = {};
REPORT_ENDPOINTS.forEach((n) => {
  reportFunctions[`fetchReport${n}Data`] = createReportApiCall(n);
});

export const fetchReport1Data  = reportFunctions.fetchReport1Data;
export const fetchReport2Data  = reportFunctions.fetchReport2Data;
export const fetchReport3Data  = reportFunctions.fetchReport3Data;
export const fetchReport4Data  = reportFunctions.fetchReport4Data;
export const fetchReport5Data  = reportFunctions.fetchReport5Data;
export const fetchReport6Data  = reportFunctions.fetchReport6Data;
export const fetchReport7Data  = reportFunctions.fetchReport7Data;
export const fetchReport8Data  = reportFunctions.fetchReport8Data;
export const fetchReport9Data  = reportFunctions.fetchReport9Data;
export const fetchReport10Data = reportFunctions.fetchReport10Data;

// ─── Dropdown data ───────────────────────────────────────────────────────────

export const fetchLegalForms = async (lang) => {
  try {
    const response = await fetch(`${API_BASE_URL}/legal-forms?lang=${lang}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    const forms = data.recordset || data;
    if (!Array.isArray(forms)) return [];
    return forms
      .map((form) => ({
        value: form.ID?.toString() || form.id?.toString(),
        label: form.Name || (form.Abbreviation ? `${form.Abbreviation} - ${form.Legal_Form}` : form.Legal_Form),
      }))
      .filter((item) => item.value && item.label);
  } catch {
    return [];
  }
};

export const fetchLegalFormsRaw = async (lang = "ge") => {
  try {
    const response = await fetch(`${API_BASE_URL}/legal-forms?lang=${lang}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    const forms = data.recordset || data;
    if (!Array.isArray(forms)) return [];
    return forms.map((form) => ({
      Legal_Form_ID: form.ID || form.id,
      Legal_Form: form.Legal_Form || form.Name || form.label,
    }));
  } catch {
    return [];
  }
};

export const fetchActivities = async (lang = "ge") => {
  try {
    const response = await fetch(`${API_BASE_URL}/activities?lang=${lang}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    if (!Array.isArray(data)) return { codesOnly: [], codesWithNames: [] };
    return {
      codesOnly:      data.map((a) => ({ value: a.Activity_Code, label: a.Activity_Code })),
      codesWithNames: data.map((a) => ({ value: a.Activity_Code, label: `${a.Activity_Code} - ${a.Activity_Name}` })),
    };
  } catch {
    return { codesOnly: [], codesWithNames: [] };
  }
};

export const fetchOwnershipTypes = async (lang = "ge") => {
  try {
    const response = await fetch(`${API_BASE_URL}/ownership-types?lang=${lang}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    const types = data.recordset || data;
    if (!Array.isArray(types)) return [];
    return types.map((type) => ({ value: type.ID?.toString(), label: type.Ownership_Type }));
  } catch {
    return [];
  }
};

export const fetchSizes = async (lang) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sizes?lang=${lang}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    const sizes = data.recordset || data;
    if (!Array.isArray(sizes)) return [];
    return sizes.map((size) => ({ value: size.id.toString(), label: size.zoma }));
  } catch {
    return [];
  }
};

// ─── Documents ───────────────────────────────────────────────────────────────

const buildSearchParams = (searchParams) => {
  const queryParams = new URLSearchParams();

  if (searchParams.identificationNumber) queryParams.append("identificationNumber", searchParams.identificationNumber);
  if (searchParams.organizationName)     queryParams.append("organizationName", searchParams.organizationName);
  if (searchParams.head)                 queryParams.append("head", searchParams.head);
  if (searchParams.partner)             queryParams.append("partner", searchParams.partner);
  if (searchParams.isActive)            queryParams.append("isActive", searchParams.isActive);

  if (Array.isArray(searchParams.organizationalLegalForm) && searchParams.organizationalLegalForm.length > 0) {
    searchParams.organizationalLegalForm.forEach((lf) => queryParams.append("legalForm", lf));
  }

  if (Array.isArray(searchParams.ownershipForm) && searchParams.ownershipForm.length > 0) {
    const id = parseInt(searchParams.ownershipForm[0]?.value, 10);
    if (!isNaN(id)) queryParams.append("ownershipType", id);
  }

  if (Array.isArray(searchParams.businessForm) && searchParams.businessForm.length > 0) {
    searchParams.businessForm.forEach((bf) => {
      const id = parseInt(bf?.value, 10);
      if (!isNaN(id)) queryParams.append("size", id);
    });
  }

  if (Array.isArray(searchParams.activities) && searchParams.activities.length > 0) {
    searchParams.activities.forEach((a) => { if (a?.code) queryParams.append("activityCode", a.code); });
  }

  if (Array.isArray(searchParams.legalAddress?.region) && searchParams.legalAddress.region.length > 0)
    queryParams.append("legalAddressRegion", searchParams.legalAddress.region[0]);
  if (Array.isArray(searchParams.legalAddress?.municipalityCity) && searchParams.legalAddress.municipalityCity.length > 0)
    queryParams.append("legalAddressCity", searchParams.legalAddress.municipalityCity[0]);
  if (searchParams.legalAddress?.address)
    queryParams.append("legalAddress", searchParams.legalAddress.address);

  if (Array.isArray(searchParams.personalAddress?.region) && searchParams.personalAddress.region.length > 0)
    queryParams.append("factualAddressRegion", searchParams.personalAddress.region[0]);
  if (Array.isArray(searchParams.personalAddress?.municipalityCity) && searchParams.personalAddress.municipalityCity.length > 0)
    queryParams.append("factualAddressCity", searchParams.personalAddress.municipalityCity[0]);
  if (searchParams.personalAddress?.address)
    queryParams.append("factualAddress", searchParams.personalAddress.address);

  if (searchParams.filterWithCoordinates) {
    queryParams.append("x", "true");
    queryParams.append("y", "true");
  }

  return queryParams;
};

// eslint-disable-next-line no-unused-vars
export const fetchDocuments = async (searchParams, lang = "ge", regionOptions = [], signal = null, options = {}) => {
  try {
    const queryParams = buildSearchParams(searchParams);
    queryParams.append("lang", lang);
    if (options.page)  queryParams.append("page",  options.page);
    if (options.limit) queryParams.append("limit", options.limit);
    if (options.sortBy)  queryParams.append("sortBy",  options.sortBy);
    if (options.sortDir) queryParams.append("sortDir", options.sortDir);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      const response = await fetch(
        `${API_BASE_URL}/documents?${queryParams}`,
        { signal: signal || controller.signal }
      );
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);

      const data = await response.json();
      const items = data.data || data;
      if (!Array.isArray(items)) return { results: [], pagination: data.pagination || null };

      const results = items.map((item) => ({
        ...item,
        id: item.Stat_ID,
        identificationNumber: item.Legal_Code,
        personalNumber: item.Personal_no,
        name: item.Full_Name,
        abbreviation: item.Abbreviation,
        legalFormId: item.Legal_Form_ID,
        legalAddress: {
          region: item.Region_name, city: item.City_name,
          communityName: item.Community_name, villageName: item.Village_name, address: item.Address,
        },
        factualAddress: {
          region: item.Region_name2, city: item.City_name2,
          communityName: item.Community_name2, villageName: item.Village_name2, address: item.Address2,
        },
        activities: [{ code: item.Activity_2_Code, name: item.Activity_2_Name }],
        head: item.Head, partner: item.Partner,
        phone: item.mob, email: item.Email, web: item.web,
        ownershipType: item.Ownership_Type,
        isActive: item.ISActive === 1,
        x: parseFloat(item.X), y: parseFloat(item.Y),
        businessForm: item.Zoma ? [{ value: item.Zoma.toString(), label: item.Zoma }] : [],
      }));

      return { results, pagination: data.pagination || null };
    } catch (innerError) {
      clearTimeout(timeoutId);
      throw innerError;
    }
  } catch {
    return { results: [], pagination: null };
  }
};

// ─── Coordinates & detail endpoints ──────────────────────────────────────────

export const fetchCoordinates = async (taxId, lang = "ge") => {
  try {
    if (!taxId) throw new Error("Tax ID is required");
    const response = await fetch(`${API_BASE_URL}/coordinates?taxId=${taxId}&lang=${lang}`);
    if (!response.ok) throw new Error("Failed to fetch coordinates");
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const coords = data[0];
      return {
        statId: coords.Stat_ID, taxId: coords.TAXID,
        x: parseFloat(coords.X), y: parseFloat(coords.Y),
        region: coords.Region, id: coords.id,
        inactive: coords.Inactive === 1 || coords.Inactive === true,
        lat: parseFloat(coords.X), lng: parseFloat(coords.Y),
      };
    }
    return null;
  } catch {
    return null;
  }
};

export const fetchRepresentatives = async (statId, lang = "ge") => {
  try {
    if (!statId) throw new Error("Stat ID is required");
    const response = await fetch(`${API_BASE_URL}/representatives?statId=${statId}&lang=${lang}`);
    if (!response.ok) throw new Error("Failed to fetch representatives");
    return await response.json();
  } catch {
    return [];
  }
};

export const fetchPartners = async (statId, lang = "ge") => {
  try {
    if (!statId) throw new Error("Stat ID is required");
    const response = await fetch(`${API_BASE_URL}/partners?statId=${statId}&lang=${lang}`);
    if (!response.ok) throw new Error("Failed to fetch partners");
    return await response.json();
  } catch {
    return [];
  }
};

export const fetchPartnersVw = async (statId) => {
  try {
    if (!statId) throw new Error("Stat ID is required");
    const response = await fetch(`${API_BASE_URL}/partners-vw?statId=${statId}`);
    if (!response.ok) throw new Error(`Failed to fetch partners VW: ${response.status}`);
    return await response.json();
  } catch {
    return [];
  }
};

export const fetchAddressWeb = async (statId) => {
  try {
    if (!statId) throw new Error("Stat ID is required");
    const response = await fetch(`${API_BASE_URL}/address-web?statId=${statId}`);
    if (!response.ok) throw new Error(`Failed to fetch address web: ${response.status}`);
    return await response.json();
  } catch {
    return [];
  }
};

export const fetchFullNameWeb = async (statId) => {
  try {
    if (!statId) throw new Error("Stat ID is required");
    const response = await fetch(`${API_BASE_URL}/full-name-web?statId=${statId}`);
    if (!response.ok) throw new Error(`Failed to fetch full name web: ${response.status}`);
    return await response.json();
  } catch {
    return [];
  }
};

export const fetchLegalUnitWeb = async (personId) => {
  try {
    if (!personId) throw new Error("Person ID is required");
    const response = await fetch(`${API_BASE_URL}/legal-unit-web?personId=${personId}`);
    if (!response.ok) throw new Error(`Failed to fetch legal unit web: ${response.status}`);
    return await response.json();
  } catch {
    return [];
  }
};

// ─── Enterprise statistics ────────────────────────────────────────────────────

export const fetchEnterpriseBirthDeath = async (lang = "ge") => {
  try {
    const response = await fetch(`${API_BASE_URL}/enterprise-birth-death?lang=${lang}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    const birthData = data.find((item) => item.hints === "birth");
    const deathData = data.find((item) => item.hints === "death");
    if (!birthData || !deathData) throw new Error("Invalid API response format");
    return Object.keys(birthData)
      .filter((key) => key !== "hints")
      .map((year) => ({ year, birth: birthData[year], death: deathData[year] }));
  } catch {
    return [];
  }
};

export const fetchEnterpriseNace      = createNaceFetcher("enterprise-nace",       NACE_BIRTH_YEARS);
export const fetchEnterpriseDeathNace = createNaceFetcher("enterprise-death-nace", NACE_DEATH_YEARS);

export const fetchEnterpriseBirthSector = createSectorFetcher("enterprise-birth-sector");
export const fetchEnterpriseDeathSector = createSectorFetcher("enterprise-death-sector");

export const fetchEnterpriseBirthRegion = async (lang = "ge") => {
  try {
    const response = await fetch(`${API_BASE_URL}/enterprise-birth-region?lang=${lang}`, {
      method: "GET",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    const rawData = data.recordset || data;
    if (!Array.isArray(rawData)) return [];
    return rawData.map((item) => { const f = { ...item }; delete f.Unknown; return f; });
  } catch {
    return [];
  }
};

export const fetchEnterpriseDeathRegion = async (lang = "ge") => {
  try {
    const response = await fetch(`${API_BASE_URL}/enterprise-death-region?lang=${lang}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    const rawData = data.recordset || data;
    return (Array.isArray(rawData) ? rawData : []).map((item) => {
      const f = { ...item }; delete f.Unknown; return f;
    });
  } catch {
    return [];
  }
};

export const fetchEnterpriseSurvivalYear = async (lang = "ge") => {
  try {
    const response = await fetch(`${API_BASE_URL}/enterprise-survival-year?lang=${lang}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    const results = data.recordset || data;
    if (!Array.isArray(results) || results.length === 0) return [];
    return results
      .map((item) => {
        const transformed = { year: item.year };
        Object.keys(item).forEach((key) => {
          if (key.startsWith("Born_in_")) {
            const birthYear = parseInt(key.split("_")[2]);
            const survivalYears = item.year - birthYear;
            if (item[key] > 0 && survivalYears > 0) transformed[`Born_in_${birthYear}`] = item[key];
          }
        });
        return transformed;
      })
      .filter((item) => Object.keys(item).length > 1);
  } catch {
    return [];
  }
};

export const fetchEnterpriseBirthDistribution = async (lang = "ge") => {
  try {
    const response = await fetch(`${API_BASE_URL}/enterprise-birth-distribution?lang=${lang}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    const results = data.recordset || data;
    if (!Array.isArray(results) || results.length === 0) return [];
    return results.map((item) => ({ ...item, name: lang === "en" ? item.name_en || item.name : item.name }));
  } catch {
    return [];
  }
};

export const fetchEnterpriseDeathDistribution = async (lang = "ge") => {
  try {
    const response = await fetch(`${API_BASE_URL}/enterprise-death-distribution?lang=${lang}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    const results = data.recordset || data;
    if (!Array.isArray(results) || results.length === 0) return [];
    return results.map((item) => ({ ...item, name: lang === "en" ? item.name_en || item.name : item.name }));
  } catch {
    return [];
  }
};

// ─── Export stream ────────────────────────────────────────────────────────────

export const fetchExportStream = async (searchParams, signal = null) => {
  const queryParams = buildSearchParams(searchParams);
  const url = `${API_BASE_URL}/documents/export?${queryParams}`;
  const response = await fetch(url, { signal: signal || undefined });
  if (!response.ok) throw new Error(`Export request failed: ${response.status} ${response.statusText}`);
  const totalCount = parseInt(response.headers.get("X-Total-Count") || "0", 10);
  return { body: response.body, totalCount };
};

// ─── API object ───────────────────────────────────────────────────────────────

export const API = {
  fetchLegalForms, fetchActivities, fetchOwnershipTypes, fetchSizes,
  fetchDocuments, fetchExportStream,
  fetchReport1Data, fetchReport2Data, fetchReport3Data, fetchReport4Data, fetchReport5Data,
  fetchReport6Data, fetchReport7Data, fetchReport8Data, fetchReport9Data, fetchReport10Data,
  fetchEnterpriseBirthDeath, fetchEnterpriseNace, fetchEnterpriseDeathNace,
  fetchEnterpriseBirthRegion, fetchEnterpriseDeathRegion,
  fetchEnterpriseBirthSector, fetchEnterpriseDeathSector,
  fetchEnterpriseSurvivalYear, fetchEnterpriseBirthDistribution, fetchEnterpriseDeathDistribution,
  fetchPartners, fetchPartnersVw, fetchAddressWeb, fetchLegalUnitWeb,
};

export default API;
