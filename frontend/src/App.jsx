import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Header from "./components/Header";
import TopNavigation from "./components/TopNavigation";
import SearchForm from "./components/SearchForm";
import SearchHistory from "./pages/SearchHistory";
import Reports from "./components/Reports";
import ReportsResults from "./components/ReportsResults";
import Charts from "./components/Charts";
import Footer from "./components/Footer";
import useDocumentTitle from "./hooks/useDocumentTitle";
import NavigationProvider from "./contexts/NavigationContext.jsx";
import { useNavigation } from "./hooks/useNavigation";
import "./App.scss";

function AppContent() {
  const [isEnglish, setIsEnglish] = useState(false);
  const location = useLocation();
  const { setDirection, setPrevPath, previousPath, setNavigating } = useNavigation();

  // Update document title based on language
  useDocumentTitle(isEnglish);

  // Track navigation direction
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Don't update direction on first load
    if (previousPath === currentPath) return;
    
    setNavigating(true);
    
    // Define page order for navigation direction
    const pageOrder = ['/', '/reports', '/charts'];
    const currentIndex = pageOrder.indexOf(currentPath);
    const previousIndex = pageOrder.indexOf(previousPath);
    
    let direction = 'right'; // default
    
    if (currentIndex !== -1 && previousIndex !== -1) {
      if (currentIndex > previousIndex) {
        direction = 'right'; // Moving forward (left to right)
      } else if (currentIndex < previousIndex) {
        direction = 'left'; // Moving backward (right to left)
      }
    } else if (currentPath === '/reports' && previousPath === '/') {
      direction = 'right'; // Going to reports from main
    } else if (currentPath === '/' && previousPath === '/reports') {
      direction = 'left'; // Going to main from reports
    }
    
    // console.log('Navigation:', { from: previousPath, to: currentPath, direction });
    setDirection(direction);
    setPrevPath(currentPath);
    
    // Reset navigation state after a delay
    const timer = setTimeout(() => {
      setNavigating(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location.pathname, previousPath, setDirection, setPrevPath, setNavigating]);

  const handleLanguageChange = (isEnglish) => {
    setIsEnglish(isEnglish);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header isEnglish={isEnglish} />
      <TopNavigation
        isEnglish={isEnglish}
        onLanguageChange={handleLanguageChange}
      />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<SearchForm isEnglish={isEnglish} />} />
          <Route
            path="/search-history"
            element={<SearchHistory isEnglish={isEnglish} />}
          />
          <Route
            path="/reports"
            element={<Reports isEnglish={isEnglish} />}
          />
          <Route
            path="/reports/:reportId"
            element={<ReportsResults isEnglish={isEnglish} />}
          />
          <Route path="/charts" element={<Charts isEnglish={isEnglish} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer isEnglish={isEnglish} />
    </div>
  );
}

function App() {
  return (
    <NavigationProvider>
      <Router>
        <AppContent />
      </Router>
    </NavigationProvider>
  );
}

export default App;
