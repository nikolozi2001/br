import "../styles/SearchForm.scss";
import React, { useState } from "react";
import { translations } from "../translations/searchForm";
import { useSearchForm } from "../hooks/useSearchForm";
import { AddressSection } from "./AddressSection";
import { BasicInfoSection } from "./BasicInfoSection";
import { EconomicActivitySection } from "./EconomicActivitySection";
import { AdditionalInfoSection } from "./AdditionalInfoSection";
import { FormActions } from "./FormActions";
import SearchResults from "./SearchResults";

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
          <div className="bg-[#fafafa] border border-[#0080BE] rounded-[0_5px_5px_5px]">
            <div className="p-3 sm:p-6">
              {showResults ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base sm:text-lg font-bpg-nino font-bold">
                      {t.searchResults}
                    </h2>
                    <button
                      onClick={handleBackToSearch}
                      disabled={isLoading}
                      className="px-4 py-2 bg-[#0080BE] text-white rounded hover:bg-[#006698] transition-colors font-bpg-nino disabled:opacity-50"
                    >
                      {t.backToSearch}
                    </button>
                  </div>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0080BE]"></div>
                    </div>
                  ) : (
                    <SearchResults results={searchResults} isEnglish={isEnglish} />
                  )}
                </div>
              ) : (
                <>
                  <h2 className="text-base sm:text-lg mb-4 sm:mb-6 text-center font-bpg-nino font-bold">
                    {t.title}
                  </h2>
                  <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
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
                      formData={formData.economicActivity}
                      handleInputChange={handleInputChange}
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
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          name="isActive"
                          className="w-4 h-4 text-[#0080BE] border-gray-300 rounded focus:ring-[#0080BE] cursor-pointer"
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              isActive: e.target.checked,
                            }))
                          }
                        />
                        <label
                          htmlFor="isActive"
                          className="flex items-center gap-2 font-bpg-nino font-bold"
                        >
                          {t.activeSubject}
                          <div className="relative group">
                            <svg
                              className="w-5 h-5 text-[#0080BE] cursor-help"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <div className="absolute left-0 w-[calc(100vw-2rem)] sm:w-96 p-2 bg-white border border-gray-200 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 text-xs sm:text-sm">
                              {t.activeTooltip}
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                    <FormActions t={t} onReset={handleReset} isLoading={isLoading} />
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchForm;
