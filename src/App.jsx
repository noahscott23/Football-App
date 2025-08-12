import React from 'react';
import { Analytics } from "@vercel/analytics/next"
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import Home from './pages/Home';
import PlayerStats from './pages/PlayerStats';
import Chatbot from './components/Chatbot';

inject();

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/player/:id" element={<PlayerStats />} />
      </Routes>
      <Chatbot />
    </Router>
  );
}

export default App;
