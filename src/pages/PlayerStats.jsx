import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Spinner from '../components/Spinner.jsx';

const API_BASE_URL = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes';

function PlayerStats() {
  const { id } = useParams();
  const [playerData, setPlayerData] = useState(null);
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
        
        // Extract relevant player information
        const player = {
          id: data.id,
          name: data.fullName,
          position: data.position?.abbreviation || 'Unknown',
          jersey: data.jersey,
          age: data.age,
          height: data.displayHeight,
          weight: data.displayWeight,
          experience: data.experience?.years || 0,
          team: data.team?.name || 'Free Agent',
          image: data.headshot?.href || `https://a.espncdn.com/i/headshots/nfl/players/full/${data.id}.png`
        };

        setPlayerData(player);
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

  // Determine position category for stats display
  const getPositionCategory = (position) => {
    const offensivePositions = ['QB', 'RB', 'WR', 'TE', 'C', 'G', 'T', 'OT', 'OG', 'OL'];
    const defensivePositions = ['DE', 'DT', 'NT', 'LB', 'OLB', 'ILB', 'MLB', 'CB', 'S', 'SS', 'FS', 'DB'];
    const specialTeamsPositions = ['K', 'P', 'LS', 'KR', 'PR'];
    
    if (offensivePositions.includes(position)) return 'offensive';
    if (defensivePositions.includes(position)) return 'defensive';
    if (specialTeamsPositions.includes(position)) return 'special';
    
    return 'unknown';
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
          {/* Player Header */}
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

          {/* Position Information */}
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

          {/* Stats Section - Position Preview */}
          <div className="bg-dark-100 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Statistics Preview</h3>
            <p className="text-gray-300 mb-4">
              The following statistics will be displayed for {playerData.position} players:
            </p>
            
            {positionCategory === 'offensive' && (
              <div className="space-y-4">
                {playerData.position === 'QB' && (
                  <div className="bg-dark-200 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-400 mb-2">Quarterback Stats</h4>
                    <ul className="text-gray-300 space-y-1">
                      <li>• Passing Yards</li>
                      <li>• Passing Touchdowns</li>
                      <li>• Interceptions</li>
                      <li>• Completion Percentage</li>
                      <li>• Passer Rating</li>
                      <li>• Rushing Yards</li>
                      <li>• Rushing Touchdowns</li>
                    </ul>
                  </div>
                )}
                
                {playerData.position === 'RB' && (
                  <div className="bg-dark-200 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-400 mb-2">Running Back Stats</h4>
                    <ul className="text-gray-300 space-y-1">
                      <li>• Rushing Yards</li>
                      <li>• Rushing Touchdowns</li>
                      <li>• Yards Per Carry</li>
                      <li>• Receptions</li>
                      <li>• Receiving Yards</li>
                      <li>• Receiving Touchdowns</li>
                      <li>• Fumbles</li>
                    </ul>
                  </div>
                )}
                
                {playerData.position === 'WR' && (
                  <div className="bg-dark-200 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-400 mb-2">Wide Receiver Stats</h4>
                    <ul className="text-gray-300 space-y-1">
                      <li>• Receptions</li>
                      <li>• Receiving Yards</li>
                      <li>• Receiving Touchdowns</li>
                      <li>• Yards Per Reception</li>
                      <li>• Targets</li>
                      <li>• Catch Percentage</li>
                      <li>• Longest Reception</li>
                    </ul>
                  </div>
                )}
                
                {playerData.position === 'TE' && (
                  <div className="bg-dark-200 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-400 mb-2">Tight End Stats</h4>
                    <ul className="text-gray-300 space-y-1">
                      <li>• Receptions</li>
                      <li>• Receiving Yards</li>
                      <li>• Receiving Touchdowns</li>
                      <li>• Yards Per Reception</li>
                      <li>• Targets</li>
                      <li>• Blocking Grades</li>
                      <li>• Red Zone Targets</li>
                    </ul>
                  </div>
                )}
                
                {['C', 'G', 'T', 'OT', 'OG', 'OL'].includes(playerData.position) && (
                  <div className="bg-dark-200 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-400 mb-2">Offensive Line Stats</h4>
                    <ul className="text-gray-300 space-y-1">
                      <li>• Games Started</li>
                      <li>• Sacks Allowed</li>
                      <li>• Penalties</li>
                      <li>• Blocking Grades</li>
                      <li>• Run Blocking</li>
                      <li>• Pass Protection</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {positionCategory === 'defensive' && (
              <div className="space-y-4">
                {['DE', 'DT', 'NT'].includes(playerData.position) && (
                  <div className="bg-dark-200 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-red-400 mb-2">Defensive Line Stats</h4>
                    <ul className="text-gray-300 space-y-1">
                      <li>• Tackles</li>
                      <li>• Sacks</li>
                      <li>• Tackles for Loss</li>
                      <li>• QB Hits</li>
                      <li>• Forced Fumbles</li>
                      <li>• Fumble Recoveries</li>
                      <li>• Pass Deflections</li>
                    </ul>
                  </div>
                )}
                
                {['LB', 'OLB', 'ILB', 'MLB'].includes(playerData.position) && (
                  <div className="bg-dark-200 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-red-400 mb-2">Linebacker Stats</h4>
                    <ul className="text-gray-300 space-y-1">
                      <li>• Tackles</li>
                      <li>• Sacks</li>
                      <li>• Tackles for Loss</li>
                      <li>• Interceptions</li>
                      <li>• Pass Deflections</li>
                      <li>• Forced Fumbles</li>
                      <li>• QB Hits</li>
                    </ul>
                  </div>
                )}
                
                {['CB', 'S', 'SS', 'FS', 'DB'].includes(playerData.position) && (
                  <div className="bg-dark-200 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-red-400 mb-2">Defensive Back Stats</h4>
                    <ul className="text-gray-300 space-y-1">
                      <li>• Tackles</li>
                      <li>• Interceptions</li>
                      <li>• Pass Deflections</li>
                      <li>• Forced Fumbles</li>
                      <li>• Fumble Recoveries</li>
                      <li>• Touchdowns</li>
                      <li>• Coverage Rating</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {positionCategory === 'special' && (
              <div className="space-y-4">
                {playerData.position === 'K' && (
                  <div className="bg-dark-200 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-yellow-400 mb-2">Kicker Stats</h4>
                    <ul className="text-gray-300 space-y-1">
                      <li>• Field Goals Made</li>
                      <li>• Field Goal Attempts</li>
                      <li>• Field Goal Percentage</li>
                      <li>• Longest Field Goal</li>
                      <li>• Extra Points Made</li>
                      <li>• Extra Point Attempts</li>
                      <li>• Touchbacks</li>
                    </ul>
                  </div>
                )}
                
                {playerData.position === 'P' && (
                  <div className="bg-dark-200 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-yellow-400 mb-2">Punter Stats</h4>
                    <ul className="text-gray-300 space-y-1">
                      <li>• Punts</li>
                      <li>• Average Yards Per Punt</li>
                      <li>• Longest Punt</li>
                      <li>• Punts Inside 20</li>
                      <li>• Touchbacks</li>
                      <li>• Net Average</li>
                    </ul>
                  </div>
                )}
                
                {['KR', 'PR'].includes(playerData.position) && (
                  <div className="bg-dark-200 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-yellow-400 mb-2">Return Specialist Stats</h4>
                    <ul className="text-gray-300 space-y-1">
                      <li>• Return Attempts</li>
                      <li>• Return Yards</li>
                      <li>• Average Return</li>
                      <li>• Longest Return</li>
                      <li>• Touchdowns</li>
                      <li>• Fair Catches</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {positionCategory === 'unknown' && (
              <div className="bg-dark-200 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-400 mb-2">General Stats</h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• Games Played</li>
                  <li>• Games Started</li>
                  <li>• Team Information</li>
                  <li>• Season Statistics</li>
                </ul>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default PlayerStats; 