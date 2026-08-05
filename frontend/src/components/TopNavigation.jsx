import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Facebook, Info } from "lucide-react";
import britishFlag from "/src/assets/images/british-flag.png";
import georgianFlag from "/src/assets/images/georgian-flag.svg";
import appQrCode from "/src/assets/images/app-download-qr.svg";
import StoreBadge from "./common/StoreBadge";

function TopNavigation({ isEnglish, onLanguageChange }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const location = useLocation();

  // Get current date information
  const getCurrentMonthName = () => {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    // If day is 8 or later, show current month; if less than 8, show previous month
    const displayMonth =
      currentDay >= 8 ? currentMonth : (currentMonth - 1 + 12) % 12;
    const displayYear =
      currentDay >= 8
        ? currentYear
        : currentMonth === 0
          ? currentYear - 1
          : currentYear;

    const georgianMonths = [
      "იანვრის",
      "თებერვლის",
      "მარტის",
      "აპრილის",
      "მაისის",
      "ივნისის",
      "ივლისის",
      "აგვისტოს",
      "სექტემბრის",
      "ოქტომბრის",
      "ნოემბრის",
      "დეკემბრის",
    ];

    const englishMonths = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return {
      georgian: `${displayYear} წლის ${georgianMonths[displayMonth]} მდგომარეობით`,
      english: `By ${englishMonths[displayMonth]} Of ${displayYear}`,
    };
  };

  // Add ESC key handler
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key !== "Escape") return;
      if (isQrOpen) setIsQrOpen(false);
      else if (isModalOpen) handleModalClose();
    };

    if (isModalOpen || isQrOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    // Cleanup listener
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isModalOpen, isQrOpen]);

  const handleLanguageSwitch = () => {
    onLanguageChange(!isEnglish);
  };

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleQrOpen = () => {
    setIsQrOpen(true);
  };

  const handleQrClose = () => {
    setIsQrOpen(false);
  };

  const dynamicDate = getCurrentMonthName();

  const content = {
    georgian: {
      navigation: {
        main: "მთავარი",
        reports: "რეპორტები",
        charts: "გრაფიკები",
        gis: "GIS ანალიზი",
      },
      date: dynamicDate.georgian,
      languageSwitch: "Switch to English",
      qr: {
        title: "მობილური აპლიკაციის გადმოწერა",
        hint: "დაასკანერეთ QR კოდი ტელეფონით — თქვენი მოწყობილობის შესაბამის პლატფორმაზე გადაგამისამართებთ.",
      },
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
      date: dynamicDate.english,
      languageSwitch: "გადართვა ქართულზე",
      qr: {
        title: "Download the mobile app",
        hint: "Scan the QR code with your phone — it will take you to the store matching your device.",
      },
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
                className="flex flex-wrap lg:flex-nowrap shrink-0 justify-center sm:justify-start sm:self-end"
                role="group"
              >
                <Link
                  to="/"
                  className={`font-bpg-nino font-bold px-6 py-[6px] text-sm ${
                    location.pathname === "/"
                      ? "bg-white text-[#0070aa]"
                      : "bg-[#0070aa] text-white hover:bg-[#fff] hover:text-[#0070aa]"
                  } border-t border-l border-[#0070aa] first:rounded-tl-lg transition-colors relative after:absolute after:top-0 after:right-0 after:h-full after:bg-[#0070aa] cursor-pointer`}
                >
                  {currentLanguage.navigation.main}
                </Link>

                <Link
                  to="/reports"
                  className={`font-bpg-nino font-bold px-6 py-[6px] text-sm ${
                    location.pathname === "/reports"
                      ? "bg-white text-[#0070aa]"
                      : "bg-[#0070aa] text-white hover:bg-[#fff] hover:text-[#0070aa]"
                  } border-t border-l border-r border-[#0070aa] transition-colors relative after:absolute after:top-0 after:right-0 after:h-full after:bg-[#0070aa] cursor-pointer`}
                >
                  {currentLanguage.navigation.reports}
                </Link>

                <Link
                  to="/charts"
                  className={`font-bpg-nino font-bold px-6 py-[6px] text-sm ${
                    location.pathname === "/charts"
                      ? "bg-white text-[#0070aa]"
                      : "bg-[#0070aa] text-white hover:bg-[#fff] hover:text-[#0070aa]"
                  } border-t border-l border-r border-[#0070aa] transition-colors relative after:absolute after:top-0 after:right-0 after:h-full after:bg-[#0070aa] cursor-pointer`}
                >
                  {currentLanguage.navigation.charts}
                </Link>

                <a
                  href={`https://gis.geostat.ge/${isEnglish ? "en" : "ge"}/business-statistics`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bpg-nino font-bold px-6 py-[6px] text-sm bg-[#0070aa] text-white border-[#0070aa] border-t border-l border-r last:rounded-tr-lg  hover:bg-[#fff] hover:text-[#0070aa] transition-colors text-center"
                >
                  {currentLanguage.navigation.gis}
                </a>
              </div>

              {/* Center - mobile app download: Play badge | QR | App Store badge */}
              <div className="flex items-center gap-2 shrink-0">
                <StoreBadge store="play" isEnglish={isEnglish} size="compact" />

                <button
                  onClick={handleQrOpen}
                  className="hidden xl:block bg-white p-0.5 rounded border border-gray-300 hover:border-[#0070aa] transition-colors cursor-pointer shrink-0"
                  aria-label={
                    isEnglish
                      ? "Show QR code to download the app"
                      : "აპლიკაციის გადმოსაწერი QR კოდის ჩვენება"
                  }
                  title={
                    isEnglish
                      ? "Scan to download the app"
                      : "დაასკანერეთ აპლიკაციის გადმოსაწერად"
                  }
                >
                  <img
                    src={appQrCode}
                    alt=""
                    width="32"
                    height="32"
                    className="w-8 h-8 block"
                    aria-hidden="true"
                  />
                </button>

                <StoreBadge store="ios" isEnglish={isEnglish} size="compact" />
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
                    className="text-[#0070aa] hover:text-[#005580] transition-colors p-1"
                    aria-label={
                      isEnglish ? "Share on Facebook" : "გაზიარება Facebook-ზე"
                    }
                  >
                    <Facebook className="w-5 h-5" aria-hidden="true" />
                  </a>

                  {/* Language Switch */}
                  <button
                    className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
                    onClick={handleLanguageSwitch}
                    title={currentLanguage.languageSwitch}
                  >
                    <span className="sr-only">
                      {currentLanguage.languageSwitch}
                    </span>
                    <img
                      src={isEnglish ? georgianFlag : britishFlag}
                      alt={isEnglish ? "Georgian" : "English"}
                      width="24"
                      height="16"
                      className="w-6 h-auto"
                      decoding="async"
                    />
                  </button>

                  {/* Info Button */}
                  <button
                    className="text-[#0070aa] hover:text-[#005580] transition-colors p-1 cursor-pointer"
                    onClick={handleModalOpen}
                    aria-label={
                      isEnglish
                        ? "About Business Register"
                        : "ბიზნეს რეგისტრის შესახებ"
                    }
                  >
                    <Info className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR code modal - enlarged for reliable scanning */}
      {isQrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={handleQrClose}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-[380px] mx-4 z-10"
            role="dialog"
            aria-modal="true"
            aria-label={currentLanguage.qr.title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-lg shadow-xl">
              <div className="border-b p-4 flex justify-between items-center">
                <h5 className="font-bpg-nino text-lg">
                  {currentLanguage.qr.title}
                </h5>
                <button
                  type="button"
                  className="text-gray-600 hover:text-gray-800 transition-colors text-2xl leading-none pb-1 cursor-pointer"
                  onClick={handleQrClose}
                  aria-label={isEnglish ? "Close" : "დახურვა"}
                >
                  &times;
                </button>
              </div>
              <div className="p-6 font-bpg-nino flex flex-col items-center">
                <img
                  src={appQrCode}
                  alt={currentLanguage.qr.title}
                  width="240"
                  height="240"
                  className="w-[240px] h-[240px]"
                />
                <p className="text-sm text-gray-600 mt-4 text-center">
                  {currentLanguage.qr.hint}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                  <StoreBadge store="play" isEnglish={isEnglish} />
                  <StoreBadge store="ios" isEnglish={isEnglish} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop - Click to close */}
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={handleModalClose}
            aria-hidden="true"
          />

          {/* Modal content - Prevent click propagation */}
          <div
            className="relative w-full max-w-[800px] mx-4 z-10"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-lg shadow-xl">
              <div className="modal-header border-b p-4 flex justify-between items-center">
                <h5 className="modal-title font-bpg-nino text-xl">
                  {currentLanguage.modal.title}
                </h5>
                <button
                  type="button"
                  className="text-gray-600 hover:text-gray-800 transition-colors text-2xl leading-none pb-1 cursor-pointer"
                  onClick={handleModalClose}
                  aria-label="Close modal"
                >
                  &times;
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
                  className="font-bpg-nino bg-[#6c757d] hover:bg-[#5a6268] text-white px-4 py-2 rounded transition-colors cursor-pointer"
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
