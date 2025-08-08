// Helper function to check if there are more legend pages
export const hasMoreLegendPages = (currentPage, itemsPerPage = 12, totalItems = 14) => {
  return (currentPage + 1) * itemsPerPage < totalItems;
};

// Helper function to get all data keys from data
export const getAllDataKeys = (data) => {
  if (!data || data.length === 0) return [];
  const sampleItem = data[0] || {};
  return Object.keys(sampleItem).filter((key) => key !== "year");
};

// Helper function to format large numbers
export const formatNumber = (value) => {
  // Handle null, undefined, or non-numeric values
  if (value == null || isNaN(value)) return "0";
  
  const num = Number(value);
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + "k";
  }
  return num.toString();
};

// Helper function to format numbers with locale formatting (for percentages and detailed numbers)
export const formatNumberWithLocale = (num, options = {}) => {
  if (num == null || isNaN(num)) return "0.0";
  
  const defaultOptions = {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  };
  
  return Number(num).toLocaleString("en-US", { ...defaultOptions, ...options });
};

// Helper function to get color for sections
export const getColorForSection = (sectionName) => {
  // Official section code to color mapping (matches API)
  const sectionCodeColors = {
    'A': '#f59e0b', // Agriculture, forestry and fishing (not in API, using fallback)
    'B': '#0080BE', // Mining and quarrying  
    'C': '#EA1E30', // Manufacturing
    'D': '#19C219', // Electricity, gas, steam and air conditioning supply
    'E': '#F2741F', // Water supply; sewerage, waste management and remediation
    'F': '#5B21A4', // Construction
    'G': '#F2CF1F', // Wholesale and retail trade; repair of motor vehicles
    'H': '#149983', // Transportation and storage
    'I': '#C21979', // Accommodation and food service activities
    'J': '#1B6D9A', // Information and communication
    'K': '#8FDE1D', // Financial and insurance activities
    'L': '#F2F21F', // Real estate activities
    'M': '#477054', // Professional, scientific and technical activities
    'N': '#b4b299', // Administrative and support service activities
    'O': '#64748b', // Public administration and defence (not in API, using fallback)
    'P': '#07f187', // Education
    'Q': '#af4fff', // Human health and social work activities
    'R': '#e4748b', // Arts, entertainment and recreation
    'S': '#61b562', // Other service activities
    'T': '#64748b', // Activities of households as employers (not in API, using fallback)
    'U': '#64748b', // Activities of extraterritorial organisations (not in API, using fallback)
    'unknown': '#000000'
  };

  // Simple English name to section code mapping
  const simpleNameToCode = {
    Manufacturing: "C",
    Construction: "F", 
    Retail: "G",
    Transport: "H",
    Finance: "K",
    Other: "S",
    Agriculture: "A",
    Mining: "B",
    Utilities: "D",
    Information: "J",
    Professional: "M",
    Education: "P",
    Health: "Q",
    Arts: "R",
  };

  // Georgian/English name to section code mapping
  const fullNameToCode = {
    // Georgian names
    "სამთომომპოვებელი მრე...": "B",
    "დამამუშავებელი მრეწვე...": "C", 
    "ელექტროენერგია მიწო...": "D",
    "წყალმომარაგება ნარჩე...": "E",
    "მშენებლობა": "F",
    "ვაჭრობა რემონტი": "G",
    "ტრანსპორტირება დასა...": "H",
    "განთავსება საკვები": "I",
    "ინფორმაცია კომუნიკ...": "J",
    "ფინანსური საქმიანო...": "K",
    "უძრავი ქონება": "L",
    "პროფესიული საქმია...": "M",
    "ადმინისტრაციული მომ...": "N",
    "განათლება": "P",
    "ჯანდაცვა სოციალუ...": "Q",
    "ხელოვნება გართობა": "R",
    "სხვა მომსახურება": "S",
    "უცნობი საქმიანობა": "unknown",
    
    // English names
    "Mining and Quarrying": "B",
    "Manufacturing": "C",
    "Electricity Supply": "D",
    "Water Supply Waste...": "E",
    "Construction": "F",
    "Trade Repair": "G",
    "Transportation Stor...": "H",
    "Accommodation Food...": "I",
    "Information Comm...": "J",
    "Financial Activities": "K",
    "Real Estate Activities": "L",
    "Professional Activ...": "M",
    "Administrative Sup...": "N",
    "Education": "P",
    "Health Social Work": "Q",
    "Arts Entertainment": "R",
    "Other Services": "S",
    "Unknown Activity": "unknown",
  };

  // First check if it's a section code
  if (sectionCodeColors[sectionName]) {
    return sectionCodeColors[sectionName];
  }

  // Then check full name mapping
  const fullNameCode = fullNameToCode[sectionName];
  if (fullNameCode && sectionCodeColors[fullNameCode]) {
    return sectionCodeColors[fullNameCode];
  }

  // Then check simple name mapping
  const simpleCode = simpleNameToCode[sectionName];
  if (simpleCode && sectionCodeColors[simpleCode]) {
    return sectionCodeColors[simpleCode];
  }

  // Default color
  return "#64748b";
};


