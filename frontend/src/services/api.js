const API_BASE_URL = "http://192.168.1.27:5000/api";

// Generic API utility functions for reports
const handleReportApiResponse = async (response) => {
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data = await response.json();
  return data.recordset || data;
};

const createReportApiCall = (reportNumber) => {
  return async (lang = "ge") => {
    try {
      const response = await fetch(`${API_BASE_URL}/report${reportNumber}?lang=${lang}`);
      return await handleReportApiResponse(response);
    } catch (error) {
      console.error(`Error fetching report ${reportNumber} data:`, error);
      return [];
    }
  };
};

// Report API endpoints configuration
const REPORT_ENDPOINTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Generate all report functions dynamically
const createReportFunctions = () => {
  const reportFunctions = {};
  
  REPORT_ENDPOINTS.forEach(reportNum => {
    reportFunctions[`fetchReport${reportNum}Data`] = createReportApiCall(reportNum);
  });
  
  return reportFunctions;
};

// Auto-generated report functions
const reportFunctions = createReportFunctions();

// Export individual report functions for backward compatibility
export const fetchReport1Data = reportFunctions.fetchReport1Data;
export const fetchReport2Data = reportFunctions.fetchReport2Data;
export const fetchReport3Data = reportFunctions.fetchReport3Data;
export const fetchReport4Data = reportFunctions.fetchReport4Data;
export const fetchReport5Data = reportFunctions.fetchReport5Data;
export const fetchReport6Data = reportFunctions.fetchReport6Data;
export const fetchReport7Data = reportFunctions.fetchReport7Data;
export const fetchReport8Data = reportFunctions.fetchReport8Data;
export const fetchReport9Data = reportFunctions.fetchReport9Data;
export const fetchReport10Data = reportFunctions.fetchReport10Data;

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
      label: size.zoma,
    }));
  } catch (error) {
    console.error("Error fetching sizes:", error);
    return [];
  }
};

// documents API
export const fetchDocuments = async (searchParams, lang = "ge") => {
  try {
    // First create the basic query params
    const queryParams = new URLSearchParams();
    queryParams.append("lang", lang);

    if (searchParams.identificationNumber) {
      queryParams.append(
        "identificationNumber",
        searchParams.identificationNumber
      );
    }
    if (searchParams.organizationName) {
      queryParams.append("organizationName", searchParams.organizationName);
    }
    if (searchParams.organizationalLegalForm?.length > 0) {
      queryParams.append("legalForm", searchParams.organizationalLegalForm[0]);
    }
    if (searchParams.head) {
      queryParams.append("head", searchParams.head);
    }
    if (searchParams.partner) {
      queryParams.append("partner", searchParams.partner);
    }
    // Handle ownershipType
    if (searchParams.ownershipForm?.length > 0) {
      const ownershipId = parseInt(searchParams.ownershipForm[0].value, 10);
      if (!isNaN(ownershipId)) {
        queryParams.append("ownershipType", ownershipId);
      }
    }
    if (searchParams.isActive) {
      queryParams.append("isActive", searchParams.isActive);
    }
    // Handle size/business form
    if (searchParams.businessForm?.length > 0) {
      const size = searchParams.businessForm[0];
      // Ensure we're using the numeric ID value, not the label
      if (size && size.value) {
        const sizeId = parseInt(size.value, 10);
        if (!isNaN(sizeId)) {
          queryParams.append("size", sizeId);
        } else {
          console.warn("Invalid size ID:", size.value);
        }
      }
    }

    // Handle activities separately
    if (searchParams.activities && searchParams.activities.length > 0) {
      searchParams.activities.forEach((activity) => {
        if (activity.code) {
          queryParams.append("activityCode", activity.code);
        }
      });
    }

    // console.log("Search Params:", searchParams);

    // Handle legalAddress region
    if (searchParams.legalAddress?.region?.length > 0) {
      const regionValue = searchParams.legalAddress.region[0];
      queryParams.append("legalAddressRegion", regionValue);
    }

    // Handle legalAddress municipalityCity
    if (searchParams.legalAddress?.municipalityCity?.length > 0) {
      const cityValue = searchParams.legalAddress.municipalityCity[0];
      queryParams.append("legalAddressCity", cityValue);
    }

    // Handle legalAddress address
    if (searchParams.legalAddress?.address) {
      queryParams.append("legalAddress", searchParams.legalAddress.address);
    }

    // Handle factualAddress region
    if (searchParams.personalAddress?.region?.length > 0) {
      const regionValue = searchParams.personalAddress.region[0];
      queryParams.append("factualAddressRegion", regionValue);
    }

    // Handle factualAddress municipalityCity
    if (searchParams.personalAddress?.municipalityCity?.length > 0) {
      const cityValue = searchParams.personalAddress.municipalityCity[0];
      queryParams.append("factualAddressCity", cityValue);
    }

    // Handle factualAddress address
    if (searchParams.personalAddress?.address) {
      queryParams.append(
        "factualAddress",
        searchParams.personalAddress.address
      );
    }

    // Log the final URL and parameters
    const finalUrl = `${API_BASE_URL}/documents?${queryParams}`;
    // console.log("Final request URL:", finalUrl);

    const response = await fetch(finalUrl);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    // console.log('Raw response data:', data);

    // Transform the response data
    return data.map((item) => ({
      ...item,
      id: item.Stat_ID,
      identificationNumber: item.Legal_Code,
      personalNumber: item.Personal_no,
      name: item.Full_Name,
      abbreviation: item.Abbreviation,
      legalAddress: {
        region: item.Region_name,
        address: item.Address,
      },
      factualAddress: {
        region: item.Region_name2,
        address: item.Address2,
      },
      activities: [
        {
          code: item.Activity_2_Code,
          name: item.Activity_2_Name,
        },
      ],
      head: item.Head,
      phone: item.mob,
      partner: item.Partner,
      email: item.Email,
      ownershipType: item.Ownership_Type,
      isActive: item.ISActive === 1,
      businessForm: item.Zoma
        ? [{ value: item.Zoma.toString(), label: item.Zoma }]
        : [],
    }));
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
};

// Enterprise Birth-Death API
export const fetchEnterpriseBirthDeath = async (lang = "ge") => {
  try {
    const response = await fetch(`${API_BASE_URL}/enterprise-birth-death?lang=${lang}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();

    // Transform the API response to the format needed by the chart
    const birthData = data.find(item => item.hints === "birth");
    const deathData = data.find(item => item.hints === "death");

    if (!birthData || !deathData) {
      throw new Error("Invalid API response format");
    }

    // Convert to chart format
    const years = Object.keys(birthData).filter(key => key !== "hints");
    return years.map(year => ({
      year,
      birth: birthData[year],
      death: deathData[year]
    }));
  } catch (error) {
    console.error("Error fetching enterprise birth-death data:", error);
    return [];
  }
};

// Enterprise NACE API
export const fetchEnterpriseNace = async (lang = "ge") => {
  try {
    const response = await fetch(`${API_BASE_URL}/enterprise-nace?lang=${lang}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();

    // Keep all data, including unknown activities (null section_division)
    const filteredData = data;

    // Define the exact order from Highcharts legend, including unknown activities
    const sectionOrder = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'unknown'];
    
    // Transform the API response to the format needed by the chart
    const years = ["2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"];
    
    return years.map(year => {
      const yearData = { year };
      
      // Process sections in the exact order from legend
      sectionOrder.forEach(sectionCode => {
        const item = filteredData.find(dataItem => 
          sectionCode === 'unknown' 
            ? dataItem.section_division === null 
            : dataItem.section_division === sectionCode
        );
        if (item) {
          const activityName = getSectionName(sectionCode, lang);
          yearData[activityName] = item[year] || 0;
        }
      });
      
      return yearData;
    });
  } catch (error) {
    console.error("Error fetching enterprise NACE data:", error);
    return [];
  }
};

// Enterprise Death NACE API
export const fetchEnterpriseDeathNace = async (lang = "ge") => {
  try {
    const response = await fetch(`${API_BASE_URL}/enterprise-death-nace?lang=${lang}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();

    // Keep all data, including unknown activities (null section_division)
    const filteredData = data;

    // Define the exact order from Highcharts legend, including unknown activities
    const sectionOrder = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'unknown'];
    
    // Transform the API response to the format needed by the chart
    const years = ["2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"];
    
    return years.map(year => {
      const yearData = { year };
      
      // Process sections in the exact order from legend
      sectionOrder.forEach(sectionCode => {
        const item = filteredData.find(dataItem => 
          sectionCode === 'unknown' 
            ? dataItem.section_division === null 
            : dataItem.section_division === sectionCode
        );
        if (item) {
          const activityName = getSectionName(sectionCode, lang);
          yearData[activityName] = item[year] || 0;
        }
      });
      
      return yearData;
    });
  } catch (error) {
    console.error("Error fetching enterprise death NACE data:", error);
    return [];
  }
};

// Helper function to convert NACE section codes to readable names
// Using exact order and names from Highcharts legend
const getSectionName = (sectionCode, lang = "ge") => {
  const sectionNames = {
    ge: {
      'B': 'სამთომომპოვებელი მრე...',
      'C': 'დამამუშავებელი მრეწვე...',
      'D': 'ელექტროენერგია მიწო...',
      'E': 'წყალმომარაგება ნარჩე...',
      'F': 'მშენებლობა',
      'G': 'ვაჭრობა რემონტი',
      'H': 'ტრანსპორტირება დასა...',
      'I': 'განთავსება საკვები',
      'J': 'ინფორმაცია კომუნიკ...',
      'K': 'ფინანსური საქმიანო...',
      'L': 'უძრავი ქონება',
      'M': 'პროფესიული საქმია...',
      'N': 'ადმინისტრაციული მომ...',
      'P': 'განათლება',
      'Q': 'ჯანდაცვა სოციალუ...',
      'R': 'ხელოვნება გართობა',
      'S': 'სხვა მომსახურება',
      'unknown': 'უცნობი საქმიანობა'
    },
    en: {
      'B': 'Mining and Quarrying',
      'C': 'Manufacturing',
      'D': 'Electricity Supply',
      'E': 'Water Supply Waste...',
      'F': 'Construction',
      'G': 'Trade Repair',
      'H': 'Transportation Stor...',
      'I': 'Accommodation Food...',
      'J': 'Information Comm...',
      'K': 'Financial Activities',
      'L': 'Real Estate Activities',
      'M': 'Professional Activ...',
      'N': 'Administrative Sup...',
      'P': 'Education',
      'Q': 'Health Social Work',
      'R': 'Arts Entertainment',
      'S': 'Other Services',
      'unknown': 'Unknown Activity'
    }
  };

  return sectionNames[lang][sectionCode] || sectionNames[lang]['unknown'];
};

// Color mapping to match exact Highcharts legend order
export const getSectionColorMapping = () => {
  return [
    { section: 'B', color: '#0080BE' },
    { section: 'C', color: '#EA1E30' },
    { section: 'D', color: '#19C219' },
    { section: 'E', color: '#F2741F' },
    { section: 'F', color: '#5B21A4' },
    { section: 'G', color: '#F2CF1F' },
    { section: 'H', color: '#149983' },
    { section: 'I', color: '#C21979' },
    { section: 'J', color: '#1B6D9A' },
    { section: 'K', color: '#8FDE1D' },
    { section: 'L', color: '#F2F21F' },
    { section: 'M', color: '#477054' },
    { section: 'N', color: '#b4b299' },
    { section: 'P', color: '#07f187' },
    { section: 'Q', color: '#af4fff' },
    { section: 'R', color: '#e4748b' },
    { section: 'S', color: '#61b562' },
    { section: 'unknown', color: '#000000' }
  ];
};

// Fetch Enterprise Birth by Regions
export const fetchEnterpriseBirthRegion = async (lang = 'ge') => {
  try {
    const response = await fetch(`${API_BASE_URL}/enterprise-birth-region?lang=${lang}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    const rawData = data.recordset || data;
    
    // Filter out "Unknown" region data
    return rawData.map(item => {
      const filteredItem = { ...item };
      delete filteredItem.Unknown;
      return filteredItem;
    });
  } catch (error) {
    console.error("Error fetching enterprise birth region data:", error);
    return [];
  }
};

// Fetch Enterprise Death by Regions
export const fetchEnterpriseDeathRegion = async (lang = 'ge') => {
  try {
    const response = await fetch(`${API_BASE_URL}/enterprise-death-region?lang=${lang}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    const rawData = data.recordset || data;
    
    // Filter out "Unknown" region data
    return rawData.map(item => {
      const filteredItem = { ...item };
      delete filteredItem.Unknown;
      return filteredItem;
    });
  } catch (error) {
    console.error("Error fetching enterprise death region data:", error);
    return [];
  }
};

// Fetch Enterprise Birth by Sectors
export const fetchEnterpriseBirthSector = async (lang = 'ge') => {
  try {
    const response = await fetch(`${API_BASE_URL}/enterprise-birth-sector?lang=${lang}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    const rawData = data.recordset || data;
    
    // Filter out the "სულ" (Total) row
    const filteredData = rawData.filter(item => item.legend_title !== "სულ");
    
    // Transform the API response to the format needed by the chart
    const years = ["2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"];
    
    return years.map(year => {
      const yearData = { year };
      
      // Process each sector
      filteredData.forEach(item => {
        const sectorName = item.legend_title;
        yearData[sectorName] = item[year] || 0;
      });
      
      return yearData;
    });
  } catch (error) {
    console.error("Error fetching enterprise birth sector data:", error);
    return [];
  }
};

// Fetch Enterprise Death by Sectors
export const fetchEnterpriseDeathSector = async (lang = 'ge') => {
  try {
    const response = await fetch(`${API_BASE_URL}/enterprise-death-sector?lang=${lang}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    const rawData = data.recordset || data;
    
    // Filter out the "სულ" (Total) row
    const filteredData = rawData.filter(item => item.legend_title !== "სულ");
    
    // Transform the API response to the format needed by the chart
    const years = ["2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"];
    
    return years.map(year => {
      const yearData = { year };
      
      // Process each sector
      filteredData.forEach(item => {
        const sectorName = item.legend_title;
        yearData[sectorName] = item[year] || 0;
      });
      
      return yearData;
    });
  } catch (error) {
    console.error("Error fetching enterprise death sector data:", error);
    return [];
  }
};

// Enterprise Survival Year API
export const fetchEnterpriseSurvivalYear = async (lang = 'ge') => {
  try {
    const response = await fetch(`${API_BASE_URL}/enterprise-survival-year?lang=${lang}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    
    // Check if data is in recordset format
    const results = data.recordset || data;
    
    if (!results || results.length === 0) {
      return [];
    }
    
    // Transform the data structure from "Born_in_YYYY" to "survival_X" format
    return results.map(item => {
      const transformedItem = { year: item.year };
      
      // Get all Born_in_YYYY keys and transform them
      Object.keys(item).forEach(key => {
        if (key.startsWith('Born_in_')) {
          const birthYear = parseInt(key.split('_')[2]);
          const currentYear = item.year;
          const survivalYears = currentYear - birthYear;
          
          // Only include non-zero values and positive survival years
          if (item[key] > 0 && survivalYears > 0) {
            transformedItem[`Born_in_${birthYear}`] = item[key];
          }
        }
      });
      
      return transformedItem;
    }).filter(item => {
      // Filter out items that have no survival data (only year property)
      return Object.keys(item).length > 1;
    });
  } catch (error) {
    console.error("Error fetching enterprise survival year data:", error);
    return [];
  }
};

// You can add more API calls here as needed
export const API = {
  fetchLegalForms,
  fetchActivities,
  fetchOwnershipTypes,
  fetchSizes,
  fetchDocuments,
  fetchReport1Data,
  fetchReport2Data,
  fetchReport3Data,
  fetchReport4Data,
  fetchReport5Data,
  fetchReport6Data,
  fetchReport7Data,
  fetchReport8Data,
  fetchReport9Data,
  fetchReport10Data,
  fetchEnterpriseBirthDeath,
  fetchEnterpriseNace,
  fetchEnterpriseDeathNace,
  fetchEnterpriseBirthRegion,
  fetchEnterpriseDeathRegion,
  fetchEnterpriseBirthSector,
  fetchEnterpriseDeathSector,
  fetchEnterpriseSurvivalYear,
};

export default API;
