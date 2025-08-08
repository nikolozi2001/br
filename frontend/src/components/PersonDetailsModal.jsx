import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchLegalUnitWeb } from "../services/api";
import loaderIcon from "../assets/images/equalizer.svg";

const PersonDetailsModal = ({
  isOpen,
  onClose,
  personId,
  personName,
  isEnglish,
}) => {
  const [personDetails, setPersonDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !personId) return;

      setLoading(true);
      setError(null);

      try {
        const data = await fetchLegalUnitWeb(personId);
        setPersonDetails(data || []);
      } catch (err) {
        console.error("Error fetching person details:", err);
        setError(
          isEnglish
            ? "Error loading person details"
            : "შეცდომა პირის მონაცემების ჩატვირთვისას"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, personId, isEnglish]);

  // Handle company name click to navigate to SearchHistory
  const handleCompanyClick = (legalCode) => {
    if (legalCode) {
      // Close the modal first
      onClose();
      // Navigate to SearchHistory with the Legal_Code (identificationNumber)
      navigate(`/search-history?id=${legalCode}`);
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup function to reset body scroll
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[9999] p-4"
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative z-[10000] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-[#0080BE] text-white flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold font-bpg-nino">{personName}</h2>
            <p className="text-sm opacity-90 font-bpg-nino">
              {isEnglish ? "Participation List" : "მონაწილეობის ჩამონათვალი"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-500 hover:bg-opacity-20 rounded-full cursor-pointer transition-colors"
            aria-label={isEnglish ? "Close modal" : "მოდალის დახურვა"}
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <img src={loaderIcon} alt="Loading..." className="w-12 h-12" />
              <span className="ml-3 text-gray-600 font-bpg-nino">
                {isEnglish ? "Loading..." : "იტვირთება..."}
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 font-bpg-nino">{error}</p>
            </div>
          ) : personDetails.length > 0 ? (
            <div className="flex flex-col flex-1 m-6 overflow-hidden rounded-lg border border-gray-200">
              {/* Table Header - Fixed */}
              <div className="flex px-6 py-3 bg-[#2c7bbf] text-white font-bold font-bpg-nino text-sm sm:text-base flex-shrink-0">
                <div className="w-2/5">
                  {isEnglish ? "Company" : "კომპანია"}
                </div>
                <div className="w-2/5">
                  {isEnglish ? "Position" : "თანამდებობა"}
                </div>
                <div className="w-1/5">{isEnglish ? "Date" : "თარიღი"}</div>
              </div>

              {/* Table Rows - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                {personDetails.map((item, index) => (
                  <div
                    key={index}
                    className={`flex px-6 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                      index === personDetails.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <div
                      className="w-2/5 font-bpg-nino cursor-pointer text-[#0080BE] hover:text-[#0070aa] hover:underline transition-colors"
                      onClick={() => handleCompanyClick(item.Legal_Code)}
                      title={
                        isEnglish
                          ? "Click to view company details"
                          : "კომპანიის დეტალების სანახავად დააწკაპუნეთ"
                      }
                    >
                      {item.Full_Name || item.Name || "-"}
                    </div>
                    <div className="w-2/5 font-bpg-nino">
                      {item.Position || "-"}
                    </div>
                    <div className="w-1/5 font-bpg-nino">
                      {item.Date
                        ? new Date(item.Date).toLocaleDateString(
                            isEnglish ? "en-US" : "ka-GE",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            }
                          )
                        : "-"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 font-bpg-nino">
                {isEnglish
                  ? "No participation history found"
                  : "მონაწილეობის ისტორია ვერ მოიძებნა"}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer - Fixed at bottom */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-bpg-nino cursor-pointer"
          >
            {isEnglish ? "Close" : "დახურვა"}
          </button>
        </div>
      </div>
    </div>
  );
};

PersonDetailsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  personId: PropTypes.string,
  personName: PropTypes.string,
  isEnglish: PropTypes.bool.isRequired,
};

export default PersonDetailsModal;
