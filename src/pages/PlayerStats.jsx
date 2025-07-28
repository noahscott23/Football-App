import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Spinner from '../components/Spinner.jsx';
import FantasyCalculator from '../components/FantasyCalculator.jsx';

const API_BASE_URL = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes';

function PlayerStats() {
  const { id } = useParams();
  const [playerData, setPlayerData] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayerData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch player data');
        }
        
        const data = await response.json();
        
        // gets relevant player information
        const player = {
          id: data.id,
          name: data.fullName,
          position: data.position?.abbreviation || 'Unknown',
          jersey: data.jersey,
          age: data.age,
          height: data.displayHeight,
          weight: data.displayWeight,
          experience: data.experience?.years || 0,
          team: data.team?.displayName || data.team?.name || (data.team?.$ref ? 'Team Info Loading...' : 'Free Agent'),
          image: data.headshot?.href || `https://a.espncdn.com/i/headshots/nfl/players/full/${data.id}.png`
        };

        // fixing team 
        let teamName = 'Free Agent';
        if (data.team && data.team.$ref) {
          try {
            const teamResponse = await fetch(data.team.$ref);
            if (teamResponse.ok) {
              const teamData = await teamResponse.json();
              teamName = teamData.displayName || teamData.name || 'Free Agent';
            }
          } catch (error) {
            console.error('Error fetching team data:', error);
          }
        } else {
          teamName = data.team?.displayName || data.team?.name || 'Free Agent';
        }

        // update player with team name
        const playerWithTeam = {
          ...player,
          team: teamName
        };

        setPlayerData(playerWithTeam);

        // fetch player statistics
        const statsResponse = await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${id}/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setPlayerStats(statsData);
        }
      } catch (err) {
        console.error('Error fetching player data:', err);
        setError('Failed to load player data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPlayerData();
    }
  }, [id]);

  // gets position category for stats display
  const getPositionCategory = (position) => {
    const offensivePositions = ['QB', 'RB', 'WR', 'TE', 'C', 'G', 'T', 'OT', 'OG', 'OL'];
    const defensivePositions = ['DE', 'DT', 'NT', 'LB', 'OLB', 'ILB', 'MLB', 'CB', 'S', 'SS', 'FS', 'DB'];
    const specialTeamsPositions = ['K', 'P', 'LS', 'KR', 'PR', 'PK'];
    
    if (offensivePositions.includes(position)) return 'offensive';
    if (defensivePositions.includes(position)) return 'defensive';
    if (specialTeamsPositions.includes(position)) return 'special';
    
    return 'unknown';
  };

  // function to format stats data
  const formatStatsData = (category) => {
    if (!category || !category.statistics) return null;
    
    const seasons = category.statistics
      .filter(stat => !stat.displayName?.includes('Totals')) 
      .map(stat => ({
        year: stat.season.year,
        team: stat.teamSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        stats: stat.stats,
        position: stat.position
      }));
    
    return {
      labels: category.labels,
      displayNames: category.displayNames,
      seasons,
      totals: category.totals
    };
  };

  if (loading) {
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
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
          <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!playerData) {
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
          <div className="bg-dark-100 p-8 rounded-lg">
            <p className="text-gray-300">Player not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const positionCategory = getPositionCategory(playerData.position);

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
          {/* player header */}
          <div className="bg-dark-100 p-8 rounded-lg mb-8">
            <div className="flex items-center space-x-6">
              <img 
                src={playerData.image}
                alt={playerData.name}
                className="w-32 h-32 rounded-lg object-cover"
                onError={(e) => {
                  e.target.src = '/no-player.png';
                }}
              />
              <div>
                <h3 className="text-3xl font-bold text-white">{playerData.name}</h3>
                <p className="text-xl text-blue-400 font-semibold">
                  #{playerData.jersey} • {playerData.position} • {playerData.team}
                </p>
                <p className="text-gray-300 mt-2">
                  {playerData.height} • {playerData.weight} • Age: {playerData.age} • {playerData.experience} years experience
                </p>
              </div>
            </div>
          </div>

          {/* position info */}
          <div className="bg-dark-100 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-semibold mb-4">Position Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-dark-200 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Position</p>
                <p className="text-lg font-semibold text-white">{playerData.position}</p>
              </div>
              <div className="bg-dark-200 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Category</p>
                <p className="text-lg font-semibold text-white capitalize">{positionCategory}</p>
              </div>
              <div className="bg-dark-200 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Team</p>
                <p className="text-lg font-semibold text-white">{playerData.team}</p>
              </div>
            </div>
          </div>

          {/* calculating fantasy pts */}
          {playerStats && playerStats.categories && (
            <FantasyCalculator playerStats={playerStats} playerData={playerData} />
          )}

          
          <div className="bg-dark-100 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Career Statistics</h3>
            
            {playerStats ? (
              <div className="space-y-6">

                
                {playerStats.categories ? (
                  playerStats.categories.map((category, index) => {
                    const statsData = formatStatsData(category);
                    if (!statsData) return null;
                    
                    // filters out kicking stats for non-kickers/punters
                    if (category.name === 'kicking' && !['K', 'P'].includes(playerData.position)) {
                      return null;
                    }
                    
                    // filters out defensive stats for offensive players
                    if ((category.name === 'defense' || category.name === 'defensive' || category.name === 'tackles') && ['QB', 'RB', 'WR', 'TE', 'C', 'G', 'T', 'OT', 'OG', 'OL'].includes(playerData.position)) {
                      return null;
                    }
                  
                    return (
                      <div key={index} className="bg-dark-200 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-blue-400 mb-4 capitalize">
                          {category.displayName} Statistics
                        </h4>
                        
                        {/* stats by season */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-600">
                                <th className="text-left py-2 px-2">Season</th>
                                <th className="text-left py-2 px-2">Team</th>
                                {statsData.displayNames.map((label, i) => (
                                  <th key={i} className="text-center py-2 px-2 text-gray-300">
                                    {label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {statsData.seasons.map((season, seasonIndex) => (
                                <tr key={seasonIndex} className="border-b border-gray-700 hover:bg-dark-300">
                                  <td className="py-2 px-2 font-semibold">{season.year}</td>
                                  <td className="py-2 px-2 text-gray-300">{season.team}</td>
                                  {season.stats.map((stat, statIndex) => (
                                    <td key={statIndex} className="text-center py-2 px-2">
                                      {stat}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                              
                              {/* totals */}
                              {statsData.totals && statsData.totals.length > 0 && (
                                <tr className="border-t-2 border-blue-500 bg-blue-900/20 font-semibold">
                                  <td className="py-2 px-2">Career</td>
                                  <td className="py-2 px-2 text-gray-300">Totals</td>
                                  {statsData.totals.map((total, totalIndex) => (
                                    <td key={totalIndex} className="text-center py-2 px-2">
                                      {total}
                                    </td>
                                  ))}
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No statistics available for this player.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No statistics available for this player.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default PlayerStats; 