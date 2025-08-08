import "../styles/Reports.scss";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getPageTitle } from "../utils/pageTitles";
import { useNavigation } from "../hooks/useNavigation";

function Reports({ isEnglish }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const navigate = useNavigate();
  const { navigationDirection, isNavigating } = useNavigation();

  // Set page-specific title
  useDocumentTitle(isEnglish, getPageTitle('reports', isEnglish));

  useEffect(() => {
    // Reset flip state when navigating
    if (isNavigating) {
      setIsFlipped(false);
    }
    
    // Trigger flip animation
    const timer = setTimeout(() => {
      setIsFlipped(true);
    }, isNavigating ? 200 : 100);
    
    return () => clearTimeout(timer);
  }, [isNavigating]);
  const handleReportClick = (reportId) => {
    navigate(`/reports/${reportId}`);
  };

  const reports = {
    georgian: [
      {
        id: 1,
        title:
          "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა ეკონომიკური საქმიანობის სახეების მიხედვით (NACE Rev. 2)",
      },
      {
        id: 2,
        title:
          "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა მეწარმე სუბიექტთა და სხვა სამართლებრივი ფორმების მიხედვით",
      },
      {
        id: 3,
        title:
          "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა საკუთრების ფორმების მიხედვით",
      },
      {
        id: 4,
        title:
          "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა რეგიონების მიხედვით",
      },
      {
        id: 5,
        title:
          "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა მუნიციპალიტეტების მიხედვით",
      },
      {
        id: 6,
        title:
          "რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ორგანიზაციულ-სამართლებრივი ფორმის ჭრილში - ნაზარდი ჯამი",
      },
      {
        id: 7,
        title:
          "რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ორგანიზაციულ-სამართლებრივი ფორმების ჭრილში - კონკრეტულ წელს რეგისტრირებული",
      },
      {
        id: 8,
        title:
          "რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ეკონომიკური საქმიანობის სახეების ჭრილში (Nace Rev.2) - ნაზარდი ჯამი",
      },
      {
        id: 9,
        title:
          "რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ეკონომიკური საქმიანობის სახეების ჭრილში (Nace Rev.2) - კონკრეტულ წელს რეგისტრირებული",
      },
      {
        id: 10,
        title:
          "საქართველოში რეგისტრირებულ მოქმედ ბიზნეს სუბიექტთა რაოდენობა რეგიონების და ეკონომიკური საქმიანობის სახეების მიხედვით (Nace Rev.2)",
      },
    ],
    english: [
      {
        id: 1,
        title:
          "Number of Registered and Active Organizations by Economic Activity Types (NACE Rev. 2)",
      },
      {
        id: 2,
        title:
          "Number of Registered and Active Organizations by Entrepreneurial Entities and Other Legal Forms",
      },
      {
        id: 3,
        title:
          "Number of Registered and Active Organizations by Forms of Ownership",
      },
      {
        id: 4,
        title: "Number of Registered and Active Organizations by Regions",
      },
      {
        id: 5,
        title:
          "Number of Registered and Active Organizations by Municipalities",
      },
      {
        id: 6,
        title:
          "Number of Registered Organizations by Years and Legal Forms - Cumulative Sum",
      },
      {
        id: 7,
        title:
          "Number of Registered Organizations by Years and Legal Forms - Registered in Specific Year",
      },
      {
        id: 8,
        title:
          "Number of Registered Organizations by Years and Economic Activity Types (NACE Rev.2) - Cumulative Sum",
      },
      {
        id: 9,
        title:
          "Number of Registered Organizations by Years and Economic Activity Types (NACE Rev.2) - Registered in Specific Year",
      },
      {
        id: 10,
        title:
          "Number of Active Business Entities Registered in Georgia by Regions and Economic Activity Types (NACE Rev.2)",
      },
    ],
  };

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8">
          <div className={`flipper-container ${isFlipped ? 'flipped' : ''} ${navigationDirection === 'left' ? 'flip-left' : 'flip-right'}`}>
            <div className="flipper">
              <div className="border border-[#0080BE] rounded-[0_5px_5px_5px] bg-[#fafafa] py-4 px-5">
                <ul className="space-y-2.5 reports-list">
                  {reports[isEnglish ? "english" : "georgian"].map((report) => (
                    <li
                      key={report.id}
                      onClick={() => handleReportClick(report.id)}
                      className="py-2.5 px-4 bg-white border border-gray-200 rounded hover:bg-[#0080BE] transition-all cursor-pointer group"
                    >
                      <div className="flex items-start">
                        <span className="font-bpg-nino mr-4 text-[#0080BE] group-hover:text-white transition-colors">
                          {report.id}.
                        </span>
                        <span className="font-bpg-nino group-hover:text-white transition-colors">
                          {report.title}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
