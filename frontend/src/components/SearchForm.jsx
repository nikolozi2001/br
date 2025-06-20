import { useState } from "react";
import "../styles/SearchForm.scss";

function SearchForm() {
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
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#fafafa] border border-[#0080BE] rounded-[0_5px_5px_5px]">
            <div className="p-6">
              <h2 className="text-2xl mb-6 text-center font-bpg-nino font-bold">
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
                </div>{" "}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="ორგანიზაციულ-სამართლებრივი ფორმა"
                    name="organizationalLegalForm"
                    value={formData.organizationalLegalForm}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white sm:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="ხელმძღვანელი"
                    name="head"
                    value={formData.head}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white"
                  />
                  <input
                    type="text"
                    placeholder="პარტნიორი"
                    name="partner"
                    value={formData.partner}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold font-bpg-nino text-center">
                      იურიდიული მისამართი
                    </h3>{" "}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
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
                      </div>
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
                    <h3 className="text-lg font-bold font-bpg-nino text-center">
                      ფაქტობრივი მისამართი
                    </h3>{" "}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
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
                      </div>
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
                  <h3 className="text-lg font-bold font-bpg-nino text-center">
                    ეკონომიკური საქმიანობა (NACE Rev.2)
                  </h3>{" "}
                  <div className="grid grid-cols-1 sm:grid-cols-10 gap-4">
                    <input
                      type="text"
                      placeholder="ეკონომიკური საქმიანობის კოდი"
                      value={formData.economicActivity.code}
                      onChange={(e) =>
                        handleInputChange(e, "economicActivity", "code")
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white sm:col-span-3"
                    />
                    <input
                      type="text"
                      placeholder="ეკონომიკური საქმიანობის დასახელება"
                      value={formData.economicActivity.description}
                      onChange={(e) =>
                        handleInputChange(e, "economicActivity", "description")
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white sm:col-span-7"
                    />
                  </div>
                </div>{" "}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold font-bpg-nino text-center">
                      საკუთრების ფორმა
                    </h3>
                    <input
                      type="text"
                      placeholder="საკუთრების ფორმა"
                      name="ownershipForm"
                      value={formData.ownershipForm}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white"
                    />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold font-bpg-nino text-center">
                      ბიზნესის ზომა
                    </h3>
                    <input
                      type="text"
                      placeholder="ბიზნესის ზომა"
                      name="businessForm"
                      value={formData.businessForm}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white"
                    />
                  </div>
                </div>
                <div className="w-full mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      className="w-4 h-4 text-[#0080BE] border-gray-300 rounded focus:ring-[#0080BE]"
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
                      აქტიური ეკონომიკური სუბიექტი
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
                        <div className="absolute left-0 w-96 p-2 bg-white border border-gray-200 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 text-sm">
                          {" "}
                          ეკონომიკური ერთეული აქტიურია, თუ იგი აკმაყოფილებს
                          ქვემოთ ჩამოთვლილი კრიტერიუმებიდან ერთ-ერთს:
                          <br />
                          1) ბრუნვა{">"} 0 (დღგ-ს, ყოველთვიური საშემოსავლო და
                          სხვა დეკლარაციები);
                          <br />
                          2) ხელფასი ან დასაქმებულთა რაოდენობა {">"} 0
                          (ყოველთვიური საშემოსავლო და სხვა დეკლარაციები);
                          <br />
                          3) აქვს მოგება ან ზარალი (მოგების დეკლარაცია);
                          <br />
                          4) გადაიხადა ნებისმიერი სახის გადასახადი, გარდა მხოლოდ
                          ქონების გადასახადისა
                        </div>
                      </div>
                    </label>
                  </div>
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
