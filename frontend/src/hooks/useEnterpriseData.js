// Custom hook for enterprise data with caching
import { useState, useEffect, useRef } from 'react';
import { fetchEnterpriseBirthDeath } from '../services/api';

const useEnterpriseData = (language) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const cacheRef = useRef(new Map());
  
  useEffect(() => {
    const loadData = async () => {
      const cacheKey = `enterprise-${language}`;
      
      // Check cache first
      if (cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey);
        const isExpired = Date.now() - cached.timestamp > 5 * 60 * 1000; // 5 minutes
        
        if (!isExpired) {
          setData(cached.data);
          setLoading(false);
          setError(null);
          return;
        }
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchEnterpriseBirthDeath(language);
        
        // Cache the response
        cacheRef.current.set(cacheKey, {
          data: response,
          timestamp: Date.now()
        });
        
        setData(response);
        setRetryCount(0);
      } catch (err) {
        console.error("Error loading enterprise data:", err);
        setError(err.message || "Failed to load data");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [language, retryCount]);

  const retry = () => setRetryCount(prev => prev + 1);
  const clearCache = () => cacheRef.current.clear();

  return { data, loading, error, retry, clearCache };
};

export default useEnterpriseData;
