export function EconomicActivitySection({ formData, handleInputChange, t }) {
  return (
    <div className="space-y-4">
      <h3 className="text-base sm:text-lg font-bold font-bpg-nino text-center">
        {t.economicActivity}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-10 gap-3 sm:gap-4">
        <input
          type="text"
          placeholder={t.activityCode}
          value={formData.code}
          onChange={(e) => handleInputChange(e, "economicActivity", "code")}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white sm:col-span-3 hover:border-[#0080BE]"
        />
        <input
          type="text"
          placeholder={t.activityDescription}
          value={formData.description}
          onChange={(e) => handleInputChange(e, "economicActivity", "description")}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:border-[#0080BE] focus:outline-none bg-white sm:col-span-7 hover:border-[#0080BE]"
        />
      </div>
    </div>
  );
}
