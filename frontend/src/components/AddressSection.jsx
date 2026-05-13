import CustomSelect from "./common/CustomSelect";

export function AddressSection({ 
  title, 
  formData, 
  handleInputChange, 
  regionOptions, 
  municipalityOptions, 
  onRegionChange,
  onMunicipalityChange,
  t,
  idPrefix = "address"
}) {
  const regionId = `${idPrefix}-region`;
  const municipalityId = `${idPrefix}-municipality`;
  const addressId = `${idPrefix}-line`;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold font-bpg-nino text-center">{title}</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="sr-only" htmlFor={regionId}>{t.region}</label>
          <CustomSelect
            inputId={regionId}
            name={regionId}
            ariaLabel={t.region}
            placeholder={t.region}
            value={regionOptions.filter((option) =>
              formData.region.includes(option.value)
            )}
            onChange={onRegionChange}
            options={regionOptions}
            isMulti
          />
          <label className="sr-only" htmlFor={municipalityId}>{t.municipalityCity}</label>
          <CustomSelect
            inputId={municipalityId}
            name={municipalityId}
            ariaLabel={t.municipalityCity}
            placeholder={t.municipalityCity}
            value={municipalityOptions.filter(option => 
              formData.municipalityCity.includes(option.value)
            )}
            onChange={onMunicipalityChange}
            options={municipalityOptions}
            isMulti
          />
        </div>
        <label className="sr-only" htmlFor={addressId}>{t.address}</label>
        <input
          id={addressId}
          type="text"
          placeholder={t.address}
          value={formData.address}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white hover:border-[#0080BE] placeholder:text-gray-600 text-gray-800"
        />
      </div>
    </div>
  );
}
