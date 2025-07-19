import React from 'react';
import { useParams, Link } from 'react-router-dom';

function PlayerStats() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="pattern"/>
      <div className="wrapper">
        <header className="py-8">
          <Link to="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold">NFL Stats Zone</h1>
          <h2 className="text-2xl font-semibold mt-2 text-gray-300">Player Statistics</h2>
        </header>
        
        <main className="py-8">
          <div className="bg-dark-100 p-8 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Stats for player with ID: {id}</h2>
            <p className="text-gray-300">
              will display stats for player in the future
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default PlayerStats; 