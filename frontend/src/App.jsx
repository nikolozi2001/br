import Header from "./components/Header";
import TopNavigation from "./components/TopNavigation";
import SearchForm from "./components/SearchForm";
import "./App.scss";

function App() {
  return (
    <>
      <Header />
      <main>
        <TopNavigation />
        <SearchForm />
      </main>
    </>
  );
}

export default App;
