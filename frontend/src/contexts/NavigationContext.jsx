import { useState } from 'react';
import { NavigationContext } from './NavigationContext.js';

function NavigationProvider({ children }) {
  const [navigationDirection, setNavigationDirection] = useState('right'); // 'left' or 'right'
  const [previousPath, setPreviousPath] = useState('/');
  const [isNavigating, setIsNavigating] = useState(false);

  const setDirection = (direction) => {
    setNavigationDirection(direction);
  };

  const setPrevPath = (path) => {
    setPreviousPath(path);
  };

  const setNavigating = (navigating) => {
    setIsNavigating(navigating);
  };

  return (
    <NavigationContext.Provider 
      value={{ 
        navigationDirection, 
        setDirection, 
        previousPath, 
        setPrevPath,
        isNavigating,
        setNavigating
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export default NavigationProvider;
