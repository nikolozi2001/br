import britishFlag from "/src/assets/images/british-flag.png";

function TopNavigation() {
  const handleLanguageSwitch = () => {
    // TODO: Implement language switching functionality
    console.log("Language switch clicked");
  };

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Left Side - Navigation Buttons */}
            <div
              className="flex flex-wrap justify-center sm:justify-start"
              role="group"
            >
              <button className="font-bpg-nino font-bold px-6 py-[6px] text-sm bg-white text-[#0080BE] border-t border-l border-[#0080BE] first:rounded-tl-lg hover:bg-gray-50 transition-colors relative after:absolute after:top-0 after:right-0 after:h-full after:bg-[#0080BE]">
                მთავარი
              </button>

              <button className="font-bpg-nino font-bold px-6 py-[6px] text-sm bg-[#0080BE] text-white border-t border-l border-r border-[#0080BE] hover:bg-[#fff] hover:text-[#0080BE] transition-colors relative after:absolute after:top-0 after:right-0 after:h-full after:bg-[#0080BE]">
                რეპორტები
              </button>

              <button className="font-bpg-nino font-bold px-6 py-[6px] text-sm bg-[#0080BE] text-white border-t border-l border-r border-[#0080BE] hover:bg-[#fff] hover:text-[#0080BE] transition-colors relative after:absolute after:top-0 after:right-0  after:h-full after:bg-[#0080BE]">
                გრაფიკები
              </button>
              <a
                href="http://gis.geostat.ge/geomap/index.html?open"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bpg-nino font-bold px-6 py-[6px] text-sm bg-[#0080BE] text-white border-[#0080BE] border-t border-l border-r last:rounded-tr-lg  hover:bg-[#fff] hover:text-[#0080BE] transition-colors text-center"
              >
                GIS ანალიზი
              </a>
            </div>

            {/* Right Side Group */}
            <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
              {/* Date */}
              <div className="text-sm text-gray-600 whitespace-nowrap">
                2025 წლის ივნისის მდგომარეობით
              </div>

              <div className="flex items-center gap-3">
                {/* Facebook Share */}
                <a
                  href="https://www.facebook.com/sharer/sharer.php?u=http://br.geostat.ge/register_geo/index.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0080BE] hover:text-[#0070aa] transition-colors p-1"
                >
                  <i className="fab fa-facebook text-xl"></i>
                </a>

                {/* Language Switch */}
                <button
                  className="flex items-center hover:opacity-80 transition-opacity"
                  onClick={handleLanguageSwitch}
                >
                  <span className="sr-only">Switch Language</span>
                  <img src={britishFlag} alt="English" className="w-6 h-auto" />
                </button>

                {/* Info Button */}
                <button
                  className="text-[#0080BE] hover:text-[#0070aa] transition-colors p-1"
                  data-toggle="modal"
                  data-target="#exampleModal"
                >
                  <i className="fas fa-info-circle text-xl"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TopNavigation;
