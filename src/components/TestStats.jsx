import React, { useState } from 'react';

async function fetchPlayerStats(playerId) {
  try {
    const response = await fetch(
      `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${playerId}/stats`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Raw stats API response:', data);
    console.log('Categories in response:', data.categories);
    
    const formattedStats = {};
    
    // The categories are directly under data.categories
    if (data.categories && Array.isArray(data.categories)) {
      console.log('Processing categories:', data.categories.length);
      data.categories.forEach(category => {
        console.log('Processing category:', category.name);
        console.log('Full category object:', category);
        const categoryName = category.name; // e.g., "rushing", "receiving", "passing"
        const statKeys = category.names; // e.g., ["gamesPlayed", "rushingAttempts", ...]
        const statLabels = category.labels; // e.g., ["GP", "CAR", ...]
        
        formattedStats[categoryName] = [];
        
        // Iterate over each season's statistics in this category
        if (category.statistics && Array.isArray(category.statistics)) {
          console.log(`Found ${category.statistics.length} seasons for ${categoryName}`);
          category.statistics.forEach(seasonStats => {
            const seasonData = {
              season: seasonStats.season?.displayName || 'Unknown',
              team: seasonStats.teamSlug || 'Unknown',
              position: seasonStats.position || undefined,
            };
            
            // Zip the stat keys with the corresponding values
            if (seasonStats.stats && Array.isArray(seasonStats.stats) && statKeys) {
              statKeys.forEach((key, index) => {
                seasonData[key] = seasonStats.stats[index] || '0';
              });
            }
            
            formattedStats[categoryName].push(seasonData);
          });
        } else {
          console.log(`No statistics found for category: ${categoryName}`);
          console.log('Category statistics field:', category.statistics);
        }
      });
    } else {
      console.log('No categories found in response');
    }
    
    console.log('Final formatted stats:', formattedStats);
    return formattedStats;
    
  } catch (error) {
    console.error('Error fetching player stats:', error);
    throw error;
  }
}

export default function TestStats() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testStats = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Test with Davante Adams (ID: 16800) who is an active star player with 12 years experience
      const stats = await fetchPlayerStats('16800');
      console.log('Player Stats Result:', stats);
      setResult(stats);
    } catch (err) {
      console.error('Test failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4">
      <h3 className="text-white font-bold mb-2">Test Player Stats Function</h3>
      <button 
        onClick={testStats}
        disabled={isLoading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test Player Stats'}
      </button>
      
      {error && (
        <div className="mt-2 text-red-400">
          Error: {error}
        </div>
      )}
      
      {result && (
        <div className="mt-2 text-green-400">
          Success! Check console for full results.
          <div className="text-sm text-gray-300 mt-1">
            Categories found: {Object.keys(result).join(', ')}
          </div>
        </div>
      )}
    </div>
  );
} 