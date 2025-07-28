import React, { useState, useEffect } from 'react';

const FantasyCalculator = ({ playerStats, playerData }) => {
  const [scoringSettings, setScoringSettings] = useState({
    // Passing
    passingYards: 0.04,
    passingTDs: 4,
    interceptions: -2,
    
    // Rushing
    rushingYards: 0.1,
    rushingTDs: 6,
    fumbles: -2,
    
    // Receiving
    receptions: 1, // 1 for PPR (default), 0.5 for half-PPR, 0 for non-PPR
    receivingYards: 0.1,
    receivingTDs: 6,
    
    // Kicking
    fieldGoals: {
      '0-19': 3,
      '20-29': 3,
      '30-39': 3,
      '40-49': 4,
      '50+': 5
    },
    extraPoints: 1
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showFantasyPoints, setShowFantasyPoints] = useState(false);
  const [fantasyPoints, setFantasyPoints] = useState({});
  const [selectedPreset, setSelectedPreset] = useState('ppr'); // track selected preset

  // calculate fantasy points for a season with breakdown
  const calculateSeasonPoints = (stat, category) => {
    if (!stat.stats || !category.labels) return { total: 0, breakdown: {} };
    
    let points = 0;
    let breakdown = {};
    
    // map stats to their labels
    const statMap = {};
    category.labels.forEach((label, index) => {     // remove commas from numbers before storing
      const value = stat.stats[index];
      statMap[label] = typeof value === 'string' ? value.replace(/,/g, '') : value;
    });

    switch (category.name) {
      case 'passing':
        const passingYards = parseFloat(statMap['YDS'] || 0);
        const passingTDs = parseFloat(statMap['TD'] || 0);
        const interceptions = parseFloat(statMap['INT'] || 0);
        
        const passingYardsPoints = passingYards * scoringSettings.passingYards;
        const passingTDPoints = passingTDs * scoringSettings.passingTDs;
        const intPoints = interceptions * scoringSettings.interceptions;
        
        points += passingYardsPoints + passingTDPoints + intPoints;
        breakdown = {
          'Passing Yards': passingYardsPoints,
          'Passing TDs': passingTDPoints,
          'Interceptions': intPoints
        };
        break;

      case 'rushing':
        const rushingYards = parseFloat(statMap['YDS'] || 0);
        const rushingTDs = parseFloat(statMap['TD'] || 0);
        const fumbles = parseFloat(statMap['FUM'] || 0);
        
        const rushingYardsPoints = rushingYards * scoringSettings.rushingYards;
        const rushingTDPoints = rushingTDs * scoringSettings.rushingTDs;
        const fumblePoints = fumbles * scoringSettings.fumbles;
        
        points += rushingYardsPoints + rushingTDPoints + fumblePoints;
        breakdown = {
          'Rushing Yards': rushingYardsPoints,
          'Rushing TDs': rushingTDPoints,
          'Fumbles': fumblePoints
        };
        break;

      case 'receiving':
        const receptions = parseFloat(statMap['REC'] || 0);
        const receivingYards = parseFloat(statMap['YDS'] || 0);
        const receivingTDs = parseFloat(statMap['TD'] || 0);
        
        const receptionPoints = receptions * scoringSettings.receptions;
        const receivingYardsPoints = receivingYards * scoringSettings.receivingYards;
        const receivingTDPoints = receivingTDs * scoringSettings.receivingTDs;
        
        points += receptionPoints + receivingYardsPoints + receivingTDPoints;
        breakdown = {
          'Receptions': receptionPoints,
          'Receiving Yards': receivingYardsPoints,
          'Receiving TDs': receivingTDPoints
        };
        break;

      case 'kicking':
        const fieldGoals = parseFloat(statMap['FG'] || 0);
        const extraPoints = parseFloat(statMap['XPM'] || 0);
        
        const fgPoints = fieldGoals * 3.5;
        const xpPoints = extraPoints * scoringSettings.extraPoints;
        
        points += fgPoints + xpPoints;
        breakdown = {
          'Field Goals': fgPoints,
          'Extra Points': xpPoints
        };
        break;
    }

    return { 
      total: Math.round(points * 100) / 100,
      breakdown: Object.fromEntries(
        Object.entries(breakdown).map(([key, value]) => [key, Math.round(value * 100) / 100])
      )
    };
  };

  // calculate fantasy points for all seasons
  useEffect(() => {
    if (!playerStats || !playerStats.categories) return;

    const points = {};
    
    // group all stats by season and team
    const seasonMap = {};
    
    playerStats.categories.forEach(category => {
      if (category.statistics) {
        category.statistics
          .filter(stat => !stat.displayName?.includes('Totals')) // skip total rows
          .forEach(stat => {
            const year = stat.season.year;
            const team = stat.teamSlug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
            const key = `${year}-${team}`;
            
            if (!seasonMap[key]) {
              seasonMap[key] = {
                year,
                team,
                totalPoints: 0,
                breakdown: {}
              };
            }
            
            const result = calculateSeasonPoints(stat, category);
            seasonMap[key].totalPoints += result.total;
            
            // merge breakdowns
            Object.entries(result.breakdown).forEach(([categoryKey, value]) => {
              if (value !== 0) {
                seasonMap[key].breakdown[categoryKey] = (seasonMap[key].breakdown[categoryKey] || 0) + value;
              }
            });
          });
      }
    });

    // convert to array and sort by year
    const combinedPoints = Object.values(seasonMap).sort((a, b) => b.year - a.year);
    
    // round breakdown values
    combinedPoints.forEach(season => {
      Object.keys(season.breakdown).forEach(key => {
        season.breakdown[key] = Math.round(season.breakdown[key] * 100) / 100;
      });
    });
    
    setFantasyPoints({ combined: combinedPoints });
  }, [playerStats, scoringSettings]); // recalculate when stats or settings change

  const updateScoringSetting = (category, value) => {
    setScoringSettings(prev => ({
      ...prev,
      [category]: parseFloat(value) || 0
    }));
  };

  const applyPreset = (preset) => {
    setSelectedPreset(preset); // update selected preset
    switch (preset) {
      case 'ppr':
        setScoringSettings({
          ...scoringSettings,
          receptions: 1
        });
        break;
      case 'half-ppr':
        setScoringSettings({
          ...scoringSettings,
          receptions: 0.5
        });
        break;
      case 'non-ppr':
        setScoringSettings({
          ...scoringSettings,
          receptions: 0
        });
        break;
    }
  }; // apply common fantasy scoring presets

  return (
    <div className="bg-dark-100 p-6 rounded-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Fantasy Points Calculator</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFantasyPoints(!showFantasyPoints)}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm"
          >
            {showFantasyPoints ? 'Hide Fantasy Points' : 'Show Fantasy Points'}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
          >
            {showSettings ? 'Hide Settings' : 'Scoring Settings'}
          </button>
        </div>
      </div>

      {/* Preset Buttons - Always Visible */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => applyPreset('ppr')}
          className={`px-3 py-1 rounded text-sm ${
            selectedPreset === 'ppr' 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          PPR
        </button>
        <button
          onClick={() => applyPreset('half-ppr')}
          className={`px-3 py-1 rounded text-sm ${
            selectedPreset === 'half-ppr' 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          Half PPR
        </button>
        <button
          onClick={() => applyPreset('non-ppr')}
          className={`px-3 py-1 rounded text-sm ${
            selectedPreset === 'non-ppr' 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          Non-PPR
        </button>
      </div>

      {/* Scoring Settings Panel */}
      {showSettings && (
        <div className="bg-dark-200 p-4 rounded-lg mb-4">
          <h4 className="text-lg font-semibold mb-4">Scoring Settings</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Passing Settings */}
            <div>
              <h5 className="font-semibold mb-2">Passing</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm">Passing Yards:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={scoringSettings.passingYards}
                    onChange={(e) => updateScoringSetting('passingYards', e.target.value)}
                    className="w-20 bg-dark-300 px-2 py-1 rounded text-sm"
                  />
                </div>
                <div className="flex justify-between">
                  <label className="text-sm">Passing TDs:</label>
                  <input
                    type="number"
                    value={scoringSettings.passingTDs}
                    onChange={(e) => updateScoringSetting('passingTDs', e.target.value)}
                    className="w-20 bg-dark-300 px-2 py-1 rounded text-sm"
                  />
                </div>
                <div className="flex justify-between">
                  <label className="text-sm">Interceptions:</label>
                  <input
                    type="number"
                    value={scoringSettings.interceptions}
                    onChange={(e) => updateScoringSetting('interceptions', e.target.value)}
                    className="w-20 bg-dark-300 px-2 py-1 rounded text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Rushing Settings */}
            <div>
              <h5 className="font-semibold mb-2">Rushing</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm">Rushing Yards:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={scoringSettings.rushingYards}
                    onChange={(e) => updateScoringSetting('rushingYards', e.target.value)}
                    className="w-20 bg-dark-300 px-2 py-1 rounded text-sm"
                  />
                </div>
                <div className="flex justify-between">
                  <label className="text-sm">Rushing TDs:</label>
                  <input
                    type="number"
                    value={scoringSettings.rushingTDs}
                    onChange={(e) => updateScoringSetting('rushingTDs', e.target.value)}
                    className="w-20 bg-dark-300 px-2 py-1 rounded text-sm"
                  />
                </div>
                <div className="flex justify-between">
                  <label className="text-sm">Fumbles:</label>
                  <input
                    type="number"
                    value={scoringSettings.fumbles}
                    onChange={(e) => updateScoringSetting('fumbles', e.target.value)}
                    className="w-20 bg-dark-300 px-2 py-1 rounded text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Receiving Settings */}
            <div>
              <h5 className="font-semibold mb-2">Receiving</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm">Receptions:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={scoringSettings.receptions}
                    onChange={(e) => updateScoringSetting('receptions', e.target.value)}
                    className="w-20 bg-dark-300 px-2 py-1 rounded text-sm"
                  />
                </div>
                <div className="flex justify-between">
                  <label className="text-sm">Receiving Yards:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={scoringSettings.receivingYards}
                    onChange={(e) => updateScoringSetting('receivingYards', e.target.value)}
                    className="w-20 bg-dark-300 px-2 py-1 rounded text-sm"
                  />
                </div>
                <div className="flex justify-between">
                  <label className="text-sm">Receiving TDs:</label>
                  <input
                    type="number"
                    value={scoringSettings.receivingTDs}
                    onChange={(e) => updateScoringSetting('receivingTDs', e.target.value)}
                    className="w-20 bg-dark-300 px-2 py-1 rounded text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fantasy Points Results */}
      {showFantasyPoints && (
        <div className="space-y-4">
          {fantasyPoints.combined && (
            <div className="bg-dark-200 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-blue-400 mb-3">
                Combined Fantasy Points
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-2 px-2">Season</th>
                      <th className="text-left py-2 px-2">Team</th>
                      <th className="text-left py-2 px-2">Breakdown</th>
                      <th className="text-center py-2 px-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fantasyPoints.combined.map((season, index) => (
                      <tr key={index} className="border-b border-gray-700 hover:bg-dark-300">
                        <td className="py-2 px-2 font-semibold">{season.year}</td>
                        <td className="py-2 px-2 text-gray-300">{season.team}</td>
                        <td className="py-2 px-2">
                          <div className="space-y-1">
                            {Object.entries(season.breakdown).map(([category, points]) => (
                              <div key={category} className="text-xs">
                                <span className="text-gray-400">{category}:</span>
                                <span className={`ml-1 ${points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {points}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="text-center py-2 px-2 font-semibold text-green-400">
                          {Math.round(season.totalPoints * 100) / 100}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FantasyCalculator; 