import { useEffect } from 'react';

const useDocumentTitle = (isEnglish, pageTitle = null) => {
  useEffect(() => {
    const baseTitle = {
      english: 'Business Register',
      georgian: 'ბიზნეს რეგისტრი'
    };
    
    const descriptions = {
      english: 'Statistical Business Register - Search and analyze economic entities in Georgia',
      georgian: 'სტატისტიკური ბიზნეს რეგისტრი - საქართველოში ეკონომიკური სუბიექტების ძებნა და ანალიზი'
    };
    
    const currentBase = isEnglish ? baseTitle.english : baseTitle.georgian;
    const currentDescription = isEnglish ? descriptions.english : descriptions.georgian;
    
    // If a specific page title is provided, append it to the base title
    const fullTitle = pageTitle 
      ? `${pageTitle} - ${currentBase}` 
      : currentBase;
    
    document.title = fullTitle;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = currentDescription;
    
    // Update the html lang attribute for accessibility
    document.documentElement.lang = isEnglish ? 'en' : 'ka';
  }, [isEnglish, pageTitle]);
};

export default useDocumentTitle;
