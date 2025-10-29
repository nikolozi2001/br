import { useState, useEffect, useCallback } from "react";
import { fetchLegalForms, fetchDocuments } from "../services/api";

const initialFormData = {
  identificationNumber: "",
  organizationName: "",
  organizationalLegalForm: [],
  head: "",
  partner: "",
  status: "",
  isActive: false,
  personalAddress: {
    region: [],
    municipalityCity: [],
    address: "",
  },
  legalAddress: {
    region: [],
    municipalityCity: [],
    address: "",
  },
  activities: [{
    code: "",
    name: ""
  }],
  ownershipForm: [],
  businessForm: "",
};

export function useSearchForm(isEnglish) {
  const [formData, setFormData] = useState(initialFormData);
  const [organizationalLegalFormOptions, setOrganizationalLegalFormOptions] = useState([]);
  const [regionOptions, setRegionOptions] = useState([]);
  const [personalMunicipalityOptions, setPersonalMunicipalityOptions] = useState([]);
  const [legalMunicipalityOptions, setLegalMunicipalityOptions] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [legalForms, regionsResponse] = await Promise.all([
          fetchLegalForms(isEnglish ? "en" : "ge"),
          fetch(
            `https://br-api.geostat.ge/api/locations/regions?lang=${
              isEnglish ? "en" : "ge"
            }`
          ),
        ]);

        const regions = await regionsResponse.json();
        const formattedRegions = regions.map((region) => ({
          value: region.Location_Code,
          label: `${region.Location_Code} - ${region.Location_Name}`,
          code: region.Location_Code,
          level: region.Level,
        }));

        setOrganizationalLegalFormOptions(legalForms);
        setRegionOptions(formattedRegions);
      } catch (error) {
        console.error("Error loading data:", error);
        setOrganizationalLegalFormOptions([]);
        setRegionOptions([]);
      }
    };

    loadData();
  }, [isEnglish]);
  const fetchMunicipalities = useCallback(async (regions, isLegal = false) => {
    try {
      const selectedRegions = regionOptions.filter((option) =>
        regions.includes(option.value)
      );

      const codes = [...new Set(selectedRegions.map(region => region.code.split(' ')[0]))];
      
      const municipalitiesPromises = codes.map(code =>
        fetch(`https://br-api.geostat.ge/api/locations/code/${code}?lang=${isEnglish ? "en" : "ge"}`)
          .then(res => res.json())
      );

      const municipalitiesResults = await Promise.all(municipalitiesPromises);
      
      const formattedMunicipalities = municipalitiesResults
        .flat()
        .map(municipality => ({
          value: municipality.Location_Code,  // Changed from ID to Location_Code
          label: `${municipality.Location_Code} - ${municipality.Location_Name}`,
          code: municipality.Location_Code
        }));

      return formattedMunicipalities;
    } catch (error) {
      console.error(`Error loading ${isLegal ? 'legal' : 'personal'} municipalities:`, error);
      return [];
    }
  }, [regionOptions, isEnglish]);

  useEffect(() => {
    if (formData.personalAddress.region.length > 0) {
      fetchMunicipalities(formData.personalAddress.region, false)
        .then(setPersonalMunicipalityOptions);
    } else {
      setPersonalMunicipalityOptions([]);
    }
  }, [formData.personalAddress.region, fetchMunicipalities]);

  useEffect(() => {
    if (formData.legalAddress.region.length > 0) {
      fetchMunicipalities(formData.legalAddress.region, true)
        .then(setLegalMunicipalityOptions);
    } else {
      setLegalMunicipalityOptions([]);
    }
  }, [formData.legalAddress.region, fetchMunicipalities]);

  const handleInputChange = (e, section = null, field = null) => {
    // Handle checkbox inputs separately
    if (e.target.type === 'checkbox') {
      const { name, checked } = e.target;
      return setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    }

    const { name, value } = e.target;

    if (section) {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (signal = null) => {
    try {
      const documents = await fetchDocuments(formData, isEnglish ? "en" : "ge", regionOptions, signal);
      // console.log("Search Results:", documents);
      return documents;
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw error; // Re-throw to allow parent component to handle abort errors
    }
  };

  const handleReset = () => {
    setFormData({
      ...initialFormData,
      activities: [{
        code: "",
        name: ""
      }]
    });
  };

  return {
    formData,
    setFormData,
    organizationalLegalFormOptions,
    regionOptions,
    personalMunicipalityOptions,
    legalMunicipalityOptions,
    handleInputChange,
    handleReset,
    handleSubmit
  };
}
