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
    <>
      <Header isEnglish={isEnglish} />
      <main>
        <TopNavigation
          isEnglish={isEnglish}
          onLanguageChange={handleLanguageChange}
        />
        <SearchForm isEnglish={isEnglish} />
        <Footer isEnglish={isEnglish} />
      </main>
    </>
  );
}

export default App;
