export function AdditionalInfoSection({ formData, handleInputChange, t }) {
  return (
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
  );
}
