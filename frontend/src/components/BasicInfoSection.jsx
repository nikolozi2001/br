import CustomSelect from "./common/CustomSelect";

export function BasicInfoSection({ 
  formData, 
  handleInputChange, 
  handleLegalFormChange,
  organizationalLegalFormOptions,
  t 
}) {
  return (
    <>
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
        <CustomSelect
          placeholder={t.organizationalLegalForm}
          value={organizationalLegalFormOptions.filter((option) =>
            formData.organizationalLegalForm.includes(option.value)
          )}
          onChange={handleLegalFormChange}
          options={organizationalLegalFormOptions}
          className="sm:col-span-2"
          isMulti
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
    </>
  );
}
