import { createContext } from 'react';

export const NavigationContext = createContext({
  navigationDirection: 'right',
  setDirection: () => {},
  previousPath: '/',
  setPrevPath: () => {},
  isNavigating: false,
  setNavigating: () => {}
});
