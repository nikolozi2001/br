import { useEffect, useState } from 'react';
import CustomSelect from './common/CustomSelect';
import { fetchOwnershipTypes } from '../services/api';

export function AdditionalInfoSection({ formData, handleInputChange, t, isEnglish }) {
  const [ownershipTypes, setOwnershipTypes] = useState([]);

  useEffect(() => {
    const loadOwnershipTypes = async () => {
      const types = await fetchOwnershipTypes(isEnglish ? 'en' : 'ge');
      setOwnershipTypes(types);
    };
    loadOwnershipTypes();
  }, [isEnglish]);

  const handleOwnershipChange = (selectedOption) => {
    handleInputChange({
      target: {
        name: 'ownershipForm',
        value: selectedOption
      }
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-bold font-bpg-nino text-center">
          {t.ownershipForm}
        </h3>
        <CustomSelect
          placeholder={t.ownershipForm}
          value={formData.ownershipForm}
          onChange={handleOwnershipChange}
          options={ownershipTypes}
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
