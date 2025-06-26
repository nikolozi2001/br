export function ActiveFilterCheckbox({ isActive, onChange, t, darkMode = false }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="isActive"
        name="isActive"
        checked={isActive}
        onChange={onChange}
        className="w-4 h-4 text-[#0080BE] border-gray-300 rounded focus:ring-[#0080BE] cursor-pointer"
      />
      <label
        htmlFor="isActive"
        className={`flex items-center gap-2 font-bpg-nino font-bold ${
          darkMode ? "text-white" : ""
        } cursor-pointer`}
      >
        {t.activeSubject}
        <div className="relative group">
          <svg
            className={`w-5 h-5 ${
              darkMode ? "text-white" : "text-[#0080BE]"
            } cursor-help`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="absolute left-0 w-[calc(100vw-2rem)] sm:w-96 p-2 bg-white border border-gray-200 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-gray-900 text-xs sm:text-sm">
            {t.activeTooltip}
          </div>
        </div>
      </label>
    </div>
  );
}
