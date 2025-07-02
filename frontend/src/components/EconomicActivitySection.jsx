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
  const selectedActivityCodes = formData.activities
    ? activities.codesOnly.filter(opt => 
        formData.activities.some(activity => activity.code === opt.value)
      )
    : [];

  const selectedActivitiesWithNames = formData.activities
    ? activities.codesWithNames.filter(opt => 
        formData.activities.some(activity => activity.code === opt.value)
      )
    : [];

  const handleActivityCodeChange = (selected) => {
    if (selected && selected.length > 0) {
      const newActivities = selected.map(item => {
        const matchingNameOption = activities.codesWithNames.find(opt => opt.value === item.value);
        return {
          code: item.value,
          name: matchingNameOption ? matchingNameOption.label : ""
        };
      });
      setFormData(prev => ({
        ...prev,
        activities: newActivities
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        activities: []
      }));
    }
  };

  const handleActivitiesChange = (selected) => {
    setFormData(prev => ({
      ...prev,
      activities: selected ? selected.map(item => ({
        code: item.value,
        name: item.label
      })) : []
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
            isMulti={true}
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
            isMulti={true}
            className="w-full"
            isClearable={true}
          />
        </div>
      </div>
    </div>
  );
}
