export function FormActions({ t, onReset }) {
  return (
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
          onClick={onReset}
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
  );
}
