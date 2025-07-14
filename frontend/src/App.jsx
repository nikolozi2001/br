import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Header from "./components/Header";
import TopNavigation from "./components/TopNavigation";
import SearchForm from "./components/SearchForm";
import Reports from "./components/Reports";
import ReportsResults from "./components/ReportsResults";
import Charts from "./components/Charts";
import Footer from "./components/Footer";
import "./App.scss";

function App() {
  const [isEnglish, setIsEnglish] = useState(false);

  const handleLanguageChange = (isEnglish) => {
    setIsEnglish(isEnglish);
  };

  return (
    <Router>
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
              path="/reports"
              element={<Reports isEnglish={isEnglish} />}
            />
            <Route
              path="/reports/:reportId"
              element={<ReportsResults isEnglish={isEnglish} />}
            />
            <Route
              path="/charts"
              element={<Charts isEnglish={isEnglish} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer isEnglish={isEnglish} />
      </div>
    </Router>
  );
}

export default App;
