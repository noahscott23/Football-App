import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Load fantasy players data (JSON file for now)
const fantasyPlayersData = JSON.parse(
  readFileSync(join(__dirname, 'src/data/topFantasyPlayers.json'), 'utf8')
);

// Global variables
let allPlayersData = [];
let isPlayersLoaded = false;

// Load all NFL players
const loadAllPlayers = async () => {
  console.log('🔄 Loading all NFL players...');
  
  try {
    const playersResponse = await fetch('https://sports.core.api.espn.com/v3/sports/football/nfl/athletes?limit=20000');
    if (!playersResponse.ok) throw new Error('Failed to fetch players');
    const playersData = await playersResponse.json();
    
    // Filter active players
    allPlayersData = playersData.items.filter(item => 
      item.active !== false && 
      item.fullName && 
      !item.fullName.includes('[') && 
      !item.fullName.includes(']')
    );
    
    // Handle Lamar Jackson duplicate
    allPlayersData = allPlayersData.filter(player => {
      if (player.fullName === "Lamar Jackson") {
        return player.jersey === "8";
      }
      return true;
    });
    
    isPlayersLoaded = true;
    console.log(`✅ Loaded ${allPlayersData.length} players`);
    
  } catch (error) {
    console.error('Error loading players:', error);
    allPlayersData = [];
    isPlayersLoaded = false;
  }
};

// Fantasy scoring settings
const defaultScoringSettings = {
  passingYards: 0.04,
  passingTDs: 4,
  interceptions: -2,
  rushingYards: 0.1,
  rushingTDs: 6,
  fumbles: -2,
  receptions: 1,
  receivingYards: 0.1,
  receivingTDs: 6,
  extraPoints: 1
};

// Calculate fantasy points for a season
const calculateSeasonPoints = (stat, category, scoringSettings = defaultScoringSettings) => {
  if (!stat.stats || !category.labels) return { total: 0, breakdown: {} };
  
  let points = 0;
  let breakdown = {};
  
  const statMap = {};
  category.labels.forEach((label, index) => {
    const value = stat.stats[index];
    statMap[label] = typeof value === 'string' ? value.replace(/,/g, '') : value;
  });

  switch (category.name) {
    case 'passing':
      const passYards = parseFloat(statMap['YDS'] || 0);
      const passTDs = parseFloat(statMap['TD'] || 0);
      const ints = parseFloat(statMap['INT'] || 0);
      
      const passYardPoints = passYards * scoringSettings.passingYards;
      const passTDPoints = passTDs * scoringSettings.passingTDs;
      const intPoints = ints * scoringSettings.interceptions;
      
      points += passYardPoints + passTDPoints + intPoints;
      breakdown = {
        'Passing Yards': passYardPoints,
        'Passing TDs': passTDPoints,
        'Interceptions': intPoints
      };
      break;

    case 'rushing':
      const rushYards = parseFloat(statMap['YDS'] || 0);
      const rushTDs = parseFloat(statMap['TD'] || 0);
      const fumbles = parseFloat(statMap['FUM'] || 0);
      
      const rushYardPoints = rushYards * scoringSettings.rushingYards;
      const rushTDPoints = rushTDs * scoringSettings.rushingTDs;
      const fumblePoints = fumbles * scoringSettings.fumbles;
      
      points += rushYardPoints + rushTDPoints + fumblePoints;
      breakdown = {
        'Rushing Yards': rushYardPoints,
        'Rushing TDs': rushTDPoints,
        'Fumbles': fumblePoints
      };
      break;

    case 'receiving':
      const receptions = parseFloat(statMap['REC'] || 0);
      const recYards = parseFloat(statMap['YDS'] || 0);
      const recTDs = parseFloat(statMap['TD'] || 0);
      
      const recPoints = receptions * scoringSettings.receptions;
      const recYardPoints = recYards * scoringSettings.receivingYards;
      const recTDPoints = recTDs * scoringSettings.receivingTDs;
      
      points += recPoints + recYardPoints + recTDPoints;
      breakdown = {
        'Receptions': recPoints,
        'Receiving Yards': recYardPoints,
        'Receiving TDs': recTDPoints
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

// Calculate total fantasy points for a player
const calculatePlayerFantasyPoints = async (playerId) => {
  try {
    const statsResponse = await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${playerId}/stats`);
    if (!statsResponse.ok) return 0;
    
    const statsData = await statsResponse.json();
    if (!statsData.categories) return 0;
    
    let totalPoints = 0;
    
    statsData.categories.forEach(category => {
      if (category.statistics) {
        category.statistics
          .filter(stat => !stat.displayName?.includes('Totals') && stat.season?.year === 2024)
          .forEach(stat => {
            const result = calculateSeasonPoints(stat, category);
            totalPoints += result.total;
          });
      }
    });

    return Math.round(totalPoints * 100) / 100;
  } catch (error) {
    console.error(`Error calculating fantasy points for player ${playerId}:`, error);
    return 0;
  }
};

// Get detailed player info
const getDetailedPlayerInfo = async (playerId) => {
  try {
    const response = await fetch(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/${playerId}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    
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
    
    return {
      id: data.id,
      name: data.fullName,
      position: data.position?.abbreviation || 'Unknown',
      jersey: data.jersey,
      team: teamName,
      age: data.age,
      height: data.displayHeight,
      weight: data.displayWeight,
      experience: data.experience?.years || 0
    };
  } catch (error) {
    console.error('Error fetching detailed player data:', error);
    return null;
  }
};

// Find player by name
const findPlayerByName = (name) => {
  const nameLower = name.toLowerCase().trim();
  
  // First try JSON data
  const jsonPlayer = Object.values(fantasyPlayersData).find(player => 
    player.name.toLowerCase().includes(nameLower)
  );
  
  if (jsonPlayer) return jsonPlayer;
  
  // Then search all players
  return allPlayersData.find(player => 
    player.fullName.toLowerCase().includes(nameLower)
  );
};

// Find player with detailed info
const findPlayerByNameDetailed = async (name) => {
  const nameLower = name.toLowerCase().trim();
  
  // First try JSON data
  const jsonPlayer = Object.values(fantasyPlayersData).find(player => 
    player.name.toLowerCase().includes(nameLower)
  );
  
  if (jsonPlayer) {
    const basicPlayer = allPlayersData.find(p => p.fullName.toLowerCase().includes(nameLower));
    if (basicPlayer) {
      const detailedInfo = await getDetailedPlayerInfo(basicPlayer.id);
      return {
        ...detailedInfo,
        fantasyPoints: jsonPlayer.fantasyPoints
      };
    }
    return jsonPlayer;
  }
  
  // For players not in JSON, find and calculate
  const basicPlayer = allPlayersData.find(player => 
    player.fullName.toLowerCase().includes(nameLower)
  );
  
  if (!basicPlayer) return null;
  
  console.log(`🔄 Calculating fantasy points for ${basicPlayer.fullName}...`);
  const fantasyPoints = await calculatePlayerFantasyPoints(basicPlayer.id);
  const detailedInfo = await getDetailedPlayerInfo(basicPlayer.id);
  
  return {
    ...detailedInfo,
    fantasyPoints: fantasyPoints
  };
};

// Extract player name from input
const extractPlayerName = (input) => {
  const players = isPlayersLoaded && allPlayersData.length > 0 ? allPlayersData : Object.values(fantasyPlayersData);
  const inputLower = input.toLowerCase();
  
  for (const player of players) {
    const playerName = player.fullName || player.name;
    if (playerName && inputLower.includes(playerName.toLowerCase())) {
      return playerName;
    }
  }
  
  return null;
};

// Extract multiple player names
const extractPlayerNames = (input) => {
  const players = isPlayersLoaded && allPlayersData.length > 0 ? allPlayersData : Object.values(fantasyPlayersData);
  const foundPlayers = [];
  const inputLower = input.toLowerCase();
  
  for (const player of players) {
    const playerName = player.fullName || player.name;
    if (playerName && inputLower.includes(playerName.toLowerCase())) {
      foundPlayers.push(playerName);
    }
  }
  
  return [...new Set(foundPlayers)].slice(0, 2);
};

// Get player info
const getPlayerInfo = async (playerName) => {
  const player = await findPlayerByNameDetailed(playerName);
  
  if (!player) {
    return `I couldn't find "${playerName}" in my database. Please check the spelling and try again.`;
  }
  
  let response = `🏈 ${player.name}\n\n`;
  response += `📊 Player Info:\n`;
  response += `• Position: ${player.position}\n`;
  response += `• Team: ${player.team}\n`;
  response += `• Jersey: #${player.jersey}\n`;
  response += `• Age: ${player.age} • ${player.height} • ${player.weight}\n`;
  response += `• Experience: ${player.experience} years\n`;
  response += `• Fantasy Points: ${player.fantasyPoints.toFixed(2)}\n\n`;
  
  // Simple recommendation based on fantasy points
  if (player.fantasyPoints >= 300) {
    response += `🔥 Recommendation: Must-start player!`;
  } else if (player.fantasyPoints >= 200) {
    response += `💪 Recommendation: Strong starter`;
  } else if (player.fantasyPoints >= 100) {
    response += `📊 Recommendation: Flex option`;
  } else if (player.fantasyPoints > 0) {
    response += `📋 Recommendation: Bench/depth player`;
  } else {
    response += `📋 Recommendation: Deep league option`;
  }
  
  return response;
};

// Compare players
const comparePlayers = async (player1Name, player2Name) => {
  const player1 = await findPlayerByNameDetailed(player1Name);
  const player2 = await findPlayerByNameDetailed(player2Name);
  
  if (!player1 || !player2) {
    return "I couldn't find one or both players in my database. Please check the spelling and try again.";
  }
  
  let response = `🏈 ${player1Name} vs ${player2Name}\n\n`;
  
  response += `${player1Name} (${player1.position} - ${player1.team}):\n`;
  response += `• Fantasy Points: ${player1.fantasyPoints.toFixed(2)}\n\n`;
  
  response += `${player2Name} (${player2.position} - ${player2.team}):\n`;
  response += `• Fantasy Points: ${player2.fantasyPoints.toFixed(2)}\n\n`;
  
  if (player1.fantasyPoints > player2.fantasyPoints) {
    response += `🏆 Winner: ${player1Name} (+${(player1.fantasyPoints - player2.fantasyPoints).toFixed(2)} points)`;
  } else if (player2.fantasyPoints > player1.fantasyPoints) {
    response += `🏆 Winner: ${player2Name} (+${(player2.fantasyPoints - player1.fantasyPoints).toFixed(2)} points)`;
  } else {
    response += `🤝 Tie: Both players have ${player1.fantasyPoints.toFixed(2)} fantasy points`;
  }
  
  return response;
};

// Recommend players by position
const recommendPlayersByPosition = (position, count) => {
  const players = Object.values(fantasyPlayersData)
    .filter(player => player.position === position)
    .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
    .slice(0, count);
  
  let response = `Top ${position} recommendations:\n\n`;
  players.forEach((player, index) => {
    response += `${index + 1}. ${player.name} (${player.team})\n`;
    response += `   Fantasy Points: ${player.fantasyPoints.toFixed(2)}\n\n`;
  });
  
  return response;
};

// Recommend top players
const recommendTopPlayers = (count) => {
  const players = Object.values(fantasyPlayersData)
    .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
    .slice(0, count);
  
  let response = `Top ${count} fantasy players:\n\n`;
  players.forEach((player, index) => {
    response += `${index + 1}. ${player.name} (${player.position} - ${player.team})\n`;
    response += `   Fantasy Points: ${player.fantasyPoints.toFixed(2)}\n\n`;
  });
  
  return response;
};

// Get fantasy advice
const getFantasyAdvice = () => {
  const players = Object.values(fantasyPlayersData);
  const topQB = players.filter(p => p.position === 'QB').sort((a, b) => b.fantasyPoints - a.fantasyPoints)[0];
  const topRB = players.filter(p => p.position === 'RB').sort((a, b) => b.fantasyPoints - a.fantasyPoints)[0];
  const topWR = players.filter(p => p.position === 'WR').sort((a, b) => b.fantasyPoints - a.fantasyPoints)[0];
  
  return `🏈 Fantasy Football Advice\n\n` +
         `🔥 Must-Start Players:\n` +
         `• QB: ${topQB.name} (${topQB.fantasyPoints.toFixed(2)} pts)\n` +
         `• RB: ${topRB.name} (${topRB.fantasyPoints.toFixed(2)} pts)\n` +
         `• WR: ${topWR.name} (${topWR.fantasyPoints.toFixed(2)} pts)\n\n` +
         `💡 Strategy Tips:\n` +
         `• Target high-scoring QBs early\n` +
         `• Look for RBs with dual-threat ability\n` +
         `• WRs with consistent targets are gold\n` +
         `• Don't forget about TEs in the middle rounds`;
};

// Get help message
const getHelpMessage = () => {
  return `🏈 NFL Fantasy Assistant - How I Can Help\n\n` +
         `📋 Available Commands:\n` +
         `• "Recommend me a QB/RB/WR/TE"\n` +
         `• "Compare [Player A] and [Player B]"\n` +
         `• "Tell me about [Player Name]"\n` +
         `• "Give me fantasy advice"\n` +
         `• "Top 5 QBs/RBs/WRs/TEs"\n` +
         `• Just type a player name\n\n` +
         `💡 Examples:\n` +
         `• "Recommend me a QB"\n` +
         `• "Compare Lamar Jackson and Josh Allen"\n` +
         `• "Tell me about Christian McCaffrey"\n` +
         `• "Lamar Jackson"`;
};

// Get default response
const getDefaultResponse = () => {
  return `🏈 Hi! I'm your NFL Fantasy Assistant. I can help you with:\n\n` +
         `• Player recommendations and rankings\n` +
         `• Player comparisons and analysis\n` +
         `• Fantasy strategy and advice\n\n` +
         `Try asking: "Recommend me a QB" or "Compare Lamar Jackson and Josh Allen" or just type a player name!`;
};

// Main response handler
const getLocalResponse = async (input) => {
  const inputLower = input.toLowerCase().trim();
  
  // Player recommendations
  if (input.includes('recommend') || input.includes('suggest')) {
    if (input.includes('qb') || input.includes('quarterback')) {
      return recommendPlayersByPosition('QB', 3);
    } else if (input.includes('rb') || input.includes('running back')) {
      return recommendPlayersByPosition('RB', 3);
    } else if (input.includes('wr') || input.includes('wide receiver')) {
      return recommendPlayersByPosition('WR', 3);
    } else if (input.includes('te') || input.includes('tight end')) {
      return recommendPlayersByPosition('TE', 3);
    } else {
      return recommendTopPlayers(5);
    }
  }
  
  // Player comparisons
  if (input.includes('compare') || input.includes('vs') || input.includes('versus')) {
    const players = extractPlayerNames(input);
    if (players.length >= 2) {
      return await comparePlayers(players[0], players[1]);
    } else {
      return "Please specify two players to compare. Example: 'Compare Lamar Jackson and Josh Allen'";
    }
  }
  
  // Specific player questions
  if (input.includes('who is') || input.includes('tell me about') || input.includes('info about')) {
    const playerName = extractPlayerName(input);
    if (playerName) {
      return await getPlayerInfo(playerName);
    }
  }
  
  // Fantasy advice
  if (input.includes('fantasy') || input.includes('advice') || input.includes('strategy')) {
    return getFantasyAdvice();
  }
  
  // Top players
  if (input.includes('top') || input.includes('best') || input.includes('rankings')) {
    if (input.includes('qb') || input.includes('quarterback')) {
      return recommendPlayersByPosition('QB', 5);
    } else if (input.includes('rb') || input.includes('running back')) {
      return recommendPlayersByPosition('RB', 5);
    } else if (input.includes('wr') || input.includes('wide receiver')) {
      return recommendPlayersByPosition('WR', 5);
    } else if (input.includes('te') || input.includes('tight end')) {
      return recommendPlayersByPosition('TE', 5);
    } else {
      return recommendTopPlayers(10);
    }
  }
  
  // Help
  if (input.includes('help') || input.includes('what can you do')) {
    return getHelpMessage();
  }
  
  // Just a player name
  const playerName = extractPlayerName(input);
  if (playerName) {
    return await getPlayerInfo(playerName);
  }
  
  // Default response
  return getDefaultResponse();
};

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  console.log('Received message:', message);

  try {
    const response = await getLocalResponse(message);
    
    console.log('Local response generated');
    res.json({ 
      reply: response,
      success: true 
    });
  } catch (err) {
    console.error('Error generating response:', err.message);
    
    res.json({ 
      reply: "Sorry, I'm having trouble processing your request right now. Try asking about player recommendations, comparisons, or fantasy advice!",
      success: false,
      error: 'Local response generation failed'
    });
  }
});

// Debug endpoint
app.get('/api/debug/player/:name', async (req, res) => {
  const playerName = req.params.name;
  const player = await findPlayerByNameDetailed(playerName);
  
  if (player) {
    res.json({
      player: player,
      totalPlayers: allPlayersData.length,
      jsonPlayersCount: Object.keys(fantasyPlayersData).length
    });
  } else {
    res.json({ error: 'Player not found' });
  }
});

// Initialize data
const initializeApiData = async () => {
  console.log('🔄 Initializing NFL data...');
  
  try {
    await loadAllPlayers();
    console.log(`✅ Ready to serve:`);
    console.log(`   • ${allPlayersData.length} searchable players`);
    console.log(`   • ${Object.keys(fantasyPlayersData).length} top fantasy players (pre-calculated)`);
    console.log(`   • Fantasy points calculated on-demand for other players`);
    
  } catch (error) {
    console.error('❌ Failed to initialize data:', error);
  }
};

const PORT = 5000;

app.listen(PORT, async () => {
  console.log(`🚀 NFL Fantasy Assistant Server running on port ${PORT}`);
  console.log(`📊 Loaded ${Object.keys(fantasyPlayersData).length} fantasy players from JSON`);
  console.log(`🤖 Local AI responses enabled - no external API needed!`);
  
  await initializeApiData();
}); 
