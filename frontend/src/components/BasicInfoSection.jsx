import CustomSelect from "./common/CustomSelect";

export function BasicInfoSection({ 
  formData, 
  handleInputChange, 
  handleLegalFormChange,
  organizationalLegalFormOptions,
  t,
  isEnglish 
}) {
  // Pseudo-option values for the "select group" action rows
  const SELECT_ALL_VALUE = "__select_all__";
  const SELECT_BUSINESS_VALUE = "__select_business__";

  // Legal-form IDs that count as "business entities":
  // შპს(1), სს(2), სპს(3), კს(4), კოოპერატივი(5), იმ(30), უცხოური საწარმოს ფილიალი(39)
  const BUSINESS_ENTITY_IDS = ["1", "2", "3", "4", "5", "30", "39"];

  const selectAllOption = {
    value: SELECT_ALL_VALUE,
    label: isEnglish ? "✓ Select All Entities" : "✓ ყველა სუბიექტის არჩევა"
  };
  const selectBusinessOption = {
    value: SELECT_BUSINESS_VALUE,
    label: isEnglish ? "✓ Select Business Entities" : "✓ ბიზნეს სუბიექტების არჩევა"
  };

  // Split the loaded forms into the business-entity group and the rest
  const businessOptions = organizationalLegalFormOptions.filter((option) =>
    BUSINESS_ENTITY_IDS.includes(option.value)
  );
  const otherOptions = organizationalLegalFormOptions.filter((option) =>
    !BUSINESS_ENTITY_IDS.includes(option.value)
  );

  // Check if all options are selected
  const allSelected = organizationalLegalFormOptions.length > 0 &&
    formData.organizationalLegalForm.length === organizationalLegalFormOptions.length;

  // Check if exactly the business entities are selected
  const businessSelected = businessOptions.length > 0 &&
    formData.organizationalLegalForm.length === businessOptions.length &&
    businessOptions.every((option) =>
      formData.organizationalLegalForm.includes(option.value)
    );

  // Grouped options: two action rows on top, then the business group, then the rest.
  // The group headings identify the business entities — no per-item tag needed.
  const groupedOptions = [
    selectAllOption,
    selectBusinessOption,
    {
      label: isEnglish ? "Business Entities" : "ბიზნეს სუბიექტები",
      options: businessOptions,
    },
    {
      label: isEnglish ? "Other Entities" : "სხვა სუბიექტები",
      options: otherOptions,
    },
  ];

  // Handle change with "Select All" / "Select Business" logic
  const handleSelectChange = (selectedOptions) => {
    if (!selectedOptions) {
      handleLegalFormChange([]);
      return;
    }

    const hasSelectAll = selectedOptions.some(opt => opt.value === SELECT_ALL_VALUE);
    const hasBusiness = selectedOptions.some(opt => opt.value === SELECT_BUSINESS_VALUE);

    if (hasBusiness && !businessSelected) {
      // "Select Business Entities" was just clicked - select the business set
      handleLegalFormChange(businessOptions);
    } else if (!hasBusiness && businessSelected) {
      // "Select Business Entities" was deselected - clear all
      handleLegalFormChange([]);
    } else if (hasSelectAll && !allSelected) {
      // "Select All" was just clicked - select all options
      handleLegalFormChange(organizationalLegalFormOptions);
    } else if (!hasSelectAll && allSelected) {
      // "Select All" was deselected - clear all
      handleLegalFormChange([]);
    } else {
      // Normal selection - filter out both action rows
      const filtered = selectedOptions.filter(
        opt => opt.value !== SELECT_ALL_VALUE && opt.value !== SELECT_BUSINESS_VALUE
      );
      handleLegalFormChange(filtered);
    }
  };

  // Current value - prepend the matching action row when its set is fully selected
  const selectedItems = organizationalLegalFormOptions.filter((option) =>
    formData.organizationalLegalForm.includes(option.value)
  );
  const currentValue = allSelected
    ? [selectAllOption, ...selectedItems]
    : businessSelected
      ? [selectBusinessOption, ...selectedItems]
      : selectedItems;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sr-only">
          <label htmlFor="identificationNumber">{t.identificationNumber}</label>
        </div>
        <input
          id="identificationNumber"
          type="text"
          placeholder={t.identificationNumber}
          name="identificationNumber"
          value={formData.identificationNumber}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white hover:border-[#0080BE] placeholder:text-gray-600 text-gray-800"
        />
        <div className="sr-only">
          <label htmlFor="organizationName">{t.organizationName}</label>
        </div>
        <input
          id="organizationName"
          type="text"
          placeholder={t.organizationName}
          name="organizationName"
          value={formData.organizationName}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white hover:border-[#0080BE] placeholder:text-gray-600 text-gray-800"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <label className="sr-only" htmlFor="organizationalLegalForm">
          {t.organizationalLegalForm}
        </label>
        <CustomSelect
          inputId="organizationalLegalForm"
          name="organizationalLegalForm"
          ariaLabel={t.organizationalLegalForm}
          placeholder={t.organizationalLegalForm}
          value={currentValue}
          onChange={handleSelectChange}
          options={groupedOptions}
          className="sm:col-span-2"
          isMulti
        />
        <div className="sr-only">
          <label htmlFor="head">{t.head}</label>
        </div>
        <input
          id="head"
          type="text"
          placeholder={t.head}
          name="head"
          value={formData.head}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white hover:border-[#0080BE] placeholder:text-gray-600 text-gray-800"
        />
        <div className="sr-only">
          <label htmlFor="partner">{t.partner}</label>
        </div>
        <input
          id="partner"
          type="text"
          placeholder={t.partner}
          name="partner"
          value={formData.partner}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white hover:border-[#0080BE] placeholder:text-gray-600 text-gray-800"
        />
      </div>
    </>
  );
}
