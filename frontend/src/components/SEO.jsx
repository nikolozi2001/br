import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  image, 
  isEnglish = false,
  type = 'website',
  structuredData
}) => {
  const location = useLocation();
  const currentUrl = `${window.location.origin}${location.pathname}`;
  
  // Default values
  const defaultValues = {
    title: {
      en: 'Business Register - Statistical Business Registry of Georgia',
      ka: 'ბიზნეს რეგისტრი - საქართველოს სტატისტიკური ბიზნეს რეგისტრი'
    },
    description: {
      en: 'Official Statistical Business Register of Georgia. Search and analyze economic entities, view reports and statistics about Georgian businesses.',
      ka: 'საქართველოს ოფიციალური სტატისტიკური ბიზნეს რეგისტრი. მოძებნეთ და გაანალიზეთ ეკონომიკური სუბიექტები, იხილეთ ანგარიშები და სტატისტიკა ქართული ბიზნესების შესახებ.'
    },
    keywords: {
      en: 'business register, georgia business, statistical register, economic entities, business statistics, georgian companies, business search, enterprise data',
      ka: 'ბიზნეს რეგისტრი, საქართველოს ბიზნესი, სტატისტიკური რეგისტრი, ეკონომიკური სუბიექტები, ბიზნეს სტატისტიკა, ქართული კომპანიები, ბიზნეს ძებნა, საწარმოო მონაცემები'
    }
  };

  const currentTitle = title || (isEnglish ? defaultValues.title.en : defaultValues.title.ka);
  const currentDescription = description || (isEnglish ? defaultValues.description.en : defaultValues.description.ka);
  const currentKeywords = keywords || (isEnglish ? defaultValues.keywords.en : defaultValues.keywords.ka);
  const currentImage = image || '/images/favicon.ico';
  const currentLang = isEnglish ? 'en' : 'ka';

  // Default structured data for Organization
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    "name": isEnglish ? "Statistical Business Register of Georgia" : "საქართველოს სტატისტიკური ბიზნეს რეგისტრი",
    "description": currentDescription,
    "url": currentUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${window.location.origin}/images/favicon.ico`
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["Georgian", "English"]
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "GE",
      "addressLocality": "Tbilisi"
    },
    "sameAs": [
      window.location.origin
    ]
  };

  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{currentTitle}</title>
      <meta name="description" content={currentDescription} />
      <meta name="keywords" content={currentKeywords} />
      <meta name="author" content="National Statistics Office of Georgia" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content={currentLang} />
      <html lang={currentLang} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={currentTitle} />
      <meta property="og:description" content={currentDescription} />
      <meta property="og:image" content={currentImage} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content={isEnglish ? "Business Register" : "ბიზნეს რეგისტრი"} />
      <meta property="og:locale" content={isEnglish ? "en_US" : "ka_GE"} />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={currentTitle} />
      <meta name="twitter:description" content={currentDescription} />
      <meta name="twitter:image" content={currentImage} />
      <meta name="twitter:url" content={currentUrl} />
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#2563eb" />
      <meta name="msapplication-TileColor" content="#2563eb" />
      <meta name="application-name" content={isEnglish ? "Business Register" : "ბიზნეს რეგისტრი"} />
      
      {/* Geo Tags for Georgia */}
      <meta name="geo.region" content="GE" />
      <meta name="geo.placename" content="Georgia" />
      <meta name="geo.position" content="41.7151;44.8271" />
      <meta name="ICBM" content="41.7151, 44.8271" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
    </Helmet>
  );
};

export default SEO;