import { useEffect, useState } from "react";
import CustomSelect from "./common/CustomSelect";
import { fetchActivities } from "../services/api";

export function EconomicActivitySection({ formData, setFormData, t, isEnglish }) {
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
  const selectedActivityCodes = formData.activities?.[0]?.code
    ? activities.codesOnly.find(opt => opt.value === formData.activities[0].code)
    : null;

  const selectedActivitiesWithNames = formData.activities?.[0]?.code
    ? activities.codesWithNames.find(opt => opt.value === formData.activities[0].code)
    : null;

  const handleActivityCodeChange = (selected) => {
    if (selected) {
      const matchingNameOption = activities.codesWithNames.find(opt => opt.value === selected.value);
      setFormData(prev => ({
        ...prev,
        activities: [{
          code: selected.value,
          name: matchingNameOption ? matchingNameOption.label : ""
        }]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        activities: [{ code: "", name: "" }]
      }));
    }
  };

  const handleActivitiesChange = (selected) => {
    setFormData(prev => ({
      ...prev,
      activities: selected ? [{
        code: selected.value,
        name: selected.label
      }] : [{ code: "", name: "" }]
    }));
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
            isMulti={false}
            className="w-full"
            isClearable={true}
          />
        </div>
        <div className="col-span-7">
          <CustomSelect
            placeholder={t.activityDescription}
            value={selectedActivitiesWithNames}
            onChange={handleActivitiesChange}
            options={activities.codesWithNames}
            isMulti={false}
            className="w-full"
            isClearable={true}
          />
        </div>
      </div>
    </div>
  );
}
