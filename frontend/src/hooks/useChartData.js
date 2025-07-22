import { useState, useEffect, useCallback } from 'react';
import {
  fetchEnterpriseBirthDeath,
  fetchEnterpriseNace,
  fetchEnterpriseDeathNace,
  fetchEnterpriseBirthRegion,
  fetchEnterpriseDeathRegion,
  fetchEnterpriseBirthSector,
  fetchEnterpriseDeathSector,
  fetchEnterpriseSurvivalYear,
  fetchEnterpriseBirthDistribution,
  fetchEnterpriseDeathDistribution,
} from '../services/api';

export const useChartData = (isEnglish) => {
  const [data, setData] = useState({
    organizationsByYear: [],
    activityData: [],
    activityDataDeath: [],
    regionalData: [],
    regionalDataDeath: [],
    sectorData: [],
    sectorDataDeath: [],
    survivalData: [],
    distributionData: [],
    distributionDataDeath: [],
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [dataCache, setDataCache] = useState(new Map());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const cacheKey = `${isEnglish ? "en" : "ge"}-${retryCount}`;
      
      // Check cache first
      if (dataCache.has(cacheKey)) {
        const cachedData = dataCache.get(cacheKey);
        setData(cachedData);
        setLoading(false);
        return;
      }

      // Fetch all datasets in parallel
      const [
        birthDeathData,
        naçeData,
        deathNaçeData,
        birthRegionData,
        deathRegionData,
        birthSectorData,
        deathSectorData,
        survivalYearData,
        birthDistributionData,
        deathDistributionData,
      ] = await Promise.all([
        fetchEnterpriseBirthDeath(isEnglish ? "en" : "ge"),
        fetchEnterpriseNace(isEnglish ? "en" : "ge"),
        fetchEnterpriseDeathNace(isEnglish ? "en" : "ge"),
        fetchEnterpriseBirthRegion(isEnglish ? "en" : "ge"),
        fetchEnterpriseDeathRegion(isEnglish ? "en" : "ge"),
        fetchEnterpriseBirthSector(isEnglish ? "en" : "ge"),
        fetchEnterpriseDeathSector(isEnglish ? "en" : "ge"),
        fetchEnterpriseSurvivalYear(isEnglish ? "en" : "ge"),
        fetchEnterpriseBirthDistribution(isEnglish ? "en" : "ge"),
        fetchEnterpriseDeathDistribution(isEnglish ? "en" : "ge"),
      ]);

      const newData = {
        organizationsByYear: birthDeathData,
        activityData: naçeData,
        activityDataDeath: deathNaçeData,
        regionalData: birthRegionData,
        regionalDataDeath: deathRegionData,
        sectorData: birthSectorData,
        sectorDataDeath: deathSectorData,
        survivalData: survivalYearData,
        distributionData: birthDistributionData,
        distributionDataDeath: deathDistributionData,
      };

      // Cache the results
      setDataCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, newData);
        // Keep only last 4 cache entries to prevent memory leaks
        if (newCache.size > 4) {
          const firstKey = newCache.keys().next().value;
          newCache.delete(firstKey);
        }
        return newCache;
      });

      setData(newData);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error("Error loading data:", error);
      setError(error.message || "Failed to load data");
      setData({
        organizationsByYear: [],
        activityData: [],
        activityDataDeath: [],
        regionalData: [],
        regionalDataDeath: [],
        sectorData: [],
        sectorDataDeath: [],
        survivalData: [],
        distributionData: [],
        distributionDataDeath: [],
      });
    } finally {
      setLoading(false);
    }
  }, [isEnglish, retryCount, dataCache]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  return {
    data,
    loading,
    error,
    handleRetry,
  };
};
