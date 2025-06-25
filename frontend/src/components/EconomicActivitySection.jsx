import { useEffect, useState } from "react";
import CustomSelect from "./common/CustomSelect";
import { fetchActivities } from "../services/api";

export function EconomicActivitySection({ formData, handleInputChange, t, isEnglish }) {
  const [activities, setActivities] = useState({
    codesOnly: [],
    codesWithNames: [],
  });
  useEffect(() => {
    const loadActivities = async () => {
      const data = await fetchActivities(isEnglish ? 'en' : 'ge');
      setActivities(data);
    };
    loadActivities();
  }, [isEnglish]);
  const selectedActivityCodes = formData.selectedActivities
    ? activities.codesOnly.filter((opt) =>
        formData.selectedActivities.includes(opt.value)
      )
    : [];

  const selectedActivitiesWithNames = formData.selectedActivities
    ? activities.codesWithNames.filter((opt) =>
        formData.selectedActivities.includes(opt.value)
      )
    : [];

  const handleActivityCodeChange = (selected) => {
    const selectedValues = selected ? selected.map((item) => item.value) : [];
    handleInputChange(
      { target: { value: selectedValues } },
      "economicActivity",
      "selectedActivities"
    );
  };

  const handleActivitiesChange = (selected) => {
    const selectedValues = selected ? selected.map((item) => item.value) : [];
    handleInputChange(
      { target: { value: selectedValues } },
      "economicActivity",
      "selectedActivities"
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base sm:text-lg font-bold font-bpg-nino text-center">
        {t.economicActivity}
      </h3>{" "}
      <div className="grid grid-cols-10 gap-3 sm:gap-4">
        <div className="col-span-3">
          <CustomSelect
            placeholder={t.activityCode}
            value={selectedActivityCodes}
            onChange={handleActivityCodeChange}
            options={activities.codesOnly}
            isMulti={true}
            className="w-full"
          />
        </div>
        <div className="col-span-7">
          <CustomSelect
            placeholder={t.activityDescription}
            value={selectedActivitiesWithNames}
            onChange={handleActivitiesChange}
            options={activities.codesWithNames}
            isMulti={true}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
