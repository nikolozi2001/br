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
    // First create the basic query params
    const queryParams = new URLSearchParams();
    queryParams.append('lang', lang);

    if (searchParams.identificationNumber) {
      queryParams.append('identificationNumber', searchParams.identificationNumber);
    }
    if (searchParams.organizationName) {
      queryParams.append('organizationName', searchParams.organizationName);
    }
    if (searchParams.organizationalLegalForm?.length > 0) {
      queryParams.append('legalForm', searchParams.organizationalLegalForm[0]);
    }
    if (searchParams.head) {
      queryParams.append('head', searchParams.head);
    }
    if (searchParams.partner) {
      queryParams.append('partner', searchParams.partner);
    }
    // Handle ownershipType
    if (searchParams.ownershipForm?.length > 0) {
      const ownershipId = parseInt(searchParams.ownershipForm[0].value, 10);
      if (!isNaN(ownershipId)) {
        queryParams.append('ownershipType', ownershipId);
      }
    }
    if (searchParams.isActive) {
      queryParams.append('isActive', searchParams.isActive);
    }
    // Handle size/business form
    if (searchParams.businessForm?.length > 0) {
      const size = searchParams.businessForm[0];
      // Ensure we're using the numeric ID value, not the label
      if (size && size.value) {
        const sizeId = parseInt(size.value, 10);
        if (!isNaN(sizeId)) {
          queryParams.append('size', sizeId);
        } else {
          console.warn('Invalid size ID:', size.value);
        }
      }
    }

    // Handle activities separately
    if (searchParams.activities && searchParams.activities.length > 0) {
      searchParams.activities.forEach(activity => {
        if (activity.code) {
          queryParams.append('activityCode', activity.code);
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/documents?${queryParams}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    console.log('Raw response data:', data);
    
    // Transform the response data
    return data.map(item => ({
      ...item,
      id: item.Stat_ID,
      identificationNumber: item.Legal_Code,
      personalNumber: item.Personal_no,
      name: item.Full_Name,
      abbreviation: item.Abbreviation,
      legalAddress: {
        region: item.Region_name,
        address: item.Address
      },
      factualAddress: {
        region: item.Region_name2,
        address: item.Address2
      },
      activities: [{
        code: item.Activity_2_Code,
        name: item.Activity_2_Name
      }],
      head: item.Head,
      phone: item.mob,
      partner: item.Partner,
      email: item.Email,
      ownershipType: item.Ownership_Type,
      isActive: item.ISActive === 1,
      businessForm: item.Zoma ? [{ value: item.Zoma.toString(), label: item.Zoma }] : []
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
