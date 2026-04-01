import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import NotionPage from './pages/NotionPage';
import InterestsPage from './pages/InterestsPage';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/notion" element={<NotionPage />} />
            <Route path="/interests" element={<InterestsPage />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>LithtHouse © 2024</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;