import React from "react";
import { useNavigate } from "react-router-dom";
import sakstatLogoGe from "/src/assets/images/sakstat-logo.svg";
import sakstatLogoEn from "/src/assets/images/sakstat-logo-en.png";

const Header = ({ isEnglish }) => {
  const navigate = useNavigate();

  const handleHeaderClick = () => {
    navigate("/");
  };

  const content = {
    georgian: {
      logo: {
        src: sakstatLogoGe,
        alt: "საქსტატი ლოგო",
      },
      title: "საქართველოს სტატისტიკის ეროვნული სამსახური",
      subtitle: "სტატისტიკური ბიზნეს რეგისტრი",
    },
    english: {
      logo: {
        src: sakstatLogoEn,
        alt: "Geostat Logo",
      },
      title: "National Statistics Office of Georgia",
      subtitle: "Statistical Business Register",
    },
  };

  const currentLanguage = isEnglish ? content.english : content.georgian;

  return (
    <div className="w-full from-white to-blue-50 py-4 px-3 sm:px-6">
      <div 
        onClick={handleHeaderClick}
        className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 cursor-pointer hover:opacity-90 transition-opacity"
      >
        {/* Logo */}
        {isEnglish ? (
          <img
            src={currentLanguage.logo.src}
            alt={currentLanguage.logo.alt}
            width="253"
            height="56"
            className="h-12 sm:h-14 w-auto"
            decoding="async"
          />
        ) : (
          <img
            src={currentLanguage.logo.src}
            alt={currentLanguage.logo.alt}
            width="160"
            height="56"
            className="h-12 sm:h-14 w-auto"
            decoding="async"
          />
        )}

        {/* Titles */}
        <div className="leading-tight text-center sm:text-left">
          <h1 className="text-gray-800 text-[16px] sm:text-[18px] font-bpg-nino font-bold">
            {currentLanguage.title}
          </h1>
          <p className="text-[#0080be] text-[18px] sm:text-[20px] font-bold font-bpg-nino text-center w-full">
            {currentLanguage.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Header;
