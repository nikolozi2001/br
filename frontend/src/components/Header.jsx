import React from "react";

const Header = () => {
  return (
    <div className="w-full bg-gradient-to-r from-white to-blue-50 py-4 px-6 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-6">
        {/* Logo */}
        <img
          src="/src/assets/images/sakstat-logo.svg"
          alt="საქსტატი ლოგო"
          className="h-14 w-auto"
        />

        {/* Titles */}
        <div className="leading-tight">          <h1 className="text-gray-800 text-[18px] font-bpg-nino font-medium">
            საქართველოს სტატისტიკის ეროვნული სამსახური
          </h1>{" "}
          <p className="text-[#0080be] text-[20px] font-bold font-bpg-nino text-center w-full">
            სტატისტიკური ბიზნეს რეესტრი
          </p>
        </div>
      </div>
    </div>
  );
};

export default Header;
