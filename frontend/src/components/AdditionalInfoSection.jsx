import { useEffect, useState } from 'react';
import CustomSelect from './common/CustomSelect';
import { fetchOwnershipTypes, fetchSizes } from '../services/api';

export function AdditionalInfoSection({ formData, handleInputChange, t, isEnglish }) {
  const [ownershipTypes, setOwnershipTypes] = useState([]);
  const [sizes, setSizes] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const [types, sizesList] = await Promise.all([
        fetchOwnershipTypes(isEnglish ? 'en' : 'ge'),
        fetchSizes(isEnglish ? 'en' : 'ge')
      ]);
      setOwnershipTypes(types);
      setSizes(sizesList);
    };
    loadData();
  }, [isEnglish]);

  const handleOwnershipChange = (selectedOptions) => {
    handleInputChange({
      target: {
        name: 'ownershipForm',
        value: selectedOptions || []
      }
    });
  };

  const handleSizeChange = (selectedOptions) => {
    handleInputChange({
      target: {
        name: 'businessForm',
        value: selectedOptions || []
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
          isMulti={true}
        />
      </div>
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-bold font-bpg-nino text-center">
          {t.businessSize}
        </h3>
        <CustomSelect
          placeholder={t.businessSize}
          value={formData.businessForm}
          onChange={handleSizeChange}
          options={sizes}
          isMulti={true}
        />
      </div>
    </div>
  );
}
