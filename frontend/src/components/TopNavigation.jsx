import { useState } from "react";
import britishFlag from "/src/assets/images/british-flag.png";
import georgianFlag from "/src/assets/images/georgian-flag.svg";

function TopNavigation({ isEnglish, onLanguageChange }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLanguageSwitch = () => {
    onLanguageChange(!isEnglish);
  };

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const content = {
    georgian: {
      navigation: {
        main: "მთავარი",
        reports: "რეპორტები",
        charts: "გრაფიკები",
        gis: "GIS ანალიზი",
      },
      date: "2025 წლის ივნისის მდგომარეობით",
      languageSwitch: "Switch to English",
      modal: {
        title: "ბიზნეს რეგისტრის შესახებ",
        closeButton: "დახურვა",
        paragraphs: [
          "სტატისტიკური ბიზნეს რეგისტრი დაარსდა 1995 წელს. იგი მოიცავს რეგლამენტირებულ ცნობებს ქვეყნის ტერიტორიაზე საზოგადოებრივი ან სამეწარმეო საქმიანობით დაკავებული ყველა იურიდიული და ფიზიკური პირის შესახებ.",
          "სტატისტიკური ბიზნეს რეგისტრის განახლება ხორციელდება ყოველთვიურად, ძირითადად, ადმინისტრაციული წყაროებიდან (საჯარო რეესტრის ეროვნული სააგენტო, შემოსავლების სამსახური) და სტატისტიკის ეროვნული სამსახურის მიერ ჩატარებული სხვადასხვა ბიზნეს გამოკვლევებიდან მიღებული ინფორმაციის საფუძველზე.",
          "მოცემული გვერდის პირველ ჩანართზე - მთავარი განთავსებული ფილტრაციის ველები საშუალებას იძლევა მოძიებულ იქნას ინფორმაცია საქართველოში რეგისტრირებული სუბიექტების შესახებ სხვადასხვა მახასიათებლის მიხედვით (ორგანიზაციულ-სამართლებრივი ფორმა, საკუთრების ფორმა, რეგიონი, მუნიციპალიტეტი, ეკონომიკური საქმიანობის სახე და სხვა).",
          "რეპორტების ნაწილში წარმოდგენილი ცხრილები ასახავს საქართველოში რეგისტრირებული და აქტიური საწარმოებისა და ორგანიზაციების განაწილებას სხვადასხვა მახასიათებლის მიხედვით.",
          "გრაფიკების ნაწილში წარმოდგენილია საწარმოთა დემოგრაფიული მაჩვენებლების - საწარმოთა დაბადება, გარდაცვალება, გადარჩენა - ამსახველი გრაფიკები, სხვადასხვა მახასიათებლის მიხედვით.",
          "GIS ანალიზის ნაწილი საშუალებას იძლევა ინტერაქტიულ რუკებზე, რომლებზეც დატანილია აქტიური კომპანიების გეოგრაფიული კოორდინატები, მოიძიებულ იქნას ბიზნეს სუბიექტები მათი ფაქტობრივი მისამართის მიხედვით.",
        ],
      },
    },
    english: {
      navigation: {
        main: "Main",
        reports: "Reports",
        charts: "Charts",
        gis: "GIS Analysis",
      },
      date: "By June Of 2025",
      languageSwitch: "გადართვა ქართულზე",
      modal: {
        title: "About Business Register",
        closeButton: "Close",
        paragraphs: [
          "The Statistical Business Register was established in 1995. It includes regulated information on all legal persons and individuals engaged in public or entrepreneurial activities in the country.",
          "The Statistical Business Register is updated monthly, mainly on the basis of information obtained from administrative sources (National Agency of Public Registry, Revenue Service) and various business surveys conducted by the National Statistics Office of Georgia (Geostat).",
          "On the first section of this page – Home filtered allow to find information about registered entities in Georgia according to various characteristics (by legal status, ownership type, region, municipality, kind of economic activity, etc.)",
          "The tables presented in the Reports section shows the distribution of registered and active enterprises in Georgia and organizations by different characteristics.",
          "The charts section shows the Demographic Indicators of Enterprises – (Enterprise birth, Enterprise death, Survival).",
          "GIS Analysis section, where the geographical coordinates of the active companies are indicated, allows to find the business entities, by their actual address on the interactive maps.",
        ],
      },
    },
  };

  const currentLanguage = isEnglish ? content.english : content.georgian;

  return (
    <>
      <div className="w-full">
        <div className="container mx-auto">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              {/* Left Side - Navigation Buttons */}
              <div
                className="flex flex-wrap justify-center sm:justify-start"
                role="group"
              >
                <button className="font-bpg-nino font-bold px-6 py-[6px] text-sm bg-white text-[#0080BE] border-t border-l border-[#0080BE] first:rounded-tl-lg hover:bg-gray-50 transition-colors relative after:absolute after:top-0 after:right-0 after:h-full after:bg-[#0080BE] cursor-pointer">
                  {currentLanguage.navigation.main}
                </button>

                <button className="font-bpg-nino font-bold px-6 py-[6px] text-sm bg-[#0080BE] text-white border-t border-l border-r border-[#0080BE] hover:bg-[#fff] hover:text-[#0080BE] transition-colors relative after:absolute after:top-0 after:right-0 after:h-full after:bg-[#0080BE] cursor-pointer">
                  {currentLanguage.navigation.reports}
                </button>

                <button className="font-bpg-nino font-bold px-6 py-[6px] text-sm bg-[#0080BE] text-white border-t border-l border-r border-[#0080BE] hover:bg-[#fff] hover:text-[#0080BE] transition-colors relative after:absolute after:top-0 after:right-0  after:h-full after:bg-[#0080BE] cursor-pointer">
                  {currentLanguage.navigation.charts}
                </button>
                <a
                  href="http://gis.geostat.ge/geomap/index.html?open"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bpg-nino font-bold px-6 py-[6px] text-sm bg-[#0080BE] text-white border-[#0080BE] border-t border-l border-r last:rounded-tr-lg  hover:bg-[#fff] hover:text-[#0080BE] transition-colors text-center"
                >
                  {currentLanguage.navigation.gis}
                </a>
              </div>

              {/* Right Side Group */}
              <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
                {/* Date */}
                <div className="text-sm text-gray-600 whitespace-nowrap font-bold">
                  {currentLanguage.date}
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
                    className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
                    onClick={handleLanguageSwitch}
                    title={currentLanguage.languageSwitch}
                  >
                    <span className="sr-only">{currentLanguage.languageSwitch}</span>
                    <img
                      src={isEnglish ? georgianFlag : britishFlag}
                      alt={isEnglish ? "Georgian" : "English"}
                      className="w-6 h-auto"
                    />
                  </button>

                  {/* Info Button */}
                  <button
                    className="text-[#0080BE] hover:text-[#0070aa] transition-colors p-1 cursor-pointer"
                    onClick={handleModalOpen}
                  >
                    <i className="fas fa-info-circle text-xl"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="relative w-full max-w-[800px] mx-4" role="dialog">
            <div className="bg-white rounded-lg shadow-xl">
              <div className="modal-header border-b p-4 flex justify-between items-center">
                <h5 className="modal-title font-bpg-nino text-xl">
                  {currentLanguage.modal.title}
                </h5>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                  onClick={handleModalClose}
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <div className="modal-body p-6 font-bpg-nino max-h-[70vh] overflow-y-auto">
                {currentLanguage.modal.paragraphs.map((paragraph, index) => (
                  <p key={index} className="mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="modal-footer border-t p-4 flex justify-end">
                <button
                  type="button"
                  className="font-bpg-nino bg-[#6c757d] hover:bg-[#5a6268] text-white px-4 py-2 rounded transition-colors"
                  onClick={handleModalClose}
                >
                  {currentLanguage.modal.closeButton}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TopNavigation;
