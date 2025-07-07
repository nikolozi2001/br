import { useState } from "react";
import Header from "./components/Header";
import TopNavigation from "./components/TopNavigation";
import SearchForm from "./components/SearchForm";
import Footer from "./components/Footer";
import "./App.scss";

function App() {
  const [isEnglish, setIsEnglish] = useState(false);

  const handleLanguageChange = (isEnglish) => {
    setIsEnglish(isEnglish);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header isEnglish={isEnglish} />
      <TopNavigation
        isEnglish={isEnglish}
        onLanguageChange={handleLanguageChange}
      />
      <main className="flex-grow">
        <SearchForm isEnglish={isEnglish} />
      </main>
      <Footer isEnglish={isEnglish} />
    </div>
  );
}

export default App;
