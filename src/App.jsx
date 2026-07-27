// src/App.jsx
import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import Calendar from "./pages/Calendar";
import CacheViewer from "./pages/CacheViewer";
import AnimeList from "./pages/AnimeList"
import Login from "./pages/Login"
import User from "./pages/User"

function App() {
  useEffect(() => {
    // Canonicalize the app root URL to avoid slash-related route glitches.
    const basePath = "/NextAnime";
    const { pathname, search, hash } = window.location;
    if (pathname === `${basePath}/`) {
      window.history.replaceState(null, "", `${basePath}${search}${hash}`);
    }
  }, []);

  return (
    <Router basename="/NextAnime">
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/cache" element={<CacheViewer />} />
        <Route path="/animelist" element={<AnimeList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/user" element={<User />} />
      </Routes>
    </Router>
  );
}

export default App;
