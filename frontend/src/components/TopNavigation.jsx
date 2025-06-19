import { useState } from "react";
import britishFlag from "/src/assets/images/british-flag.png";

function TopNavigation() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLanguageSwitch = () => {
    // TODO: Implement language switching functionality
    console.log("Language switch clicked");
  };

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

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
                <div className="text-sm text-gray-600 whitespace-nowrap font-bold">
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
                    <img
                      src={britishFlag}
                      alt="English"
                      className="w-6 h-auto"
                    />
                  </button>

                  {/* Info Button */}
                  <button
                    className="text-[#0080BE] hover:text-[#0070aa] transition-colors p-1"
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
                <h5 className="modal-title font-bpg-nino text-xl" id="exampleModalLabel">
                  ბიზნეს რეგისტრის შესახებ
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
                <p className="mb-4">სტატისტიკური ბიზნეს რეგისტრი დაარსდა 1995 წელს. იგი მოიცავს რეგლამენტირებულ ცნობებს ქვეყნის ტერიტორიაზე საზოგადოებრივი ან სამეწარმეო საქმიანობით დაკავებული ყველა იურიდიული და ფიზიკური პირის შესახებ.</p>
                <p className="mb-4">სტატისტიკური ბიზნეს რეგისტრის განახლება ხორციელდება ყოველთვიურად, ძირითადად, ადმინისტრაციული წყაროებიდან (საჯარო რეესტრის ეროვნული სააგენტო, შემოსავლების სამსახური) და სტატისტიკის ეროვნული სამსახურის მიერ ჩატარებული სხვადასხვა ბიზნეს გამოკვლევებიდან მიღებული ინფორმაციის საფუძველზე.</p>
                <p className="mb-4">მოცემული გვერდის პირველ ჩანართზე - მთავარი განთავსებული ფილტრაციის ველები საშუალებას იძლევა მოძიებულ იქნას  ინფორმაცია საქართველოში რეგისტრირებული სუბიექტების შესახებ სხვადასხვა მახასიათებლის მიხედვით (ორგანიზაციულ-სამართლებრივი ფორმა, საკუთრების ფორმა, რეგიონი, მუნიციპალიტეტი, ეკონომიკური საქმიანობის სახე და სხვა).</p>
                <p className="mb-4">რეპორტების ნაწილში  წარმოდგენილი ცხრილები ასახავს საქართველოში  რეგისტრირებული და აქტიური საწარმოებისა და ორგანიზაციების განაწილებას სხვადასხვა მახასიათებლის მიხედვით.</p>
                <p className="mb-4">გრაფიკების ნაწილში წარმოდგენილია საწარმოთა დემოგრაფიული მაჩვენებლების - საწარმოთა დაბადება, გარდაცვალება, გადარჩენა - ამსახველი გრაფიკები, სხვადასხვა მახასიათებლის მიხედვით.</p>
                <p>GIS ანალიზის ნაწილი საშუალებას იძლევა ინტერაქტიულ რუკებზე, რომლებზეც დატანილია აქტიური კომპანიების გეოგრაფიული კოორდინატები, მოიძიებულ იქნას ბიზნეს სუბიექტები მათი ფაქტობრივი მისამართის მიხედვით.</p>
              </div>
              <div className="modal-footer border-t p-4 flex justify-end">
                <button
                  type="button"
                  className="font-bpg-nino bg-[#6c757d] hover:bg-[#5a6268] text-white px-4 py-2 rounded transition-colors"
                  onClick={handleModalClose}
                >
                  დახურვა
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
