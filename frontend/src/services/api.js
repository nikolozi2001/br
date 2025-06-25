const API_BASE_URL = "http://localhost:5000/api";

// Legal Forms API
export const fetchLegalForms = async (lang) => {
  try {
    const response = await fetch(`${API_BASE_URL}/legal-forms?lang=${lang}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();

    // Check if data is in recordset format
    const forms = data.recordset || data;

    return forms
      .map((form) => ({
        value: form.ID?.toString() || form.id?.toString(),
        label:
          form.Name ||
          (form.Abbreviation
            ? `${form.Abbreviation} - ${form.Legal_Form}`
            : form.Legal_Form),
      }))
      .filter((item) => item.value && item.label); // Filter out any invalid items
  } catch (error) {
    console.error("Error fetching legal forms:", error);
    return [];
  }
};

// Locations API
export const fetchLocations = async (lang = "ge") => {
  try {
    const response = await fetch(`${API_BASE_URL}/locations?lang=${lang}`);
    const data = await response.json();
    // Group and transform locations into regions for the select component
    const regions = [
      ...new Set(data.map((location) => location.Location_Name)),
    ];
    return regions.map((region) => ({
      value: region,
      label: region,
    }));
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
};

// Activities API
export const fetchActivities = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/activities`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    
    const codesOnly = data.map((activity) => ({
      value: activity.Activity_Code,
      label: activity.Activity_Code
    }));

    const codesWithNames = data.map((activity) => ({
      value: activity.Activity_Code,
      label: `${activity.Activity_Code} - ${activity.Activity_Name}`
    }));
    
    return {
      codesOnly,
      codesWithNames
    };
  } catch (error) {
    console.error("Error fetching activities:", error);
    return { codesOnly: [], codesWithNames: [] };
  }
};

// You can add more API calls here as needed
export const API = {
  fetchLegalForms,
  fetchLocations,
  fetchActivities,
};

export default API;
