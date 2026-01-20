import "../styles/SearchForm.scss";
import React, { useState, useEffect } from "react";
import { translations } from "../translations/searchForm";
import * as XLSX from "xlsx";
import { ActiveFilterCheckbox } from "./common/ActiveFilterCheckbox";
import { useSearchForm } from "../hooks/useSearchForm";
import { AddressSection } from "./AddressSection";
import { BasicInfoSection } from "./BasicInfoSection";
import { EconomicActivitySection } from "./EconomicActivitySection";
import { AdditionalInfoSection } from "./AdditionalInfoSection";
import { FormActions } from "./FormActions";
import SearchResults from "./SearchResults";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getPageTitle } from "../utils/pageTitles";
import { useNavigation } from "../hooks/useNavigation";
import { fetchLegalFormsRaw, fetchDocuments } from "../services/api";
import georgianFont from "../fonts/NotoSansGeorgian_ExtraCondensed-Bold.ttf";
import loaderIcon from "../assets/images/equalizer.svg";
import SEO from "./SEO";

function SearchForm({ isEnglish }) {
  // Set page-specific title
  useDocumentTitle(isEnglish, getPageTitle("home", isEnglish));

  const t = translations[isEnglish ? "en" : "ge"];
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [isStopped, setIsStopped] = useState(false);
  const [legalFormsMap, setLegalFormsMap] = useState({});
  const [lastSearchParams, setLastSearchParams] = useState(null); // Store last successful search params
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(''); // 'excel' or 'access'
  const { navigationDirection, isNavigating } = useNavigation();
  const {
    formData,
    setFormData,
    organizationalLegalFormOptions,
    regionOptions,
    personalMunicipalityOptions,
    legalMunicipalityOptions,
    handleInputChange,
    handleReset,
    handleSubmit,
  } = useSearchForm(isEnglish);

  // Fetch legal forms for mapping
  useEffect(() => {
    const loadLegalForms = async () => {
      try {
        const legalForms = await fetchLegalFormsRaw();
        const formsMap = {};
        
        // Ensure legalForms is an array before calling forEach
        if (Array.isArray(legalForms)) {
          legalForms.forEach((form) => {
            formsMap[form.Legal_Form_ID] = form.Legal_Form;
          });
        } else {
          console.error('Legal forms data is not an array:', legalForms);
        }
        
        setLegalFormsMap(formsMap);
      } catch (error) {
        console.error("Error loading legal forms:", error);
      }
    };

    loadLegalForms();
  }, []);

  useEffect(() => {
    // Reset flip state when navigating
    if (isNavigating) {
      setIsFlipped(false);
    }

    // Trigger flip animation
    const timer = setTimeout(
      () => {
        setIsFlipped(true);
      },
      isNavigating ? 200 : 100
    );

    return () => clearTimeout(timer);
  }, [isNavigating]);

  // Check for URL parameters on component mount and auto-search
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const identificationNumber = urlParams.get("identificationNumber");

    if (identificationNumber) {
      // Set the form data with the URL parameter and ensure activities is an array
      setFormData((prev) => ({
        ...prev,
        identificationNumber: identificationNumber,
        activities: Array.isArray(prev.activities) ? prev.activities : [{
          code: "",
          name: ""
        }],
      }));
    }
  }, [setFormData]);

  // Auto-search when formData is updated from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const identificationNumber = urlParams.get("identificationNumber");

    if (
      identificationNumber &&
      formData.identificationNumber === identificationNumber &&
      !showResults
    ) {
      // Auto-submit the search
      const autoSearch = async () => {
        setIsLoading(true);
        try {
          const results = await handleSubmit();
          setSearchResults(results);
          setShowResults(true);
        } catch (error) {
          console.error("Error fetching results from URL:", error);
        } finally {
          setIsLoading(false);
        }
      };

      autoSearch();
    }
  }, [formData.identificationNumber, handleSubmit, showResults]);

  const handleBackToSearch = () => {
    setShowResults(false);
    setSearchResults([]);
    setPagination(null);

    // Clear URL parameters when going back to search
    const url = new URL(window.location);
    url.searchParams.delete("identificationNumber");
    window.history.replaceState({}, "", url.toString());
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // Reset states
    setIsStopped(false);
    setShowResults(false);
    setSearchResults([]);
    setPagination(null);
    setIsLoading(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // We wrap this in a try/catch to catch any unexpected logic errors
      const response = await handleSubmit(controller.signal);

      // If we have a response and it wasn't aborted
      if (response && !controller.signal?.aborted) {
        setSearchResults(response.results || []);
        setPagination(response.pagination);
        setLastSearchParams(formData);
        setShowResults(true);

        if (!response.results || response.results.length === 0) {
          alert(isEnglish ? "No results found." : "შედეგები არ მოიძებნა.");
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Search was cancelled");
      } else {
        console.error("Critical Search Error:", error);
        alert(isEnglish ? "An error occurred. Please try again." : "დაფიქსირდა შეცდომა. სცადეთ ხელახლა.");
      }
    } finally {
      // THIS IS THE KEY: This always runs regardless of success or crash
      setIsLoading(false); 
      setAbortController(null);
    }
};

  const handleStopSearch = () => {
    console.log("Stop search called - setting isStopped to true");
    // Set flag to indicate search was intentionally stopped
    setIsStopped(true);

    if (abortController) {
      console.log("Aborting current request");
      abortController.abort();
      setAbortController(null);
    }

    // Use setTimeout to ensure state updates are processed correctly
    setTimeout(() => {
      console.log("Stop search cleanup - resetting states");
      // Reset all states immediately to ensure proper navigation
      setIsLoading(false);
      setIsExporting(false);
      setExportProgress(0);
      setExportType('');
      setShowResults(false);
      setSearchResults([]);
      setPagination(null);

      // Clear URL parameters
      const url = new URL(window.location);
      url.searchParams.delete("identificationNumber");
      window.history.replaceState({}, "", url.toString());
    }, 0);
  };

  // Recovery function to reset all states when component gets stuck
  const resetAllStates = () => {
    console.log("Resetting all states - manual recovery");
    setIsLoading(false);
    setIsExporting(false);
    setExportProgress(0);
    setExportType('');
    setShowResults(false);
    setSearchResults([]);
    setPagination(null);
    setIsStopped(false);
    setIsFlipped(false);
    
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    
    // Clear URL parameters
    const url = new URL(window.location);
    url.searchParams.delete("identificationNumber");
    window.history.replaceState({}, "", url.toString());
  };

  const exportToExcel = async () => {
  try {
    if (!pagination?.total || !lastSearchParams) {
      alert(isEnglish ? "No data to export" : "ექსპორტისთვის მონაცემები არ არის");
      return;
    }

    const totalRecords = pagination.total;
    const CHUNK_SIZE = 50000; 
    const MAX_RECORDS_PER_FILE = 600000;
    
    setIsLoading(true);
    setIsExporting(true);
    setExportType('excel');
    setExportProgress(0);

    // Prepare CSV Header
    const headers = [
      { label: "identificationNumber", path: "identificationNumber" },
      { label: "personalNumber", path: "personalNumber" },
      { label: "organizationalLegalForm", path: "legalFormId" },
      { label: "organizationName", path: "name" },
      { label: "legalRegion", path: "legalAddress.region" },
      { label: "legalCity", path: "legalAddress.city" },
      { label: "legalAddress", path: "legalAddress.address" },
      { label: "factualRegion", path: "factualAddress.region" },
      { label: "factualCity", path: "factualAddress.city" },
      { label: "factualAddress", path: "factualAddress.address" },
      { label: "activityCode", path: "activities[0].code" },
      { label: "activityDescription", path: "activities[0].name" },
      { label: "head", path: "head" },
      { label: "partner", path: "partner" },
      { label: "phone", path: "phone" },
      { label: "email", path: "email" },
      { label: "web", path: "web" },
      { label: "ownershipForm", path: "ownershipType" },
      { label: "activeSubject", path: "isActive" },
      { label: "businessSize", path: "Zoma" },
      { label: "initRegDate", path: "Init_Reg_date" },
    ];

    const headerRow = headers.map(h => t[h.label] || h.label).join(",") + "\n";

    // Check if we need to split into multiple files
    if (totalRecords > MAX_RECORDS_PER_FILE) {
      const totalFiles = Math.ceil(totalRecords / MAX_RECORDS_PER_FILE);
      const totalChunksOverall = Math.ceil(totalRecords / CHUNK_SIZE);
      let processedChunks = 0;
      
      for (let fileIndex = 0; fileIndex < totalFiles; fileIndex++) {
        if (isStopped) break;
        
        const startRecord = fileIndex * MAX_RECORDS_PER_FILE;
        const endRecord = Math.min(startRecord + MAX_RECORDS_PER_FILE, totalRecords);
        const recordsInThisFile = endRecord - startRecord;
        
        // CSV Start with UTF-8 BOM and headers for each file
        let csvContent = "\ufeff" + headerRow;
        
        const startChunk = Math.floor(startRecord / CHUNK_SIZE);
        const endChunk = Math.ceil(endRecord / CHUNK_SIZE);
        
        for (let chunkIndex = startChunk; chunkIndex < endChunk; chunkIndex++) {
          if (isStopped) break;
          
          const response = await fetchDocuments(
            lastSearchParams,
            isEnglish ? "en" : "ge",
            [],
            null,
            { page: chunkIndex + 1, limit: CHUNK_SIZE }
          );

          let chunk = [];
          if (response && response.results && Array.isArray(response.results)) {
            chunk = response.results;
          } else {
            console.warn('Invalid response structure in exportToExcel:', response);
            continue;
          }
          
          // Filter records for current file
          const chunkStartInFile = Math.max(0, startRecord - chunkIndex * CHUNK_SIZE);
          const chunkEndInFile = Math.min(chunk.length, endRecord - chunkIndex * CHUNK_SIZE);
          const filteredChunk = chunk.slice(chunkStartInFile, chunkEndInFile);
          
          // Process chunk into CSV string
          const chunkRows = filteredChunk.map(row => {
            return headers.map(header => {
              let val = "";
              if (header.path.includes(".")) {
                if (header.path.startsWith("activities")) val = row.activities?.[0]?.[header.path.split('.')[1]];
                else val = row[header.path.split('.')[0]]?.[header.path.split('.')[1]];
              } else {
                val = row[header.path];
              }
              
              // Handle special fields
              if (header.path === "legalFormId") val = legalFormsMap[val] || row.abbreviation || "";
              if (header.path === "isActive") val = val ? (isEnglish ? "Active" : "აქტიური") : (isEnglish ? "Inactive" : "არააქტიური");
              
              // Handle date field
              if (header.path === "Init_Reg_date") {
                if (val) {
                  try {
                    const date = new Date(val);
                    val = date.toISOString().split('T')[0];
                    return val;
                  } catch {
                    return `"${String(val || "").replace(/"/g, '""')}"`;
                  }
                }
                return "";
              }
              
              return `"${String(val || "").replace(/"/g, '""')}"`;
            }).join(",");
          }).join("\n");

          if (chunkRows) csvContent += chunkRows + "\n";
          
          // Update progress after each chunk
          processedChunks++;
          const progress = (processedChunks / totalChunksOverall) * 100;
          setExportProgress(progress);
        }
        
        if (isStopped) break;
        
        // Download each file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `business_registry_${new Date().toISOString().split('T')[0]}_part${fileIndex + 1}_of_${totalFiles}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Wait a bit before removing the link
        await new Promise(resolve => setTimeout(resolve, 100));
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`File ${fileIndex + 1}/${totalFiles} exported with ${recordsInThisFile} records`);
        
        // Longer delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } else {
      // Single file export (original logic)
      let csvContent = "\ufeff" + headerRow;
      
      const totalChunks = Math.ceil(totalRecords / CHUNK_SIZE);
      for (let i = 0; i < totalChunks; i++) {
        if (isStopped) break;

        const response = await fetchDocuments(
          lastSearchParams,
          isEnglish ? "en" : "ge",
          [],
          null,
          { page: i + 1, limit: CHUNK_SIZE }
        );

        let chunk = [];
        if (response && response.results && Array.isArray(response.results)) {
          chunk = response.results;
        } else {
          console.warn('Invalid response structure in exportToExcel:', response);
          continue;
        }
        
        // Process chunk into CSV string
        const chunkRows = chunk.map(row => {
          return headers.map(header => {
            let val = "";
            if (header.path.includes(".")) {
              if (header.path.startsWith("activities")) val = row.activities?.[0]?.[header.path.split('.')[1]];
              else val = row[header.path.split('.')[0]]?.[header.path.split('.')[1]];
            } else {
              val = row[header.path];
            }
            
            // Handle special fields
            if (header.path === "legalFormId") val = legalFormsMap[val] || row.abbreviation || "";
            if (header.path === "isActive") val = val ? (isEnglish ? "Active" : "აქტიური") : (isEnglish ? "Inactive" : "არააქტიური");
            
            // Handle date field
            if (header.path === "Init_Reg_date") {
              if (val) {
                try {
                  const date = new Date(val);
                  val = date.toISOString().split('T')[0];
                  return val;
                } catch {
                  return `"${String(val || "").replace(/"/g, '""')}"`;
                }
              }
              return "";
            }
            
            return `"${String(val || "").replace(/"/g, '""')}"`;
          }).join(",");
        }).join("\n");

        csvContent += chunkRows + "\n";
        
        // Update progress
        const progress = ((i + 1) / totalChunks) * 100;
        setExportProgress(progress);
        
        console.log(`Exported ${Math.min((i + 1) * CHUNK_SIZE, totalRecords)} / ${totalRecords}`);
      }

      if (isStopped) return;

      // Single file download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `business_registry_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

  } catch (error) {
    console.error("Export Error:", error);
    
    // More specific error messages
    const errorMessage = error.name === "AbortError" 
      ? (isEnglish ? "Export was cancelled" : "ექსპორტი გაუქმდა")
      : (isEnglish ? "Error during export. Please try again." : "ექსპორტის შეცდომა. გთხოვთ, სცადოთ ხელახლა.");
    
    alert(errorMessage);
    
    // Reset states to prevent stuck state
    setIsStopped(false);
  } finally {
    setIsLoading(false);
    setIsExporting(false);
    setExportProgress(0);
    setExportType('');
  }
};

  const exportToAccess = async () => {
    try {
      if (!pagination?.total || !lastSearchParams) {
        alert(isEnglish ? "No data to export" : "ექსპორტისთვის მონაცემები არ არის");
        return;
      }

      const totalRecords = pagination.total;
      const CHUNK_SIZE = 100000;
      const CONCURRENCY = 5; // Optimal concurrency for API requests
      
      setIsLoading(true);
      setIsExporting(true);
      setExportType('access');
      setExportProgress(0);

      // Helper function to fetch data in parallel batches
      const fetchInBatches = async () => {
        const totalChunks = Math.ceil(totalRecords / CHUNK_SIZE);
        const pages = Array.from({ length: totalChunks }, (_, i) => i + 1);
        
        let allResults = [];
        
        for (let i = 0; i < pages.length; i += CONCURRENCY) {
          if (isStopped) break;

          const batch = pages.slice(i, i + CONCURRENCY);
          const responses = await Promise.all(
            batch.map(async page => {
              try {
                return await fetchDocuments(
                  lastSearchParams,
                  isEnglish ? "en" : "ge",
                  [],
                  null,
                  { page, limit: CHUNK_SIZE }
                );
              } catch (error) {
                console.warn(`Error fetching page ${page}:`, error);
                return { results: [] }; // Return empty results on error
              }
            })
          );

          responses.forEach(response => {
            if (response && response.results && Array.isArray(response.results)) {
              allResults.push(...response.results);
            }
          });

          // Update progress after each batch
          setExportProgress((allResults.length / totalRecords) * 100);
        }
        
        return allResults;
      };

      // Prepare headers for Access (using semicolon separator)
      const headers = [
        { label: "identificationNumber", path: "identificationNumber" },
        { label: "personalNumber", path: "personalNumber" },
        { label: "organizationalLegalForm", path: "legalFormId" },
        { label: "organizationName", path: "name" },
        { label: "legalRegion", path: "legalAddress.region" },
        { label: "legalCity", path: "legalAddress.city" },
        { label: "legalAddress", path: "legalAddress.address" },
        { label: "factualRegion", path: "factualAddress.region" },
        { label: "factualCity", path: "factualAddress.city" },
        { label: "factualAddress", path: "factualAddress.address" },
        { label: "activityCode", path: "activities[0].code" },
        { label: "activityDescription", path: "activities[0].name" },
        { label: "head", path: "head" },
        { label: "partner", path: "partner" },
        { label: "phone", path: "phone" },
        { label: "email", path: "email" },
        { label: "web", path: "web" },
        { label: "ownershipForm", path: "ownershipType" },
        { label: "activeSubject", path: "isActive" },
        { label: "businessSize", path: "Zoma" },
        { label: "initRegDate", path: "Init_Reg_date" },
      ];

      // Access-compatible CSV with UTF-8 BOM and semicolon separator
      let csvContent = "\ufeff";
      csvContent += headers.map(h => `"${(t[h.label] || h.label).replace(/"/g, '""')}"`).join(";") + "\n";

      // Loop through pages in parallel batches
      const allResults = await fetchInBatches();
      
      if (isStopped) return;

      // Process all results into CSV string with semicolon separator
      const allRows = allResults.map(row => {
        const getValue = (path) => {
          const keys = path.split(/[.[\]]/).filter(key => key && key !== '0');
          let value = row;
          
          for (const key of keys) {
            if (value && typeof value === 'object') {
              if (Array.isArray(value)) {
                // For arrays, get first element and then access the key
                value = value[0];
                if (value && typeof value === 'object' && key) {
                  value = value[key];
                }
              } else {
                value = value[key];
              }
            } else {
              break;
            }
          }
          
          return value || "";
        };

        return headers.map(header => {
          let value = getValue(header.path);
          
          // Handle special fields
          if (header.path === "legalFormId") {
            value = legalFormsMap[value] || row.abbreviation || "";
          } else if (header.path === "isActive") {
            value = value ? (isEnglish ? "Active" : "აქტიური") : (isEnglish ? "Inactive" : "არააქტიური");
          } else if (header.path === "Init_Reg_date") {
            value = formatDate(value);
          } else if (typeof value === 'boolean') {
            value = value ? (isEnglish ? "Active" : "აქტიური") : (isEnglish ? "Inactive" : "არააქტიური");
          }
          
          // Escape quotes and wrap in quotes for Access compatibility
          return `"${String(value || "").replace(/"/g, '""')}"`;
        }).join(";");
      }).join("\n");

      csvContent += allRows + "\n";

      if (isStopped) return;

      // Trigger Download with .csv extension but Access-compatible format
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `business_registry_access_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Access Export Error:", error);
      
      // More specific error messages
      const errorMessage = error.name === "AbortError" 
        ? (isEnglish ? "Export was cancelled" : "ექსპორტი გაუქმდა")
        : (isEnglish ? "Error during Access export. Please try again." : "Access ექსპორტის შეცდომა. გთხოვთ, სცადოთ ხელახლა.");
      
      alert(errorMessage);
      
      // Reset states to prevent stuck state
      setIsStopped(false);
    } finally {
      setIsLoading(false);
      setIsExporting(false);
      setExportProgress(0);
      setExportType('');
    }
  };

  // console.log("Search Results:", searchResults);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      // Format as DD.MM.YYYY
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return dateString; // Return original if formatting fails
    }
  };

  const generateTableContent = (searchResults, t) => {
    return `
      <table>
        <thead>
          <tr>
            <th>${t.identificationNumber}</th>
            <th>${t.personalNumber}</th>
            <th>${t.organizationalLegalForm}</th>
            <th>${t.organizationName}</th>
            <th>${t.region} (${t.legalAddress})</th>
            <th>${t.city} (${t.legalAddress})</th>
            <th>${t.legalAddress}</th>
            <th>${t.region} (${t.factualAddress})</th>
            <th>${t.city} (${t.factualAddress})</th>
            <th>${t.factualAddress}</th>
            <th>NACE 2</th>
            <th>${t.activityDescription}</th>
            <th>${t.head}</th>
            <th>${t.partner}</th>
            <th>${t.phone}</th>
            <th>${t.email}</th>
            <th>${t.web || "Web"}</th>
            <th>${t.ownershipForm}</th>
            <th>${t.activeSubject}</th>
            <th>${t.businessSize}</th>
            <th>${t.initRegDate}</th>
          </tr>
        </thead>
        <tbody>
          ${searchResults
            .map(
              (result) => `
            <tr>
              <td>${result.identificationNumber || ""}</td>
              <td>${result.personalNumber || ""}</td>
              <td>${
                legalFormsMap[result.legalFormId] || result.abbreviation || ""
              }</td>
              <td>${result.name || ""}</td>
              <td>${result.legalAddress?.region || ""}</td>
              <td>${result.legalAddress?.city || ""}</td>
              <td>${result.legalAddress?.address || ""}</td>
              <td>${result.factualAddress?.region || ""}</td>
              <td>${result.factualAddress?.city || ""}</td>
              <td>${result.factualAddress?.address || ""}</td>
              <td>${result.activities?.[0]?.code || ""}</td>
              <td>${result.activities?.[0]?.name || ""}</td>
              <td>${result.head || ""}</td>
              <td>${result.partner || ""}</td>
              <td>${result.phone || ""}</td>
              <td>${result.email || ""}</td>
              <td>${result.web || ""}</td>
              <td>${result.ownershipType || ""}</td>
              <td>${result.isActive ? "აქტიური" : "არააქტიური"}</td>
              <td>${result.Zoma || ""}</td>
              <td>${formatDate(result.Init_Reg_date) || ""}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  };

  const getStyles = () => {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Arial:wght@400;700&display=swap');
      @font-face {
        font-family: 'BPG Nino Mtavruli';
        src: url('/fonts/bpg-nino-mtavruli/fonts/bpg-nino-mtavruli-webfont.woff2') format('woff2'),
             url('/fonts/bpg-nino-mtavruli/fonts/bpg-nino-mtavruli-webfont.woff') format('woff');
        font-weight: normal;
        font-style: normal;
      }
      
      @media print {
        @page { size: landscape; }
        
        body { 
          padding: 20px;
          font-family: Arial, sans-serif;
          margin: 0;
        }
        
        table { 
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        th, td { 
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          font-size: 11px;
        }
        
        th { 
          background-color: #f8f8f8;
          font-weight: bold;
        }
        
        tr:nth-child(even) {
          background-color: #fafafa;
        }
      }
    `;
  };

  const handlePrint = (printWindow) => {
    return new Promise((resolve) => {
      const checkPrintDialogClosed = () => {
        if (printWindow.closed) {
          resolve();
        } else {
          setTimeout(checkPrintDialogClosed, 500);
        }
      };

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
          resolve();
        };
        checkPrintDialogClosed();
      }, 1000);
    });
  };

  const printResults = async () => {
    const printWindow = window.open("", "_blank", "height=600,width=800");

    if (!printWindow) {
      alert("Please allow pop-ups to print the results.");
      return;
    }

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Business Registry Results</title>
          <style>${getStyles()}</style>
        </head>
        <body>
          <div id="printableContent">
            ${generateTableContent(searchResults, t)}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();

    try {
      await handlePrint(printWindow);
    } catch (error) {
      console.error("Print failed:", error);
      if (!printWindow.closed) {
        printWindow.close();
      }
    }
  };

  const handleLegalFormChange = (options) => {
    setFormData((prev) => ({
      ...prev,
      organizationalLegalForm: (options && Array.isArray(options))
        ? options.map((option) => option.value)
        : [],
    }));
  };

  const homeStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: isEnglish ? "Business Register Search" : "ბიზნეს რეგისტრის ძებნა",
    description: isEnglish
      ? "Search and find information about Georgian businesses and economic entities in the official Statistical Business Register"
      : "მოძებნეთ და იპოვეთ ინფორმაცია ქართული ბიზნესების და ეკონომიკური სუბიექტების შესახებ ოფიციალურ სტატისტიკურ ბიზნეს რეგისტრში",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GEL",
    },
  };

  return (
    <div className="w-full">
      <SEO
        title={
          isEnglish
            ? "Business Register Search - Find Georgian Companies"
            : "ბიზნეს რეგისტრის ძებნა - იპოვეთ ქართული კომპანიები"
        }
        description={
          isEnglish
            ? "Search the official Statistical Business Register of Georgia. Find comprehensive information about Georgian businesses, economic entities, and their activities."
            : "მოძებნეთ საქართველოს ოფიციალური სტატისტიკური ბიზნეს რეგისტრი. იპოვეთ ყრმა ინფორმაცია ქართული ბიზნესების, ეკონომიკური სუბიექტების და მათი საქმიანობის შესახებ."
        }
        keywords={
          isEnglish
            ? "business search, georgian companies, company lookup, business registry, economic entities, company information"
            : "ბიზნეს ძებნა, ქართული კომპანიები, კომპანიის მოძებნა, ბიზნეს რეგისტრი, ეკონომიკური სუბიექტები, კომპანიის ინფორმაცია"
        }
        isEnglish={isEnglish}
        type="website"
        structuredData={homeStructuredData}
      />
      <div className="container mx-auto">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8">
          <div
            className={`flipper-container ${isFlipped ? "flipped" : ""} ${
              navigationDirection === "left" ? "flip-left" : "flip-right"
            }`}
          >
            <div className="flipper">
              <div
                className={`border border-[#0080BE] rounded-[0_5px_5px_5px] ${
                  isLoading ? "" : "bg-[#fafafa]"
                }`}
              >
                {isLoading ? (
                  <div className="flex justify-center items-center min-h-[400px] bg-white">
                    <div className="flex flex-col items-center space-y-4">
                      {isExporting ? (
                        <>
                          <div className="w-64">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700 font-bpg-nino">
                                {exportType === 'excel' 
                                  ? (isEnglish ? 'Exporting to Excel...' : 'Excel-ში ექსპორტი...') 
                                  : (isEnglish ? 'Exporting to Access...' : 'Access-ში ექსპორტი...')
                                }
                              </span>
                              <span className="text-sm font-medium text-gray-700 font-bpg-nino">
                                {Math.round(exportProgress)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-[#0080BE] h-2.5 rounded-full transition-all duration-300 ease-out" 
                                style={{ width: `${exportProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <img
                            src={loaderIcon}
                            alt="Loading..."
                            className="w-12 h-12 animate-pulse"
                          />
                          <p className="text-gray-600 font-bpg-nino text-sm">
                            {isEnglish ? "Loading..." : "იტვირთება..."}
                          </p>
                        </>
                      )}
                      <button
                        type="button"
                        className="flex items-center justify-center px-6 py-2 font-bold text-red-600 border border-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer text-sm font-bpg-nino rounded mt-4"
                        onClick={handleStopSearch}
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        {isExporting ? (isEnglish ? 'Cancel Export' : 'ექსპორტის გაუქმება') : t.stopSearch}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 sm:p-6">
                    {showResults ? (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-base sm:text-lg font-bpg-nino font-bold">
                            {t.searchResults}
                          </h2>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={printResults}
                              style={{ fontFamily: georgianFont }}
                              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-all duration-200 text-sm font-medium group shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:bg-indigo-600 cursor-pointer"
                              disabled={!searchResults?.length || isLoading}
                            >
                              <svg
                                className="w-5 h-5 mr-2 transform group-hover:translate-y-0.5 transition-transform"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                />
                              </svg>
                              {t.print || "Print"}
                            </button>
                            <button
                              onClick={exportToExcel}
                              style={{ fontFamily: georgianFont }}
                              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-all duration-200 text-sm font-medium group shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:bg-emerald-600 cursor-pointer"
                              disabled={!searchResults?.length || isLoading}
                            >
                              <svg
                                className="w-5 h-5 mr-2 transform group-hover:translate-y-0.5 transition-transform"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              {t.exportToExcel}
                            </button>
                            <button
                              onClick={exportToAccess}
                              style={{ fontFamily: georgianFont }}
                              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-all duration-200 text-sm font-medium group shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:bg-red-600 cursor-pointer"
                              disabled={!searchResults?.length || isLoading}
                            >
                              <svg
                                className="w-5 h-5 mr-2 transform group-hover:translate-y-0.5 transition-transform"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                                />
                              </svg>
                              {t.exportToAccess || (isEnglish ? "Export to Access" : "Access-ში ექსპორტი")}
                            </button>
                            {isLoading && (
                              <button
                                type="button"
                                className="flex items-center justify-center px-4 py-2 font-bold text-red-600 border border-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer text-sm font-bpg-nino rounded"
                                onClick={handleStopSearch}
                              >
                                <svg
                                  className="w-4 h-4 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                                {t.stopSearch}
                              </button>
                            )}
                            <button
                              onClick={handleBackToSearch}
                              disabled={isLoading}
                              className="px-4 py-2 bg-[#0080BE] text-white rounded hover:bg-[#006698] transition-colors font-bpg-nino disabled:opacity-50 cursor-pointer"
                            >
                              {t.backToSearch}
                            </button>
                          </div>
                        </div>
                        {isLoading ? (
                          <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0080BE]"></div>
                          </div>
                        ) : (
                          <SearchResults
                            results={searchResults}
                            pagination={pagination}
                            isEnglish={isEnglish}
                            formData={formData}
                            handleInputChange={handleInputChange}
                            legalFormsMap={legalFormsMap}
                          />
                        )}
                      </div>
                    ) : (
                      <>
                        <h2 className="text-base sm:text-lg mb-4 sm:mb-6 text-center font-bpg-nino font-bold">
                          {t.title}
                        </h2>
                        <form
                          onSubmit={onSubmit}
                          className={`space-y-4 sm:space-y-6`}
                        >
                          <BasicInfoSection
                            formData={formData}
                            handleInputChange={handleInputChange}
                            handleLegalFormChange={handleLegalFormChange}
                            organizationalLegalFormOptions={
                              organizationalLegalFormOptions
                            }
                            t={t}
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <AddressSection
                              title={t.legalAddress}
                              formData={formData.legalAddress}
                              handleInputChange={(e) =>
                                handleInputChange(e, "legalAddress", "address")
                              }
                              regionOptions={regionOptions}
                              municipalityOptions={legalMunicipalityOptions}
                              onRegionChange={(selected) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  legalAddress: {
                                    ...prev.legalAddress,
                                    region: selected
                                      ? (Array.isArray(selected) ? selected.map((option) => option.value) : [])
                                      : [],
                                  },
                                }));
                              }}
                              onMunicipalityChange={(selected) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  legalAddress: {
                                    ...prev.legalAddress,
                                    municipalityCity: selected
                                      ? (Array.isArray(selected) ? selected.map((option) => option.value) : [])
                                      : [],
                                  },
                                }));
                              }}
                              t={t}
                            />

                            <AddressSection
                              title={t.factualAddress}
                              formData={formData.personalAddress}
                              handleInputChange={(e) =>
                                handleInputChange(
                                  e,
                                  "personalAddress",
                                  "address"
                                )
                              }
                              regionOptions={regionOptions}
                              municipalityOptions={personalMunicipalityOptions}
                              onRegionChange={(selected) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  personalAddress: {
                                    ...prev.personalAddress,
                                    region: selected
                                      ? (Array.isArray(selected) ? selected.map((option) => option.value) : [])
                                      : [],
                                  },
                                }));
                              }}
                              onMunicipalityChange={(selected) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  personalAddress: {
                                    ...prev.personalAddress,
                                    municipalityCity: selected
                                      ? (Array.isArray(selected) ? selected.map((option) => option.value) : [])
                                      : [],
                                  },
                                }));
                              }}
                              t={t}
                            />
                          </div>{" "}
                          <EconomicActivitySection
                            formData={formData}
                            setFormData={setFormData}
                            t={t}
                            isEnglish={isEnglish}
                          />
                          <AdditionalInfoSection
                            formData={formData}
                            handleInputChange={handleInputChange}
                            t={t}
                            isEnglish={isEnglish}
                          />
                          <div className="w-full mb-4">
                            <ActiveFilterCheckbox
                              isActive={formData.isActive}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  isActive: e.target.checked,
                                }))
                              }
                              t={t}
                            />
                          </div>
                          <FormActions
                            t={t}
                            onReset={handleReset}
                            onStop={handleStopSearch}
                            isLoading={isLoading}
                            onResetAll={resetAllStates}
                          />
                        </form>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchForm;
