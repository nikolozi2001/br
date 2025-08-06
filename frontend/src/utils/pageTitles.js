// Translation keys for page titles
export const pageTitles = {
  home: {
    georgian: 'მთავარი',
    english: 'Home'
  },
  reports: {
    georgian: 'რეპორტები',
    english: 'Reports'
  },
  charts: {
    georgian: 'გრაფიკები',
    english: 'Charts'
  },
  searchHistory: {
    georgian: 'ძებნის ისტორია',
    english: 'Search History'
  },
  gisAnalysis: {
    georgian: 'GIS ანალიზი',
    english: 'GIS Analysis'
  }
};

// Helper function to get page title
export const getPageTitle = (pageKey, isEnglish) => {
  const page = pageTitles[pageKey];
  if (!page) return null;
  return isEnglish ? page.english : page.georgian;
};
