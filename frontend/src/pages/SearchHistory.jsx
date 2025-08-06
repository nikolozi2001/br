import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
  lazy,
  Suspense,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import "../styles/scrollbar.css";
import "../styles/searchHistory.scss";
import {
  API,
  fetchDocuments,
  fetchCoordinates,
  fetchRepresentatives,
  fetchPartners,
  fetchPartnersVw,
  fetchAddressWeb,
  fetchFullNameWeb,
} from "../services/api";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import {
  Download,
  ChevronDown,
  Printer,
  FileImage,
  FileText,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { translations } from "../translations/searchForm";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getPageTitle } from "../utils/pageTitles";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Lazy load only ECharts - react-leaflet doesn't work well with lazy loading
const ReactECharts = lazy(() => import("echarts-for-react"));
// Import react-leaflet components normally
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

// Note: ChartContainer should import ReactECharts internally and handle the lazy loading

//Components
import {
  LoadingSpinner,
  EmptyState,
  ChartContainer,
  SectionHeader,
} from "../components/searchHistory";

import loaderIcon from "../assets/images/equalizer.svg";

// Simple in-memory cache
const dataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache utility functions
const getCacheKey = (type, id, lang) => `${type}-${id}-${lang || "default"}`;

const fetchWithCache = async (cacheKey, fetchFn, forceRefresh = false) => {
  const cached = dataCache.get(cacheKey);

  if (
    !forceRefresh &&
    cached &&
    Date.now() - cached.timestamp < CACHE_DURATION
  ) {
    return cached.data;
  }

  const data = await fetchFn();
  dataCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
};

// Initial state for data reducer
const initialState = {
  loading: true,
  partnersLoading: false,
  partnersVwLoading: false,
  addressWebLoading: false,
  fullNameWebLoading: false,
  representativesLoading: false,
  coordinatesLoading: false,
  documentData: null,
  coordinates: null,
  representatives: [],
  partners: [],
  partnersVw: [],
  addressWeb: [],
  fullNameWeb: [],
  error: null,
};

// Data reducer for managing component state
const dataReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_PARTNERS_LOADING":
      return { ...state, partnersLoading: action.payload };
    case "SET_PARTNERS_VW_LOADING":
      return { ...state, partnersVwLoading: action.payload };
    case "SET_ADDRESS_WEB_LOADING":
      return { ...state, addressWebLoading: action.payload };
    case "SET_FULL_NAME_WEB_LOADING":
      return { ...state, fullNameWebLoading: action.payload };
    case "SET_REPRESENTATIVES_LOADING":
      return { ...state, representativesLoading: action.payload };
    case "SET_COORDINATES_LOADING":
      return { ...state, coordinatesLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_DOCUMENT_DATA":
      return { ...state, documentData: action.payload };
    case "SET_COORDINATES":
      return { ...state, coordinates: action.payload };
    case "SET_REPRESENTATIVES":
      return { ...state, representatives: action.payload };
    case "SET_PARTNERS":
      return { ...state, partners: action.payload };
    case "SET_PARTNERS_VW":
      return { ...state, partnersVw: action.payload };
    case "SET_ADDRESS_WEB":
      return { ...state, addressWeb: action.payload };
    case "SET_FULL_NAME_WEB":
      return { ...state, fullNameWeb: action.payload };
    case "RESET_REPRESENTATIVES":
      return { ...state, representatives: [] };
    case "START_FETCH":
      return {
        ...state,
        loading: true,
        error: null,
        representatives: [],
      };
    case "FINISH_LOADING":
      return { ...state, loading: false };
    default:
      return state;
  }
};

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function SearchHistory({ isEnglish }) {
  // Set page-specific title
  useDocumentTitle(isEnglish, getPageTitle("searchHistory", isEnglish));

  // Memoize translations to prevent recalculation
  const t = useMemo(() => translations[isEnglish ? "en" : "ge"], [isEnglish]);

  // Use reducer for state management
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const {
    loading,
    partnersLoading,
    partnersVwLoading,
    addressWebLoading,
    fullNameWebLoading,
    representativesLoading,
    coordinatesLoading,
    documentData,
    coordinates,
    representatives,
    partners,
    partnersVw,
    addressWeb,
    fullNameWeb,
    error,
  } = state;

  // Keep these as separate state since they're UI-specific
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Memoize identification number computation to prevent recalculation on every render
  const identificationNumber = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get("id") || location.state?.identificationNumber;
  }, [location.search, location.state?.identificationNumber]);

  // Main data fetching with abort controller
  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        dispatch({ type: "START_FETCH" });
        const searchParams = {
          identificationNumber: identificationNumber,
        };

        // Fetch document data with cache
        const cacheKey = getCacheKey(
          "documents",
          identificationNumber,
          isEnglish
        );
        const response = await fetchWithCache(cacheKey, () =>
          fetchDocuments(searchParams, isEnglish ? "en" : "ge", {
            signal: abortController.signal,
          })
        );

        if (response && response.length > 0) {
          const data = response[0];
          dispatch({ type: "SET_DOCUMENT_DATA", payload: data });

          // Fetch representatives independently
          if (data?.Stat_ID) {
            const fetchRepsAsync = async () => {
              try {
                dispatch({
                  type: "SET_REPRESENTATIVES_LOADING",
                  payload: true,
                });
                const repsCacheKey = getCacheKey(
                  "representatives",
                  data.Stat_ID,
                  isEnglish
                );
                const reps = await fetchWithCache(repsCacheKey, () =>
                  fetchRepresentatives(data.Stat_ID, isEnglish ? "en" : "ge", {
                    signal: abortController.signal,
                  })
                );
                dispatch({ type: "SET_REPRESENTATIVES", payload: reps || [] });
              } catch (error) {
                if (error.name !== "AbortError") {
                  console.error("Error fetching representatives:", error);
                }
              } finally {
                dispatch({
                  type: "SET_REPRESENTATIVES_LOADING",
                  payload: false,
                });
              }
            };
            fetchRepsAsync();
          }

          // Fetch coordinates independently
          const fetchCoordsAsync = async () => {
            try {
              dispatch({ type: "SET_COORDINATES_LOADING", payload: true });
              const coordsCacheKey = getCacheKey(
                "coordinates",
                identificationNumber
              );
              const coordsData = await fetchWithCache(coordsCacheKey, () =>
                fetchCoordinates(identificationNumber, {
                  signal: abortController.signal,
                })
              );
              if (coordsData && coordsData.lat && coordsData.lng) {
                dispatch({
                  type: "SET_COORDINATES",
                  payload: {
                    lat: coordsData.lat,
                    lng: coordsData.lng,
                    region: coordsData.region,
                    inactive: coordsData.inactive,
                  },
                });
              }
            } catch (error) {
              if (error.name !== "AbortError") {
                console.error("Error fetching coordinates:", error);
              }
            } finally {
              dispatch({ type: "SET_COORDINATES_LOADING", payload: false });
            }
          };
          fetchCoordsAsync();
        } else {
          const errorMsg = isEnglish
            ? "No data found"
            : "მონაცემები ვერ მოიძებნა";
          dispatch({ type: "SET_ERROR", payload: errorMsg });
          toast.error(errorMsg);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching data:", error);
          const errorMsg = isEnglish
            ? "Error loading data"
            : "შეცდომა მონაცემების ჩატვირთვისას";
          dispatch({ type: "SET_ERROR", payload: errorMsg });
          toast.error(errorMsg);
        }
      } finally {
        dispatch({ type: "FINISH_LOADING" });
      }
    };

    if (identificationNumber) {
      fetchData();
    }

    return () => {
      abortController.abort();
    };
  }, [identificationNumber, isEnglish]);

  // Progressive loading for partners data with abort controllers
  useEffect(() => {
    const abortControllers = {
      partners: new AbortController(),
      partnersVw: new AbortController(),
      addressWeb: new AbortController(),
      fullNameWeb: new AbortController(),
    };

    const fetchPartnersData = async () => {
      if (!documentData?.Stat_ID) return;

      // Fetch partners independently
      const fetchPartnersAsync = async () => {
        try {
          dispatch({ type: "SET_PARTNERS_LOADING", payload: true });
          const cacheKey = getCacheKey(
            "partners",
            documentData.Stat_ID,
            isEnglish
          );
          const partnersData = await fetchWithCache(cacheKey, () =>
            fetchPartners(documentData.Stat_ID, isEnglish ? "en" : "ge", {
              signal: abortControllers.partners.signal,
            })
          );
          dispatch({ type: "SET_PARTNERS", payload: partnersData || [] });
        } catch (error) {
          if (error.name !== "AbortError") {
            console.error("Error fetching partners:", error);
          }
        } finally {
          dispatch({ type: "SET_PARTNERS_LOADING", payload: false });
        }
      };

      // Fetch partnersVw independently
      const fetchPartnersVwAsync = async () => {
        try {
          dispatch({ type: "SET_PARTNERS_VW_LOADING", payload: true });
          const cacheKey = getCacheKey("partnersVw", documentData.Stat_ID);
          const partnersVwData = await fetchWithCache(cacheKey, () =>
            fetchPartnersVw(documentData.Stat_ID, {
              signal: abortControllers.partnersVw.signal,
            })
          );
          dispatch({ type: "SET_PARTNERS_VW", payload: partnersVwData || [] });
        } catch (error) {
          if (error.name !== "AbortError") {
            console.error("Error fetching partnersVw:", error);
          }
        } finally {
          dispatch({ type: "SET_PARTNERS_VW_LOADING", payload: false });
        }
      };

      // Fetch addressWeb independently
      const fetchAddressWebAsync = async () => {
        try {
          dispatch({ type: "SET_ADDRESS_WEB_LOADING", payload: true });
          const cacheKey = getCacheKey("addressWeb", documentData.Stat_ID);
          const addressWebData = await fetchWithCache(cacheKey, () =>
            fetchAddressWeb(documentData.Stat_ID, {
              signal: abortControllers.addressWeb.signal,
            })
          );
          dispatch({ type: "SET_ADDRESS_WEB", payload: addressWebData || [] });
        } catch (error) {
          if (error.name !== "AbortError") {
            console.error("Error fetching addressWeb:", error);
          }
        } finally {
          dispatch({ type: "SET_ADDRESS_WEB_LOADING", payload: false });
        }
      };

      // Fetch fullNameWeb independently
      const fetchFullNameWebAsync = async () => {
        try {
          dispatch({ type: "SET_FULL_NAME_WEB_LOADING", payload: true });
          const cacheKey = getCacheKey("fullNameWeb", documentData.Stat_ID);
          const fullNameWebData = await fetchWithCache(cacheKey, () =>
            fetchFullNameWeb(documentData.Stat_ID, {
              signal: abortControllers.fullNameWeb.signal,
            })
          );
          dispatch({
            type: "SET_FULL_NAME_WEB",
            payload: fullNameWebData || [],
          });
        } catch (error) {
          if (error.name !== "AbortError") {
            console.error("Error fetching fullNameWeb:", error);
          }
        } finally {
          dispatch({ type: "SET_FULL_NAME_WEB_LOADING", payload: false });
        }
      };

      // Execute all fetches independently (not waiting for each other)
      fetchPartnersAsync();
      fetchPartnersVwAsync();
      fetchAddressWebAsync();
      fetchFullNameWebAsync();
    };

    if (identificationNumber && documentData?.Stat_ID) {
      fetchPartnersData();
    }

    return () => {
      Object.values(abortControllers).forEach((controller) =>
        controller.abort()
      );
    };
  }, [identificationNumber, documentData?.Stat_ID, isEnglish]);

  // Process data to group by date - optimized with useMemo
  const processedData = useMemo(() => {
    if (!partners || partners.length === 0) return [];

    const groupedByDate = partners.reduce((acc, item) => {
      const date = item.Date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, Object.create(null));

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
      return new Date(b) - new Date(a);
    });

    return sortedDates.map((date) => ({
      date,
      data: groupedByDate[date],
    }));
  }, [partners]);

  // Processed data for partners_vw - optimized with useMemo
  const processedDataVw = useMemo(() => {
    if (!partnersVw || partnersVw.length === 0) return [];

    const groupedByDate = partnersVw.reduce((acc, item) => {
      const date = item.Date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, Object.create(null));

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
      return new Date(b) - new Date(a);
    });

    return sortedDates.map((date) => ({
      date,
      data: groupedByDate[date],
    }));
  }, [partnersVw]);

  // Memoize color palette to prevent recreation on every render
  const colorPalette = useMemo(
    () => [
      "#5470c6",
      "#3a3a3a",
      "#91cc75",
      "#fac858",
      "#ee6666",
      "#73c0de",
      "#3ba272",
      "#fc8452",
      "#9a60b4",
      "#ea7ccc",
      "#ff9f7f",
      "#fb7293",
      "#e7bcf3",
      "#8378ea",
    ],
    []
  );

  // Optimized chart options generator with better memoization
  const getChartOption = useCallback(
    (dateGroup) => {
      const chartData = dateGroup.data
        .map((item) => ({
          value: item.Share,
          name: `${item.Name}: ${item.Share}%`,
        }))
        .sort((a, b) => b.value - a.value);

      return {
        tooltip: {
          trigger: "item",
          formatter: "{b}",
        },
        legend: {
          show: false,
        },
        series: [
          {
            name: "Share",
            type: "pie",
            radius: "70%",
            center: ["50%", "50%"],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 4,
              borderColor: "#fff",
              borderWidth: 2,
            },
            label: {
              show: true,
              position: "outside",
              fontSize: 10,
              formatter: (params) => {
                const name = params.name.split(":")[0];
                if (name.length > 15) {
                  return name.substring(0, 15) + "...";
                }
                return name;
              },
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 12,
                fontWeight: "bold",
              },
            },
            labelLine: {
              show: true,
              length: 10,
              length2: 15,
            },
            data: chartData,
            color: colorPalette,
          },
        ],
      };
    },
    [colorPalette]
  );

  // Prepare data for display - optimized with better performance
  const data = useMemo(() => {
    if (!documentData) return [];

    const fieldMappings = [
      {
        labelKey: isEnglish
          ? "Identification Number:"
          : "საიდენტიფიკაციო ნომერი:",
        getValue: () => documentData.identificationNumber,
      },
      {
        labelKey: isEnglish ? "Organization Name:" : "ორგანიზაციის დასახელება:",
        getValue: () => documentData.name,
      },
      {
        labelKey: isEnglish
          ? "Organizational Legal Form:"
          : "ორგანიზაციულ-სამართლებრივი ფორმა:",
        getValue: () => documentData.abbreviation,
      },
      {
        labelKey: isEnglish ? "Ownership Form:" : "საკუთრების ფორმა:",
        getValue: () => documentData.ownershipType,
      },
      {
        labelKey: isEnglish ? "Region:" : "რეგიონი:",
        getValue: () => {
          const { legalAddress } = documentData;
          return legalAddress?.region
            ? `${legalAddress.region}${
                legalAddress.city ? ", " + legalAddress.city : ""
              }`
            : null;
        },
      },
      {
        labelKey: isEnglish ? "Legal Address:" : "იურიდიული მისამართი:",
        getValue: () => documentData.legalAddress?.address,
      },
      {
        labelKey: isEnglish
          ? "Economic Activity (NACE Rev.2):"
          : "ეკონომიკური საქმიანობა (NACE Rev.2):",
        getValue: () => {
          const { activities } = documentData;
          return activities && activities.length > 0
            ? `${activities[0].code} - ${activities[0].name}`
            : null;
        },
      },
      {
        labelKey: isEnglish
          ? "Active Economic Status:"
          : "აქტიური ეკონომიკური სტატუსი:",
        getValue: () =>
          documentData.isActive
            ? isEnglish
              ? "Active"
              : "აქტიური"
            : isEnglish
            ? "Inactive"
            : "არააქტიური",
      },
      {
        labelKey: isEnglish ? "Head/Director:" : "ხელმძღვანელი:",
        getValue: () => documentData.head,
      },
      {
        labelKey: isEnglish ? "Phone:" : "ტელეფონი:",
        getValue: () => documentData.phone,
      },
      {
        labelKey: isEnglish ? "Email:" : "ელ-ფოსტა:",
        getValue: () => documentData.email,
      },
    ];

    return fieldMappings
      .map(({ labelKey, getValue }) => {
        const value = getValue();
        return value ? { label: labelKey, value } : null;
      })
      .filter(Boolean);
  }, [documentData, isEnglish]);

  const exportToExcel = useCallback(async () => {
    try {
      const workbook = new ExcelJS.Workbook();

      // First worksheet for company info
      const worksheet = workbook.addWorksheet("Company Info");

      worksheet.columns = [
        { header: "Field", key: "label", width: 40 },
        { header: "Value", key: "value", width: 80 },
      ];

      data.forEach((item) => {
        worksheet.addRow(item);
      });

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0080BE" },
      };
      worksheet.getRow(1).font = { color: { argb: "FFFFFFFF" }, bold: true };

      // Second worksheet for representatives
      if (representatives.length > 0) {
        const repsWorksheet = workbook.addWorksheet("Representatives");

        repsWorksheet.columns = [
          { header: isEnglish ? "Person" : "პირი", key: "name", width: 40 },
          {
            header: isEnglish ? "Position" : "მონაწილეობა",
            key: "position",
            width: 40,
          },
          { header: isEnglish ? "Date" : "თარიღი", key: "date", width: 20 },
        ];

        representatives.forEach((rep) => {
          repsWorksheet.addRow({
            name: rep.Name || "-",
            position: rep.Position || "-",
            date: rep.Date
              ? new Date(rep.Date).toLocaleDateString(
                  isEnglish ? "en-US" : "ka-GE"
                )
              : "-",
          });
        });

        repsWorksheet.getRow(1).font = { bold: true };
        repsWorksheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0080BE" },
        };
        repsWorksheet.getRow(1).font = {
          color: { argb: "FFFFFFFF" },
          bold: true,
        };
      }

      // Third worksheet for partners
      if (partners.length > 0) {
        const partnersWorksheet = workbook.addWorksheet("Partners");

        partnersWorksheet.columns = [
          {
            header: isEnglish ? "Partner Name" : "პარტნიორის სახელი",
            key: "name",
            width: 40,
          },
          { header: isEnglish ? "Share %" : "წილი %", key: "share", width: 15 },
          { header: isEnglish ? "Date" : "თარიღი", key: "date", width: 20 },
        ];

        partners.forEach((partner) => {
          partnersWorksheet.addRow({
            name: partner.Name || "-",
            share: partner.Share || "-",
            date: partner.Date
              ? new Date(partner.Date).toLocaleDateString(
                  isEnglish ? "en-US" : "ka-GE"
                )
              : "-",
          });
        });

        partnersWorksheet.getRow(1).font = { bold: true };
        partnersWorksheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0080BE" },
        };
        partnersWorksheet.getRow(1).font = {
          color: { argb: "FFFFFFFF" },
          bold: true,
        };
      }

      // Fourth worksheet for partners details (partnersVw)
      if (partnersVw.length > 0) {
        const partnersVwWorksheet = workbook.addWorksheet("Partners Details");

        partnersVwWorksheet.columns = [
          {
            header: isEnglish ? "Partner Name" : "პარტნიორის სახელი",
            key: "name",
            width: 40,
          },
          { header: isEnglish ? "Share" : "წილი", key: "share", width: 15 },
          { header: isEnglish ? "Date" : "თარიღი", key: "date", width: 20 },
        ];

        partnersVw.forEach((partner) => {
          partnersVwWorksheet.addRow({
            name: partner.Name || "-",
            share: partner.Share || "-",
            date: partner.Date
              ? new Date(partner.Date).toLocaleDateString(
                  isEnglish ? "en-US" : "ka-GE"
                )
              : "-",
          });
        });

        partnersVwWorksheet.getRow(1).font = { bold: true };
        partnersVwWorksheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0080BE" },
        };
        partnersVwWorksheet.getRow(1).font = {
          color: { argb: "FFFFFFFF" },
          bold: true,
        };
      }

      // Fifth worksheet for address history
      if (addressWeb.length > 0) {
        const addressWorksheet = workbook.addWorksheet("Address History");

        addressWorksheet.columns = [
          {
            header: isEnglish ? "Region" : "რეგიონი",
            key: "region",
            width: 25,
          },
          { header: isEnglish ? "City" : "ქალაქი", key: "city", width: 25 },
          {
            header: isEnglish ? "Legal Address" : "იურიდიული მისამართი",
            key: "address",
            width: 50,
          },
          { header: isEnglish ? "Date" : "თარიღი", key: "date", width: 20 },
        ];

        addressWeb.forEach((address) => {
          addressWorksheet.addRow({
            region: address.Region_name || "-",
            city: address.City_name || "-",
            address: address.Address || "-",
            date: address.Date
              ? new Date(address.Date).toLocaleDateString(
                  isEnglish ? "en-US" : "ka-GE"
                )
              : "-",
          });
        });

        addressWorksheet.getRow(1).font = { bold: true };
        addressWorksheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0080BE" },
        };
        addressWorksheet.getRow(1).font = {
          color: { argb: "FFFFFFFF" },
          bold: true,
        };
      }

      // Sixth worksheet for company name history
      if (fullNameWeb.length > 0) {
        const nameHistoryWorksheet = workbook.addWorksheet(
          "Company Name History"
        );

        nameHistoryWorksheet.columns = [
          {
            header: isEnglish ? "Company Name" : "დასახელება",
            key: "fullName",
            width: 50,
          },
          {
            header: isEnglish ? "Legal Form" : "სამართლებრივი ფორმა",
            key: "legalForm",
            width: 30,
          },
          {
            header: isEnglish ? "Ownership Form" : "საკუთრების ფორმა",
            key: "ownershipType",
            width: 30,
          },
          { header: isEnglish ? "Date" : "თარიღი", key: "date", width: 20 },
        ];

        fullNameWeb.forEach((item) => {
          nameHistoryWorksheet.addRow({
            fullName: item.Full_Name || "-",
            legalForm: item.Abbreviation || "-",
            ownershipType: item.Ownership_Type || "-",
            date: item.Date
              ? new Date(item.Date).toLocaleDateString(
                  isEnglish ? "en-US" : "ka-GE"
                )
              : "-",
          });
        });

        nameHistoryWorksheet.getRow(1).font = { bold: true };
        nameHistoryWorksheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0080BE" },
        };
        nameHistoryWorksheet.getRow(1).font = {
          color: { argb: "FFFFFFFF" },
          bold: true,
        };
      }

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `company_info_${identificationNumber}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(
        isEnglish
          ? "Excel file downloaded successfully!"
          : "Excel ფაილი წარმატებით ჩამოიტვირთა!"
      );
    } catch (error) {
      toast.error(
        isEnglish ? "Error exporting to Excel" : "შეცდომა Excel-ში ექსპორტისას"
      );
      console.error("Export error:", error);
    }
  }, [
    data,
    representatives,
    partners,
    partnersVw,
    addressWeb,
    fullNameWeb,
    identificationNumber,
    isEnglish,
  ]);

  const toggleDropdown = useCallback(
    (index) => {
      setActiveDropdown(activeDropdown === index ? null : index);
    },
    [activeDropdown]
  );

  // Memoize navigation function to prevent recreation
  const handleBackNavigation = useCallback(() => {
    navigate(`/?identificationNumber=${identificationNumber}`);
  }, [navigate, identificationNumber]);

  // Close dropdown when clicking outside - memoized for performance
  const handleClickOutside = useCallback(
    (event) => {
      if (activeDropdown !== null && !event.target.closest(".relative")) {
        setActiveDropdown(null);
      }
    },
    [activeDropdown]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  // Function to clear cache (can be called when needed)
  const clearCache = useCallback(() => {
    dataCache.clear();
    toast.success(isEnglish ? "Cache cleared" : "ქეში გასუფთავდა");
  }, [isEnglish]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      <div className="container mx-auto py-8 pb-16">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8">
          <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
            <button
              onClick={handleBackNavigation}
              className="px-4 py-2 bg-[#0080BE] text-white rounded hover:bg-[#0070aa] transition-colors font-bpg-nino flex items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={isEnglish ? "Back to Results" : "უკან დაბრუნება"}
            >
              ← {isEnglish ? "Back to Results" : "უკან დაბრუნება"}
            </button>
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                disabled={loading || !documentData}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-bpg-nino flex items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label={
                  isEnglish
                    ? "Export data to Excel file"
                    : "მონაცემების Excel-ში ექსპორტი"
                }
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {isEnglish ? "Export to Excel" : "Excel-ში ექსპორტი"}
              </button>
              {/* Optional: Add refresh button to clear cache and refetch */}
              <button
                onClick={() => {
                  clearCache();
                  window.location.reload();
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-bpg-nino flex items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label={
                  isEnglish ? "Refresh data" : "მონაცემების განახლება"
                }
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {isEnglish ? "Refresh" : "განახლება"}
              </button>
            </div>
          </div>

          {/* Main Title */}
          <SectionHeader title={t.historyTitle} />

          {/* Georgian Info Table */}
          <div className="w-full mb-8">
            {loading ? (
              <LoadingSpinner
                message={isEnglish ? "Loading..." : "იტვირთება..."}
              />
            ) : error ? (
              <EmptyState message={error} />
            ) : documentData ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {data.map((item, index) => (
                  <div
                    key={index}
                    className={`flex px-6 py-4 border-b border-gray-200 hover:bg-[#0080BE] hover:text-white transition-all duration-200 cursor-pointer group ${
                      index === data.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <div className="w-2/5 font-bold font-bpg-nino">
                      {item.label}
                    </div>
                    <div className="w-3/5 font-bpg-nino">{item.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                message={
                  isEnglish
                    ? "No data available"
                    : "მონაცემები არ არის ხელმისაწვდომი"
                }
              />
            )}
          </div>

          {/* Map Section */}
          {!loading && coordinates && !coordinatesLoading && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bpg-nino mb-2 text-center text-[#0080BE] font-bold">
                  {t.map ||
                    (isEnglish ? "Location Map" : "ადგილმდებარეობის რუკა")}
                </h1>
              </div>
              <div className="w-full">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden p-4">
                  <MapContainer
                    key={`map-${coordinates.lat}-${coordinates.lng}`} // Unique key to prevent reuse issues
                    center={[coordinates.lat, coordinates.lng]}
                    zoom={15}
                    style={{ height: "400px", width: "100%" }}
                    className="rounded-lg"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[coordinates.lat, coordinates.lng]}>
                      <Popup>
                        <div className="font-bpg-nino">
                          <strong>{documentData.name}</strong>
                          <br />
                          {documentData.legalAddress?.address}
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                  <div className="mt-2 text-sm text-gray-600 font-bpg-nino text-center">
                    <div>
                      {isEnglish ? "Coordinates: " : "კოორდინატები: "}
                      {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                    </div>
                    {coordinates.region && (
                      <div className="mt-1">
                        {isEnglish ? "Region: " : "რეგიონი: "}
                        {coordinates.region}
                      </div>
                    )}
                    {coordinates.inactive && (
                      <div className="mt-1 text-red-600">
                        {isEnglish
                          ? "Note: Location marked as inactive"
                          : "შენიშვნა: მდებარეობა მონიშნულია არააქტიურად"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Show loading state while coordinates are being fetched */}
          {!loading && coordinatesLoading && (
            <div className="w-full">
              <div className="mb-6">
                <h1 className="text-xl font-bpg-nino mb-2 text-center text-[#0080BE] font-bold">
                  {t.map ||
                    (isEnglish ? "Location Map" : "ადგილმდებარეობის რუკა")}
                </h1>
              </div>
              <LoadingSpinner
                message={
                  isEnglish
                    ? "Loading coordinates..."
                    : "კოორდინატები იტვირთება..."
                }
              />
            </div>
          )}

          {/* Show message if no coordinates available */}
          {!loading && !coordinates && documentData && !coordinatesLoading && (
            <div className="w-full">
              <div className="mb-6">
                <h1 className="text-xl font-bpg-nino mb-2 text-center text-[#0080BE] font-bold">
                  {t.map ||
                    (isEnglish ? "Location Map" : "ადგილმდებარეობის რუკა")}
                </h1>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <p className="text-center text-gray-600 font-bpg-nino">
                  {isEnglish
                    ? "Location coordinates not available"
                    : "ადგილმდებარეობის კოორდინატები არ არის ხელმისაწვდომი"}
                </p>
              </div>
            </div>
          )}

          {/* Representatives Section */}
          <div className="w-full mt-8">
            <h1 className="text-xl font-bpg-nino mb-2 text-center text-[#0080BE] font-bold">
              {t.personsRelatedToCompany ||
                (isEnglish
                  ? "Persons Related to Company"
                  : "კომპანიასთან დაკავშირებული პირები")}
            </h1>
            {representativesLoading ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex justify-center items-center">
                  <img
                    src={loaderIcon}
                    alt="Loading..."
                    className="w-12 h-12"
                  />
                  <span className="ml-3 text-gray-600 font-bpg-nino">
                    {isEnglish
                      ? "Loading representatives..."
                      : "წარმომადგენლები იტვირთება..."}
                  </span>
                </div>
              </div>
            ) : representatives.length > 0 ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Table Header */}
                <div className="flex px-6 py-3 bg-[#2c7bbf] text-white font-bold font-bpg-nino text-sm sm:text-base">
                  <div className="w-2/5">{isEnglish ? "Person" : "პირი"}</div>
                  <div className="w-2/5">
                    {isEnglish ? "Position" : "მონაწილეობა"}
                  </div>
                  <div className="w-1/5">{isEnglish ? "Date" : "თარიღი"}</div>
                </div>

                {/* Table Rows */}
                {representatives.map((rep, index) => (
                  <div
                    key={index}
                    className={`flex px-6 py-4 border-b border-gray-200 hover:bg-[#0080BE] hover:text-white transition-all duration-200 cursor-pointer group ${
                      index === representatives.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <div className="w-2/5 font-bpg-nino">{rep.Name || "-"}</div>
                    <div className="w-2/5 font-bpg-nino">
                      {rep.Position || "-"}
                    </div>
                    <div className="w-1/5 font-bpg-nino">
                      {rep.Date
                        ? new Date(rep.Date).toLocaleDateString(
                            isEnglish ? "en-US" : "ka-GE",
                            { year: "numeric", month: "2-digit" }
                          )
                        : "-"}
                    </div>
                  </div>
                ))}
              </div>
            ) : !representativesLoading && documentData?.Stat_ID ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <p className="text-center text-gray-600 font-bpg-nino">
                  {isEnglish
                    ? "No representatives found"
                    : "წარმომადგენლები ვერ მოიძებნა"}
                </p>
              </div>
            ) : null}
          </div>

          {/* Partners Section with Lazy Loading */}
          <div className="w-full mt-8">
            <h1 className="text-xl font-bpg-nino mb-2 text-center text-[#0080BE] font-bold">
              {t.partners}
            </h1>
            {partnersLoading ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex justify-center items-center">
                  <img
                    src={loaderIcon}
                    alt="Loading..."
                    className="w-12 h-12"
                  />
                  <span className="ml-3 text-gray-600 font-bpg-nino">
                    {isEnglish
                      ? "Loading partners..."
                      : "პარტნიორები იტვირთება..."}
                  </span>
                </div>
              </div>
            ) : partners.length > 0 ? (
              <Suspense
                fallback={
                  <LoadingSpinner
                    message={
                      isEnglish ? "Loading charts..." : "გრაფიკები იტვირთება..."
                    }
                  />
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {processedData.map((dateGroup, index) => (
                    <ChartContainer
                      key={index}
                      dateGroup={dateGroup}
                      index={index}
                      onToggleDropdown={toggleDropdown}
                      activeDropdown={activeDropdown}
                      isEnglish={isEnglish}
                      getChartOption={getChartOption}
                    />
                  ))}
                </div>
              </Suspense>
            ) : !partnersLoading && documentData?.Stat_ID ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <p className="text-center text-gray-600 font-bpg-nino">
                  {isEnglish ? "No partners found" : "პარტნიორები ვერ მოიძებნა"}
                </p>
              </div>
            ) : null}
          </div>

          {/* Partners-view Section */}
          <div className="w-full mt-8">
            <h1 className="text-xl font-bpg-nino mb-2 text-center text-[#0080BE] font-bold">
              {isEnglish ? "Partners Details" : "პარტნიორების დეტალები"}
            </h1>
            {partnersVwLoading ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex justify-center items-center">
                  <img
                    src={loaderIcon}
                    alt="Loading..."
                    className="w-12 h-12"
                  />
                  <span className="ml-3 text-gray-600 font-bpg-nino">
                    {isEnglish
                      ? "Loading partners details..."
                      : "პარტნიორების დეტალები იტვირთება..."}
                  </span>
                </div>
              </div>
            ) : processedDataVw.length > 0 ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Table Header */}
                <div className="flex px-6 py-3 bg-[#2c7bbf] text-white font-bold font-bpg-nino text-sm sm:text-base">
                  <div className="w-2/5">{isEnglish ? "Person" : "პირი"}</div>
                  <div className="w-2/5">{isEnglish ? "Share" : "წილი"}</div>
                  <div className="w-1/5">{isEnglish ? "Date" : "თარიღი"}</div>
                </div>

                {/* Table Rows */}
                {processedDataVw.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    {group.data.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className={`flex px-6 py-4 border-b border-gray-200 hover:bg-[#0080BE] hover:text-white transition-all duration-200 cursor-pointer group`}
                      >
                        <div className="w-2/5 font-bpg-nino">
                          {item.Name || "-"}
                        </div>
                        <div className="w-2/5 font-bpg-nino">
                          {item.Share || "-"}
                        </div>
                        <div className="w-1/5 font-bpg-nino">
                          {group.date
                            ? new Date(group.date).toLocaleDateString(
                                isEnglish ? "en-US" : "ka-GE",
                                { year: "numeric", month: "2-digit" }
                              )
                            : "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : !partnersVwLoading && documentData?.Stat_ID ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <p className="text-center text-gray-600 font-bpg-nino">
                  {isEnglish ? "No partners found" : "პარტნიორები ვერ მოიძებნა"}
                </p>
              </div>
            ) : null}
          </div>

          {/* Address Web Section */}
          <div className="w-full mt-8">
            <h1 className="text-xl font-bpg-nino mb-2 text-center text-[#0080BE] font-bold">
              {isEnglish
                ? "Company Legal Address"
                : "კომპანიის იურიდიული მისამართი"}
            </h1>
            {addressWebLoading ? (
              <LoadingSpinner
                message={
                  isEnglish
                    ? "Loading company legal address..."
                    : "კომპანიის იურიდიული მისამართი იტვირთება..."
                }
              />
            ) : addressWeb.length > 0 ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Table Header */}
                <div className="flex px-6 py-3 bg-[#2c7bbf] text-white font-bold font-bpg-nino text-sm sm:text-base">
                  <div className="w-1/3">
                    {isEnglish ? "Region" : "რეგიონი"}
                  </div>
                  <div className="w-1/2">
                    {isEnglish ? "Legal Address" : "იურიდიული მისამართი"}
                  </div>
                  <div className="w-1/6 text-right">
                    {isEnglish ? "Date" : "თარიღი"}
                  </div>
                </div>

                {/* Table Rows */}
                {addressWeb.map((address, index) => (
                  <div
                    key={index}
                    className={`flex px-6 py-4 border-b border-gray-200 hover:bg-[#0080BE] hover:text-white transition-all duration-200 cursor-pointer group ${
                      index === addressWeb.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <div className="w-1/3 font-bpg-nino">
                      {address.Region_name + "; " + address.City_name || "-"}
                    </div>
                    <div className="w-1/2 font-bpg-nino">
                      {address.Address || "-"}
                    </div>
                    <div className="w-1/6 text-right font-bpg-nino">
                      {address.Date
                        ? new Date(address.Date).toLocaleDateString(
                            isEnglish ? "en-US" : "ka-GE",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            }
                          )
                        : "-"}
                    </div>
                  </div>
                ))}
              </div>
            ) : !addressWebLoading && documentData?.Stat_ID ? (
              <EmptyState
                message={
                  isEnglish
                    ? "No address history found"
                    : "მისამართების ისტორია ვერ მოიძებნა"
                }
              />
            ) : null}
          </div>

          {/* Full Name Web Section */}
          <div className="w-full mt-8">
            <h1 className="text-xl font-bpg-nino mb-2 text-center text-[#0080BE] font-bold">
              {isEnglish
                ? "Company Name, Legal and Ownership Forms"
                : "კომპანიის დასახელება, სამართლებრივი და საკუთრების ფორმები"}
            </h1>
            {fullNameWebLoading ? (
              <LoadingSpinner
                message={
                  isEnglish
                    ? "Loading company name history..."
                    : "კომპანიის დასახელების ისტორია იტვირთება..."
                }
              />
            ) : fullNameWeb.length > 0 ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Table Header */}
                <div className="flex px-6 py-3 bg-[#2c7bbf] text-white font-bold font-bpg-nino text-sm sm:text-base">
                  <div className="w-1/3">
                    {isEnglish ? "Company Name" : "დასახელება"}
                  </div>
                  <div className="w-1/4">
                    {isEnglish ? "Legal Form" : "სამართლებრივი ფორმა"}
                  </div>
                  <div className="w-1/4">
                    {isEnglish ? "Ownership Form" : "საკუთრების ფორმა"}
                  </div>
                  <div className="w-1/6 text-right">
                    {isEnglish ? "Date" : "თარიღი"}
                  </div>
                </div>

                {/* Table Rows */}
                {fullNameWeb.map((item, index) => (
                  <div
                    key={index}
                    className={`flex px-6 py-4 border-b border-gray-200 hover:bg-[#0080BE] hover:text-white transition-all duration-200 cursor-pointer group ${
                      index === fullNameWeb.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <div className="w-1/3 font-bpg-nino">
                      {item.Full_Name || "-"}
                    </div>
                    <div className="w-1/4 font-bpg-nino">
                      {item.Abbreviation || "-"}
                    </div>
                    <div className="w-1/4 font-bpg-nino">
                      {item.Ownership_Type || "-"}
                    </div>
                    <div className="w-1/6 text-right font-bpg-nino">
                      {item.Date
                        ? new Date(item.Date).toLocaleDateString(
                            isEnglish ? "en-US" : "ka-GE",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            }
                          )
                        : "-"}
                    </div>
                  </div>
                ))}
              </div>
            ) : !fullNameWebLoading && documentData?.Stat_ID ? (
              <EmptyState
                message={
                  isEnglish
                    ? "No company name history found"
                    : "კომპანიის დასახელების ისტორია ვერ მოიძებნა"
                }
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

SearchHistory.propTypes = {
  isEnglish: PropTypes.bool.isRequired,
};

export default SearchHistory;
