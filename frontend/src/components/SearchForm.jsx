import { useState, useEffect } from "react";
import Select from "react-select";
import "../styles/SearchForm.scss";

const translations = {
  ge: {
    title: "ეკონომიკური სუბიექტების ძებნა",
    identificationNumber: "საიდენტიფიკაციო ნომერი",
    organizationName: "ორგანიზაციის დასახელება",
    organizationalLegalForm: "ორგანიზაციულ-სამართლებრივი ფორმა",
    head: "ხელმძღვანელი",
    partner: "პარტნიორი",
    legalAddress: "იურიდიული მისამართი",
    factualAddress: "ფაქტობრივი მისამართი",
    region: "რეგიონი",
    municipalityCity: "მუნიციპალიტეტი/ქალაქი",
    address: "მისამართი",
    economicActivity: "ეკონომიკური საქმიანობა (NACE Rev.2)",
    activityCode: "ეკონომიკური საქმიანობის კოდი",
    activityDescription: "ეკონომიკური საქმიანობის დასახელება",
    ownershipForm: "საკუთრების ფორმა",
    businessSize: "ბიზნესის ზომა",
    activeSubject: "აქტიური ეკონომიკური სუბიექტი",
    search: "ძიება",
    stopSearch: "ძიების შეჩერება",
    cancel: "გაუქმება",
    activeTooltip: `ეკონომიკური ერთეული აქტიურია, თუ იგი აკმაყოფილებს ქვემოთ ჩამოთვლილი კრიტერიუმებიდან ერთ-ერთს:
1) ბრუნვა > 0 (დღგ-ს, ყოველთვიური საშემოსავლო და სხვა დეკლარაციები);
2) ხელფასი ან დასაქმებულთა რაოდენობა > 0 (ყოველთვიური საშემოსავლო და სხვა დეკლარაციები);
3) აქვს მოგება ან ზარალი (მოგების დეკლარაცია);
4) გადაიხადა ნებისმიერი სახის გადასახადი, გარდა მხოლოდ ქონების გადასახადისა`,
  },
  en: {
    title: "Economic Entity Search",
    identificationNumber: "Identification Number",
    organizationName: "Organization Name",
    organizationalLegalForm: "Organizational Legal Form",
    head: "Head",
    partner: "Partner",
    legalAddress: "Legal Address",
    factualAddress: "Actual Address",
    region: "Region",
    municipalityCity: "Municipality/City",
    address: "Address",
    economicActivity: "Economic Activity (NACE Rev.2)",
    activityCode: "Economic Activity Code",
    activityDescription: "Economic Activity Description",
    ownershipForm: "Ownership Form",
    businessSize: "Business Size",
    activeSubject: "Active Economic Entity",
    search: "Search",
    stopSearch: "Stop Search",
    cancel: "Cancel",
    activeTooltip: `The economic unit is active if it meets one of the criteria listed below:
1) Turnover > 0 (VAT, monthly income and other declarations);
2) Salary or number of employees > 0 (monthly income and other declarations);
3) Has profit or loss (profit declaration);
4) Paid any type of tax, except property tax only`,
  },
};

function SearchForm({ isEnglish }) {
  const t = translations[isEnglish ? "en" : "ge"];
  const [organizationalLegalFormOptions, setOrganizationalLegalFormOptions] = useState([]);

  useEffect(() => {
    const fetchLegalForms = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/legal-forms');
        const data = await response.json();
        
        // Transform the data to match the select component format
        const transformedOptions = data.map(form => ({
          value: form.ID.toString(),
          label: isEnglish ? form.Legal_Form : form.Legal_Form // You might want to add Georgian translations in the backend
        }));
        
        setOrganizationalLegalFormOptions(transformedOptions);
      } catch (error) {
        console.error('Error fetching legal forms:', error);
        // Fallback to empty array if API fails
        setOrganizationalLegalFormOptions([]);
      }
    };

    fetchLegalForms();
  }, [isEnglish]); // Re-fetch when language changes

  const [formData, setFormData] = useState({
    identificationNumber: "",
    organizationName: "",
    organizationalLegalForm: "",
    head: "",
    partner: "",
    status: "",
    isActive: false,
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
      head: "",
      partner: "",
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
        <div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8">
          <div className="bg-[#fafafa] border border-[#0080BE] rounded-[0_5px_5px_5px]">
            <div className="p-3 sm:p-6">
              <h2 className="text-base sm:text-lg mb-4 sm:mb-6 text-center font-bpg-nino font-bold">
                {t.title}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder={t.identificationNumber}
                    name="identificationNumber"
                    value={formData.identificationNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white hover:border-[#0080BE]"
                  />
                  <input
                    type="text"
                    placeholder={t.organizationName}
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white hover:border-[#0080BE]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Select
                    placeholder={t.organizationalLegalForm}
                    name="organizationalLegalForm"
                    value={organizationalLegalFormOptions.find(
                      (option) => option.value === formData.organizationalLegalForm
                    )}
                    onChange={(option) =>
                      handleInputChange({ target: { name: "organizationalLegalForm", value: option?.value || "" } })
                    }
                    options={organizationalLegalFormOptions}
                    className="sm:col-span-2"
                    classNamePrefix="react-select"
                    isClearable
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderColor: state.isFocused ? "#0080BE" : "#D1D5DB",
                        "&:hover": {
                          borderColor: "#0080BE",
                        },
                        boxShadow: "none",
                        padding: "1px",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor:
                          state.isSelected ? "#0080BE" : state.isFocused ? "#E6F4FA" : "white",
                        color: state.isSelected ? "white" : "#000000",
                        "&:hover": {
                          backgroundColor: state.isSelected ? "#0080BE" : "#E6F4FA",
                        },
                      }),
                    }}
                  />
                  <input
                    type="text"
                    placeholder={t.head}
                    name="head"
                    value={formData.head}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white hover:border-[#0080BE]"
                  />
                  <input
                    type="text"
                    placeholder={t.partner}
                    name="partner"
                    value={formData.partner}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white hover:border-[#0080BE]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold font-bpg-nino text-center">
                      {t.legalAddress}
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder={t.region}
                          value={formData.personalAddress.region}
                          onChange={(e) =>
                            handleInputChange(e, "personalAddress", "region")
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white hover:border-[#0080BE]"
                        />
                        <input
                          type="text"
                          placeholder={t.municipalityCity}
                          value={formData.personalAddress.municipalityCity}
                          onChange={(e) =>
                            handleInputChange(
                              e,
                              "personalAddress",
                              "municipalityCity"
                            )
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white hover:border-[#0080BE]"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder={t.address}
                        value={formData.personalAddress.address}
                        onChange={(e) =>
                          handleInputChange(e, "personalAddress", "address")
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white hover:border-[#0080BE]"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold font-bpg-nino text-center">
                      {t.factualAddress}
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder={t.region}
                          value={formData.legalAddress.region}
                          onChange={(e) =>
                            handleInputChange(e, "legalAddress", "region")
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white hover:border-[#0080BE]"
                        />
                        <input
                          type="text"
                          placeholder={t.municipalityCity}
                          value={formData.legalAddress.municipalityCity}
                          onChange={(e) =>
                            handleInputChange(
                              e,
                              "legalAddress",
                              "municipalityCity"
                            )
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white hover:border-[#0080BE]"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder={t.address}
                        value={formData.legalAddress.address}
                        onChange={(e) =>
                          handleInputChange(e, "legalAddress", "address")
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white hover:border-[#0080BE]"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-bold font-bpg-nino text-center">
                    {t.economicActivity}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-10 gap-3 sm:gap-4">
                    <input
                      type="text"
                      placeholder={t.activityCode}
                      value={formData.economicActivity.code}
                      onChange={(e) =>
                        handleInputChange(e, "economicActivity", "code")
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white sm:col-span-3 hover:border-[#0080BE]"
                    />
                    <input
                      type="text"
                      placeholder={t.activityDescription}
                      value={formData.economicActivity.description}
                      onChange={(e) =>
                        handleInputChange(e, "economicActivity", "description")
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white sm:col-span-7 hover:border-[#0080BE]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-bold font-bpg-nino text-center">
                      {t.ownershipForm}
                    </h3>
                    <input
                      type="text"
                      placeholder={t.ownershipForm}
                      name="ownershipForm"
                      value={formData.ownershipForm}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white hover:border-[#0080BE]"
                    />
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-bold font-bpg-nino text-center">
                      {t.businessSize}
                    </h3>
                    <input
                      type="text"
                      placeholder={t.businessSize}
                      name="businessForm"
                      value={formData.businessForm}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white hover:border-[#0080BE]"
                    />
                  </div>
                </div>
                <div className="w-full mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      className="w-4 h-4 text-[#0080BE] border-gray-300 rounded focus:ring-[#0080BE] cursor-pointer"
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                    />
                    <label
                      htmlFor="isActive"
                      className="flex items-center gap-2 font-bpg-nino font-bold"
                    >
                      {t.activeSubject}
                      <div className="relative group">
                        <svg
                          className="w-5 h-5 text-[#0080BE] cursor-help"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div className="absolute left-0 w-[calc(100vw-2rem)] sm:w-96 p-2 bg-white border border-gray-200 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 text-xs sm:text-sm">
                          {t.activeTooltip}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                <div className="flex justify-center w-full mt-4">
                  <div className="inline-flex flex-col sm:flex-row w-full sm:w-auto">
                    <button
                      type="submit"
                      className="flex items-center justify-center px-4 py-2 font-bold text-[#0080BE] border border-[#0080BE] hover:bg-[#0080BE] hover:text-white transition-colors rounded-t sm:rounded-t-none sm:rounded-l cursor-pointer text-sm sm:text-base"
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
                      {t.search}
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center px-4 py-2 font-bold text-[#0080BE] border-y border-[#0080BE] hover:bg-[#0080BE] hover:text-white transition-colors cursor-pointer text-sm sm:text-base"
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
                      {t.stopSearch}
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center px-4 py-2 font-bold text-red-600 border border-l border-red-600 hover:bg-red-600 hover:text-white transition-colors rounded-b sm:rounded-b-none sm:rounded-r cursor-pointer text-sm sm:text-base"
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
                      {t.cancel}
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
