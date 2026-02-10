import CustomSelect from "./common/CustomSelect";

export function BasicInfoSection({ 
  formData, 
  handleInputChange, 
  handleLegalFormChange,
  organizationalLegalFormOptions,
  t,
  isEnglish 
}) {
  // Create "Select All" option
  const SELECT_ALL_VALUE = "__select_all__";
  const selectAllOption = {
    value: SELECT_ALL_VALUE,
    label: isEnglish ? "✓ Select All" : "✓ ყველას არჩევა"
  };

  // Check if all options are selected
  const allSelected = organizationalLegalFormOptions.length > 0 && 
    formData.organizationalLegalForm.length === organizationalLegalFormOptions.length;

  // Options with "Select All" at the top
  const optionsWithSelectAll = [selectAllOption, ...organizationalLegalFormOptions];

  // Handle change with "Select All" logic
  const handleSelectChange = (selectedOptions) => {
    if (!selectedOptions) {
      handleLegalFormChange([]);
      return;
    }

    const hasSelectAll = selectedOptions.some(opt => opt.value === SELECT_ALL_VALUE);
    const prevHadSelectAll = allSelected;

    if (hasSelectAll && !prevHadSelectAll) {
      // "Select All" was just clicked - select all options
      handleLegalFormChange(organizationalLegalFormOptions);
    } else if (!hasSelectAll && prevHadSelectAll) {
      // "Select All" was deselected - clear all
      handleLegalFormChange([]);
    } else {
      // Normal selection - filter out the "Select All" option
      const filtered = selectedOptions.filter(opt => opt.value !== SELECT_ALL_VALUE);
      handleLegalFormChange(filtered);
    }
  };

  // Current value - add "Select All" if all are selected
  const currentValue = allSelected
    ? [selectAllOption, ...organizationalLegalFormOptions.filter((option) =>
        formData.organizationalLegalForm.includes(option.value)
      )]
    : organizationalLegalFormOptions.filter((option) =>
        formData.organizationalLegalForm.includes(option.value)
      );

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
          value={currentValue}
          onChange={handleSelectChange}
          options={optionsWithSelectAll}
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
