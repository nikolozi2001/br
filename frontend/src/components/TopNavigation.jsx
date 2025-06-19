import britishFlag from "/src/assets/images/british-flag.png";

function TopNavigation() {
  const handleLanguageSwitch = () => {
    // TODO: Implement language switching functionality
    console.log("Language switch clicked");
  };

  return (
    <div className="w-full bg-white shadow-sm">
      <div className="container mx-auto">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Left Side - Navigation Buttons */}
            <div
              className="flex flex-wrap gap-2 justify-center sm:justify-start"
              role="group"
            >
              <button className="min-w-[100px] px-4 py-2 text-sm bg-white text-[#0080BE] border border-[#0080BE] rounded hover:bg-gray-50 transition-colors">
                მთავარი
              </button>
              <button className="min-w-[100px] px-4 py-2 text-sm bg-[#0080BE] text-white border border-[#0080BE] rounded hover:bg-[#0070aa] transition-colors">
                რეპორტები
              </button>
              <button className="min-w-[100px] px-4 py-2 text-sm bg-[#0080BE] text-white border border-[#0080BE] rounded hover:bg-[#0070aa] transition-colors">
                გრაფიკები
              </button>
              <a
                href="http://gis.geostat.ge/geomap/index.html?open"
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[100px] px-4 py-2 text-sm bg-[#0080BE] text-white border border-[#0080BE] rounded hover:bg-[#0070aa] transition-colors text-center"
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
