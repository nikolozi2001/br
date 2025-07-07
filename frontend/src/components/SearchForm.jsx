import "../styles/SearchForm.scss";
import React, { useState } from "react";
import { translations } from "../translations/searchForm";
import { ActiveFilterCheckbox } from "./common/ActiveFilterCheckbox";
import { useSearchForm } from "../hooks/useSearchForm";
import { AddressSection } from "./AddressSection";
import { BasicInfoSection } from "./BasicInfoSection";
import { EconomicActivitySection } from "./EconomicActivitySection";
import { AdditionalInfoSection } from "./AdditionalInfoSection";
import { FormActions } from "./FormActions";
import SearchResults from "./SearchResults";
import georgianFont from "../fonts/NotoSansGeorgian_ExtraCondensed-Bold.ttf";
import loaderIcon from "../assets/images/equalizer.svg";

function SearchForm({ isEnglish }) {
  const t = translations[isEnglish ? "en" : "ge"];
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const results = await handleSubmit();
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      { label: "identificationNumber", path: "identificationNumber" },
      { label: "personalNumber", path: "personalNumber" },
      { label: "organizationalLegalForm", path: "legalForm" },
      { label: "organizationName", path: "name" },
      { label: "legalRegion", path: "legalAddress.region" },
      { label: "legalAddress", path: "legalAddress.address" },
      { label: "factualRegion", path: "factualAddress.region" },
      { label: "factualAddress", path: "factualAddress.address" },
      { label: "activityCode", path: "activities[0].code" },
      { label: "activityDescription", path: "activities[0].name" },
      { label: "head", path: "head" },
      { label: "phone", path: "phone" },
      { label: "partner", path: "partner" },
      { label: "email", path: "email" },
      { label: "ownershipForm", path: "ownershipType" },
      { label: "activeSubject", path: "isActive" },
      { label: "businessSize", path: "size" },
    ];

    const csvContent =
      "\ufeff" +
      [
        // Headers row with translated labels
        headers
          .map((header) => {
            // Handle special cases for addresses
            if (header.label === "legalRegion") {
              return `"${t.region} (${t.legalAddress})"`;
            } else if (header.label === "factualRegion") {
              return `"${t.region} (${t.factualAddress})"`;
            }
            // Normal translation
            return `"${t[header.label]}"`;
          })
          .join(","),
        // Data rows
        ...searchResults.map((row) =>
          headers
            .map((header) => {
              let value;
              const path = header.path;
              if (path.includes("[")) {
                // Handle array paths (activities)
                const [arrayPath, arrayKey] = path.split(".");
                value = row[arrayPath.split("[")[0]][0]?.[arrayKey] || "";
              } else if (path.includes(".")) {
                // Handle nested object paths (addresses)
                const [objPath, key] = path.split(".");
                value = row[objPath][key];
              } else {
                // Handle direct properties
                value = row[path];
              }
              if (path === "isActive") value = value ? "✓" : "✗";
              return `"${value || ""}"`;
            })
            .join(",")
        ),
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `business_registry_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <th>${t.legalAddress}</th>
            <th>${t.region} (${t.factualAddress})</th>
            <th>${t.factualAddress}</th>
            <th>NACE 2</th>
            <th>${t.activityDescription}</th>
            <th>${t.head}</th>
            <th>${t.phone}</th>
            <th>${t.partner}</th>
            <th>${t.email}</th>
            <th>${t.ownershipForm}</th>
            <th>${t.activeSubject}</th>
            <th>${t.businessSize}</th>
          </tr>
        </thead>
        <tbody>
          ${searchResults
            .map(
              (result) => `
            <tr>
              <td>${result.identificationNumber || ""}</td>
              <td>${result.personalNumber || ""}</td>
              <td>${result.legalForm || ""}</td>
              <td>${result.name || ""}</td>
              <td>${result.legalAddress?.region || ""}</td>
              <td>${result.legalAddress?.address || ""}</td>
              <td>${result.factualAddress?.region || ""}</td>
              <td>${result.factualAddress?.address || ""}</td>
              <td>${result.activities?.[0]?.code || ""}</td>
              <td>${result.activities?.[0]?.name || ""}</td>
              <td>${result.head || ""}</td>
              <td>${result.phone || ""}</td>
              <td>${result.partner || ""}</td>
              <td>${result.email || ""}</td>
              <td>${result.ownershipType || ""}</td>
              <td>${result.isActive ? "✓" : "✗"}</td>
              <td>${result.size || ""}</td>
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

  const handleBackToSearch = () => {
    setShowResults(false);
    setSearchResults([]);
  };

  const handleLegalFormChange = (options) => {
    setFormData((prev) => ({
      ...prev,
      organizationalLegalForm: options
        ? options.map((option) => option.value)
        : [],
    }));
  };

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8">
          <div
            className={`bg-[#fafafa] border border-[#0080BE] rounded-[0_5px_5px_5px] ${
              isLoading ? "bg-[red]" : ""
            }`}
          >
            {isLoading ? (
              <div className="geostat-loader">
                <img src={loaderIcon} alt="Loading..." />
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
                          onClick={exportToCSV}
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
                          {t.exportToCSV}
                        </button>
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
                        isEnglish={isEnglish}
                        formData={formData}
                        handleInputChange={handleInputChange}
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
                                  ? selected.map((option) => option.value)
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
                                  ? selected.map((option) => option.value)
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
                            handleInputChange(e, "personalAddress", "address")
                          }
                          regionOptions={regionOptions}
                          municipalityOptions={personalMunicipalityOptions}
                          onRegionChange={(selected) => {
                            setFormData((prev) => ({
                              ...prev,
                              personalAddress: {
                                ...prev.personalAddress,
                                region: selected
                                  ? selected.map((option) => option.value)
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
                                  ? selected.map((option) => option.value)
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
                        isLoading={isLoading}
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
  );
}

export default SearchForm;
