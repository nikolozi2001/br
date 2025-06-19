import { useState } from "react";
import "../styles/SearchForm.scss";

function SearchForm() {
  const [formData, setFormData] = useState({
    identificationNumber: "",
    organizationName: "",
    organizationalLegalForm: "",
    status: "",
    personalAddress: {
      region: "",
      municipalityCity: "",
      address: "",
    },
    legalAddress: {
      region: "",
      municipalityCity: "",
      address: "",
    },
    economicActivity: {
      code: "",
      description: "",
    },
    ownershipForm: "",
    businessForm: "",
  });

  const handleInputChange = (e, section = null, field = null) => {
    const { name, value } = e.target;

    if (section) {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
  };

  const handleReset = () => {
    setFormData({
      identificationNumber: "",
      organizationName: "",
      organizationalLegalForm: "",
      status: "",
      personalAddress: {
        region: "",
        municipalityCity: "",
        address: "",
      },
      legalAddress: {
        region: "",
        municipalityCity: "",
        address: "",
      },
      economicActivity: {
        code: "",
        description: "",
      },
      ownershipForm: "",
      businessForm: "",
    });
  };
  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#fafafa] border border-[#0080BE] rounded-[0_5px_5px_5px]">
            <div className="p-6">
              <h2 className="text-2xl font-medium mb-6 text-center sm:text-left">
                ეკონომიკური სუბიექტების ძებნა
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="საიდენტიფიკაციო ნომერი"
                    name="identificationNumber"
                    value={formData.identificationNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white"
                  />
                  <input
                    type="text"
                    placeholder="ორგანიზაციის დასახელება"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <input
                    type="text"
                    placeholder="ორგანიზაციულ-სამართლებრივი ფორმა"
                    name="organizationalLegalForm"
                    value={formData.organizationalLegalForm}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">იურიდიული მისამართი</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="რეგიონი"
                        value={formData.personalAddress.region}
                        onChange={(e) =>
                          handleInputChange(e, "personalAddress", "region")
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white"
                      />
                      <input
                        type="text"
                        placeholder="მუნიციპალიტეტი/ქალაქი"
                        value={formData.personalAddress.municipalityCity}
                        onChange={(e) =>
                          handleInputChange(
                            e,
                            "personalAddress",
                            "municipalityCity"
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white"
                      />
                      <input
                        type="text"
                        placeholder="მისამართი"
                        value={formData.personalAddress.address}
                        onChange={(e) =>
                          handleInputChange(e, "personalAddress", "address")
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">ფაქტიური მისამართი</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="რეგიონი"
                        value={formData.legalAddress.region}
                        onChange={(e) =>
                          handleInputChange(e, "legalAddress", "region")
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white"
                      />
                      <input
                        type="text"
                        placeholder="მუნიციპალიტეტი/ქალაქი"
                        value={formData.legalAddress.municipalityCity}
                        onChange={(e) =>
                          handleInputChange(
                            e,
                            "legalAddress",
                            "municipalityCity"
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white"
                      />
                      <input
                        type="text"
                        placeholder="მისამართი"
                        value={formData.legalAddress.address}
                        onChange={(e) =>
                          handleInputChange(e, "legalAddress", "address")
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    ეკონომიკური საქმიანობა (NACE Rev.2)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="ეკონომიკური საქმიანობის კოდი"
                      value={formData.economicActivity.code}
                      onChange={(e) =>
                        handleInputChange(e, "economicActivity", "code")
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white"
                    />
                    <input
                      type="text"
                      placeholder="ეკონომიკური საქმიანობის დასახელება"
                      value={formData.economicActivity.description}
                      onChange={(e) =>
                        handleInputChange(e, "economicActivity", "description")
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="საკუთრების ფორმა"
                    name="ownershipForm"
                    value={formData.ownershipForm}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white"
                  />
                  <input
                    type="text"
                    placeholder="ბიზნესის ფორმა"
                    name="businessForm"
                    value={formData.businessForm}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white"
                  />{" "}
                </div>
                <div className="flex justify-center w-full mt-4">
                  <div className="inline-flex">
                    <button
                      type="submit"
                      className="flex items-center px-4 py-2 font-bold text-[#0080BE] border border-[#0080BE] hover:bg-[#0080BE] hover:text-white transition-colors rounded-l cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      ძიება
                    </button>
                    <button
                      type="button"
                      className="flex items-center px-4 py-2 font-bold text-[#0080BE] border-t border-b border-[#0080BE] hover:bg-[#0080BE] hover:text-white transition-colors cursor-pointer"
                      onClick={() => window.stop()}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                      </svg>
                      ძიების შეჩერება
                    </button>
                    <button
                      type="button"
                      className="flex items-center px-4 py-2 font-bold text-red-600 border border-red-600 hover:bg-red-600 hover:text-white transition-colors rounded-r cursor-pointer"
                      onClick={handleReset}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      გაუქმება
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchForm;
