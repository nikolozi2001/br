const API_BASE_URL = "http://192.168.1.27:5000/api";

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
    // Remove duplicates and transform into select options
    const uniqueRegions = data.reduce((acc, location) => {
      if (!acc.some(r => r.Location_Code === location.Location_Code)) {
        acc.push(location);
      }
      return acc;
    }, []);

    return uniqueRegions.map((region) => ({
      value: region.ID,
      label: `${region.Location_Code} - ${region.Location_Name}`,
      code: region.Location_Code,
      level: region.Level,
    }));
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
};

// Activities API
export const fetchActivities = async (lang = "ge") => {
  try {
    const response = await fetch(`${API_BASE_URL}/activities?lang=${lang}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();

    const codesOnly = data.map((activity) => ({
      value: activity.Activity_Code,
      label: activity.Activity_Code,
    }));

    const codesWithNames = data.map((activity) => ({
      value: activity.Activity_Code,
      label: `${activity.Activity_Code} - ${activity.Activity_Name}`,
    }));

    return {
      codesOnly,
      codesWithNames,
    };
  } catch (error) {
    console.error("Error fetching activities:", error);
    return { codesOnly: [], codesWithNames: [] };
  }
};

// Ownership Types API
export const fetchOwnershipTypes = async (lang = "ge") => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/ownership-types?lang=${lang}`
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();

    // Check if data is in recordset format
    const types = data.recordset || data;

    return types.map((type) => ({
      value: type.ID?.toString(),
      label: type.Ownership_Type,
    }));
  } catch (error) {
    console.error("Error fetching ownership types:", error);
    return [];
  }
};

// Sizes API
export const fetchSizes = async (lang) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sizes?lang=${lang}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    
    const sizes = data.recordset || data;
    
    return sizes.map((size) => ({
      value: size.id.toString(),
      label: size.zoma
    }));
  } catch (error) {
    console.error("Error fetching sizes:", error);
    return [];
  }
};

// documents API
export const fetchDocuments = async (searchParams, lang = "ge",) => {
  try {
    const queryParams = new URLSearchParams({
      lang,
      ...(searchParams.identificationNumber && { identificationNumber: searchParams.identificationNumber }),
      ...(searchParams.organizationName && { organizationName: searchParams.organizationName }),
    });

    const response = await fetch(`${API_BASE_URL}/documents?${queryParams}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    console.log('Raw response data:', data);

    return data.map((doc) => ({
      id: doc.Stat_ID?.toString() || '',
      identificationNumber: doc.Legal_Code || '',
      personalNumber: doc.Personal_no || '',
      legalForm: doc.Legal_Form_ID || '',
      name: doc.Full_Name || '',
      abbreviation: doc.Abbreviation || '',
      head: doc.Head || '',
      partner: doc.Partner || '',
      email: doc.Email || '',
      phone: doc.mob || '',
      legalAddress: {
        region: doc.Region_name || '',
        municipalityCity: doc.City_name || '',
        address: doc.Address || ''
      },
      factualAddress: {
        region: doc.Region_name2 || '',
        municipalityCity: doc.City_name2 || '',
        address: doc.Address2 || ''
      },
      activities: [{
        code: doc.Activity_Code || '',
        name: doc.Activity_Name || ''
      }],
      ownershipType: doc.Ownership_Type || '',
      isActive: doc.ISActive || false,
      status: doc.ISActive ? 'Active' : 'Inactive',
      size: doc.Zoma || ''
    }));
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
};

// You can add more API calls here as needed
export const API = {
  fetchLegalForms,
  fetchLocations,
  fetchActivities,
  fetchOwnershipTypes,
  fetchSizes,
  fetchDocuments,
};

export default API;
