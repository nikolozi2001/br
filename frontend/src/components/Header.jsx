import React from 'react';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img 
              src="/src/assets/images/sakstat-logo.svg" 
              alt="Logo" 
              className="h-12 w-auto"
            />
            <h1 className="text-lg font-medium text-gray-800">
              საქართველოს სტატისტიკის ეროვნული სააგენტური
            </h1>
          </div>
          <nav className="hidden md:block">
            <ul className="flex items-center gap-8">
              <li>
                <a 
                  href="/" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-300"
                >
                  მთავარი
                </a>
              </li>
              <li>
                <a 
                  href="/statistics" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-300"
                >
                  სტატისტიკა
                </a>
              </li>
              <li>
                <a 
                  href="/about" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-300"
                >
                  ჩვენს შესახებ
                </a>
              </li>
              <li>
                <a 
                  href="/contact" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-300"
                >
                  კონტაქტი
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
