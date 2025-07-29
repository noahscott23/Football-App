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

// Global variables to store comprehensive data
let apiPlayersData = [];
let teamsData = new Map();

// Initialize comprehensive data on server start
const initializeApiData = async () => {
  console.log('🔄 Initializing comprehensive API data...');
  const data = await fetchAllData();
  teamsData = data.teams;
  apiPlayersData = data.players;
  console.log(`✅ Comprehensive data initialized with ${apiPlayersData.length} players and ${teamsData.size} teams`);
};

// Comprehensive data fetching system
const fetchAllData = async () => {
  try {
    console.log('🔄 Fetching comprehensive NFL data...');
    
    // Fetch teams first
    const teamsResponse = await fetch('https://sports.core.api.espn.com/v3/sports/football/nfl/teams?limit=50');
    if (!teamsResponse.ok) throw new Error('Failed to fetch teams');
    const teamsData = await teamsResponse.json();
    
    // Create teams map for quick lookup
    const teamsMap = new Map();
    teamsData.items.forEach(team => {
      teamsMap.set(team.id, {
        id: team.id,
        name: team.displayName,
        abbreviation: team.abbreviation,
        location: team.location,
        nickname: team.nickname
      });
    });
    
    console.log(`📊 Loaded ${teamsMap.size} teams`);
    
    // Fetch all players
    const playersResponse = await fetch('https://sports.core.api.espn.com/v3/sports/football/nfl/athletes?limit=20000');
    if (!playersResponse.ok) throw new Error('Failed to fetch players');
    const playersData = await playersResponse.json();
    
    // Filter active players with valid names
    const allPlayers = playersData.items.filter(item => 
      item.active !== false && 
      item.fullName && 
      !item.fullName.includes('[') && 
      !item.fullName.includes(']')
    );
    
    console.log(`📊 Loaded ${allPlayers.length} total players`);
    
    // Create fantasy data map
    const fantasyDataMap = {};
    Object.values(fantasyPlayersData).forEach(player => {
      fantasyDataMap[player.name] = player;
    });
    
    // Get players with fantasy points (these are the ones we need detailed info for)
    const playersWithFantasyPoints = allPlayers.filter(player => fantasyDataMap[player.fullName]);
    console.log(`📊 Found ${playersWithFantasyPoints.length} players with fantasy points`);
    
    // Fetch detailed player data for players with fantasy points
    const detailedPlayers = [];
    for (let i = 0; i < playersWithFantasyPoints.length; i++) {
      const player = playersWithFantasyPoints[i];
      try {
        // Fetch individual player details
        const playerResponse = await fetch(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/${player.id}`);
        if (playerResponse.ok) {
          const playerDetails = await playerResponse.json();
          
          // Get team info
          let teamName = 'Free Agent';
          if (playerDetails.team && playerDetails.team.$ref) {
            try {
              const teamResponse = await fetch(playerDetails.team.$ref);
              if (teamResponse.ok) {
                const teamData = await teamResponse.json();
                teamName = teamData.displayName || teamData.name || 'Free Agent';
              }
            } catch (error) {
              console.error(`Error fetching team data for ${player.fullName}:`, error);
            }
          } else {
            teamName = playerDetails.team?.displayName || playerDetails.team?.name || 'Free Agent';
          }
          
          const fantasyData = fantasyDataMap[player.fullName];
          detailedPlayers.push({
            id: player.id,
            name: player.fullName,
            displayName: player.displayName,
            jersey: player.jersey,
            position: playerDetails.position?.abbreviation || 'Unknown',
            team: teamName,
            teamAbbreviation: playerDetails.team?.abbreviation || 'Unknown',
            fantasyPoints: fantasyData ? fantasyData.fantasyPoints : 0,
            originalData: playerDetails
          });
        }
        
        // Log progress every 10 players
        if ((i + 1) % 10 === 0) {
          console.log(`📊 Processed ${i + 1}/${playersWithFantasyPoints.length} players with fantasy points`);
        }
      } catch (error) {
        console.error(`Error fetching details for ${player.fullName}:`, error);
        // Fallback to basic data
        const fantasyData = fantasyDataMap[player.fullName];
        detailedPlayers.push({
          id: player.id,
          name: player.fullName,
          displayName: player.displayName,
          jersey: player.jersey,
          position: 'Unknown',
          team: 'Unknown',
          teamAbbreviation: 'Unknown',
          fantasyPoints: fantasyData ? fantasyData.fantasyPoints : 0,
          originalData: player
        });
      }
    }
    
    console.log(`✅ Successfully fetched detailed data for ${detailedPlayers.length} players`);
    
    // Handle duplicate Lamar Jackson (keep jersey #8)
    const deduplicatedPlayers = detailedPlayers.filter(player => {
      if (player.name === "Lamar Jackson") {
        return player.jersey === "8";
      }
      return true;
    });
    
    // Sort by fantasy points (highest first)
    const sortedPlayers = deduplicatedPlayers.sort((a, b) => b.fantasyPoints - a.fantasyPoints);
    
    console.log(`✅ Comprehensive data loaded:`);
    console.log(`   • ${teamsMap.size} teams`);
    console.log(`   • ${sortedPlayers.length} players`);
    console.log(`   • ${sortedPlayers.filter(p => p.fantasyPoints > 0).length} players with fantasy points`);
    
    return {
      teams: teamsMap,
      players: sortedPlayers
    };
    
  } catch (error) {
    console.error('Error fetching comprehensive data:', error);
    console.log('Falling back to JSON file data');
    return {
      teams: new Map(),
      players: Object.values(fantasyPlayersData)
    };
  }
};

// Enhanced local response handler with comprehensive logic
const getLocalResponse = (message) => {
  const input = message.toLowerCase();
  
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
      return comparePlayers(players[0], players[1]);
    } else {
      return "Please specify two players to compare. Example: 'Compare Lamar Jackson and Josh Allen' or 'Lamar Jackson vs Josh Allen'";
    }
  }
  
  // Specific player questions
  if (input.includes('who is') || input.includes('tell me about') || input.includes('info about')) {
    const playerName = extractPlayerName(input);
    if (playerName) {
      return getPlayerInfo(playerName);
    }
  }
  
  // Fantasy advice
  if (input.includes('fantasy') || input.includes('advice') || input.includes('strategy')) {
    return getFantasyAdvice();
  }
  
  // Draft strategy
  if (input.includes('draft') || input.includes('drafting')) {
    return getDraftStrategy();
  }
  
  // Start/sit recommendations
  if (input.includes('start') || input.includes('sit')) {
    return getStartSitAdvice();
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
  
  // input is just a player name
  const playerName = extractPlayerName(input);
  if (playerName) {
    return getPlayerInfo(playerName);
  }
  
  // Default response
  return getDefaultResponse();
};

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  console.log('Received message:', message);

  try {
    // Use local response handler
    const response = getLocalResponse(message);
    
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

// Debug endpoint to check data
app.get('/api/debug/player/:name', (req, res) => {
  const playerName = req.params.name;
  const player = findPlayerByName(playerName);
  
  if (player) {
    res.json({
      player: player,
      totalPlayers: apiPlayersData.length,
      teamsCount: teamsData.size
    });
  } else {
    res.json({ error: 'Player not found' });
  }
});

// Enhanced helper functions
const extractPlayerNames = (input) => {
  const players = apiPlayersData.length > 0 ? apiPlayersData : Object.values(fantasyPlayersData);
  const foundPlayers = [];
  const inputLower = input.toLowerCase();
  
  for (const player of players) {
    const playerNameLower = player.name.toLowerCase();
    const nameParts = player.name.toLowerCase().split(' ');
    
    // Check full name
    if (inputLower.includes(playerNameLower)) {
      foundPlayers.push(player.name);
    }
    // Check first name
    else if (nameParts[0] && inputLower.includes(nameParts[0])) {
      foundPlayers.push(player.name);
    }
    // Check last name
    else if (nameParts[1] && inputLower.includes(nameParts[1])) {
      foundPlayers.push(player.name);
    }
  }
  
  return foundPlayers;
};

const extractPlayerName = (input) => {
  const players = apiPlayersData.length > 0 ? apiPlayersData : Object.values(fantasyPlayersData);
  const inputLower = input.toLowerCase();
  
  for (const player of players) {
    const playerNameLower = player.name.toLowerCase();
    const nameParts = player.name.toLowerCase().split(' ');
    
    // Check full name
    if (inputLower.includes(playerNameLower)) {
      return player.name;
    }
    // Check first name
    else if (nameParts[0] && inputLower.includes(nameParts[0])) {
      return player.name;
    }
    // Check last name
    else if (nameParts[1] && inputLower.includes(nameParts[1])) {
      return player.name;
    }
  }
  
  return null;
};

const findPlayerByName = (name) => {
  const players = apiPlayersData.length > 0 ? apiPlayersData : Object.values(fantasyPlayersData);
  const nameLower = name.toLowerCase();
  
  for (const player of players) {
    const playerNameLower = player.name.toLowerCase();
    const nameParts = player.name.toLowerCase().split(' ');
    
    // Exact match (full name)
    if (playerNameLower === nameLower) {
      return player;
    }
    // First name match
    else if (nameParts[0] === nameLower) {
      return player;
    }
    // Last name match
    else if (nameParts[1] === nameLower) {
      return player;
    }
  }
  
  return null;
};

const getPlayerRank = (player) => {
  const allPlayers = apiPlayersData.length > 0 ? apiPlayersData : Object.values(fantasyPlayersData);
  const sortedPlayers = allPlayers.sort((a, b) => b.fantasyPoints - a.fantasyPoints);
  return sortedPlayers.findIndex(p => p.name === player.name) + 1;
};

const getDraftStrategy = () => {
  const players = apiPlayersData.length > 0 ? apiPlayersData : Object.values(fantasyPlayersData);
  const topQB = players
    .filter(p => p.position === 'QB')
    .sort((a, b) => b.fantasyPoints - a.fantasyPoints)[0];
  
  const topRB = players
    .filter(p => p.position === 'RB')
    .sort((a, b) => b.fantasyPoints - a.fantasyPoints)[0];
  
  const topWR = players
    .filter(p => p.position === 'WR')
    .sort((a, b) => b.fantasyPoints - a.fantasyPoints)[0];
  
  return `🏈 Draft Strategy Guide\n\n` +
         `📋 Recommended Draft Order:\n` +
         `1. RB (${topRB.name} - ${topRB.fantasyPoints.toFixed(2)} pts)\n` +
         `2. WR (${topWR.name} - ${topWR.fantasyPoints.toFixed(2)} pts)\n` +
         `3. QB (${topQB.name} - ${topQB.fantasyPoints.toFixed(2)} pts)\n\n` +
         `💡 Strategy Tips:\n` +
         `• Target workhorse RBs early (high volume = consistent points)\n` +
         `• Look for WRs with high target shares\n` +
         `• Don't reach for QBs too early\n` +
         `• Consider TE in rounds 4-6 for elite options\n` +
         `• Build depth at RB/WR before filling other positions`;
};

const getStartSitAdvice = () => {
  const players = apiPlayersData.length > 0 ? apiPlayersData : Object.values(fantasyPlayersData);
  const topPlayers = players
    .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
    .slice(0, 5);
  
  let response = `🎯 Start/Sit Recommendations\n\n`;
  response += `🔥 MUST START:\n`;
  topPlayers.forEach((player, index) => {
    response += `${index + 1}. ${player.name} (${player.position} - ${player.team})\n`;
    response += `   Fantasy Points: ${player.fantasyPoints.toFixed(2)}\n\n`;
  });
  
  response += `📊 Start/Sit Factors:\n` +
              `• Check injury reports and practice participation\n` +
              `• Consider matchup strength (defense vs position)\n` +
              `• Weather conditions for outdoor games\n` +
              `• Recent performance trends\n` +
              `• Team offensive efficiency`;
  
  return response;
};

const getHelpMessage = () => {
  return `🏈 NFL Fantasy Assistant - How I Can Help\n\n` +
         `📋 Available Commands:\n` +
         `• "Recommend me a QB/RB/WR/TE"\n` +
         `• "Compare [Player A] and [Player B]"\n` +
         `• "Tell me about [Player Name]"\n` +
         `• "Give me fantasy advice"\n` +
         `• "Draft strategy tips"\n` +
         `• "Start/sit advice"\n` +
         `• "Top 5 QBs/RBs/WRs/TEs"\n` +
         `• "Player rankings"\n\n` +
         `💡 Examples:\n` +
         `• "Recommend me a QB"\n` +
         `• "Compare Lamar Jackson and Josh Allen"\n` +
         `• "Tell me about Christian McCaffrey"\n` +
         `• "Give me draft strategy"\n` +
         `• "Who should I start?"`;
};

const getDefaultResponse = () => {
  return `🏈 Hi! I'm your NFL Fantasy Assistant. I can help you with:\n\n` +
         `• Player recommendations and rankings\n` +
         `• Player comparisons and analysis\n` +
         `• Fantasy strategy and advice\n` +
         `• Draft strategy tips\n` +
         `• Start/sit recommendations\n\n` +
         `Try asking: "Recommend me a QB" or "Compare Lamar Jackson and Josh Allen" or "Give me fantasy advice"`;
};

const comparePlayers = (player1Name, player2Name) => {
  const player1 = findPlayerByName(player1Name);
  const player2 = findPlayerByName(player2Name);
  
  if (!player1 || !player2) {
    return "I couldn't find one or both players in my database. Please check the spelling and try again.";
  }
  
  const player1Rank = getPlayerRank(player1);
  const player2Rank = getPlayerRank(player2);
  
  let response = `🏈 ${player1Name} vs ${player2Name}\n\n`;
  
  response += `${player1Name} (${player1.position} - ${player1.team}):\n`;
  response += `• Fantasy Points: ${player1.fantasyPoints.toFixed(2)}\n`;
  response += `• Overall Rank: #${player1Rank}\n\n`;
  
  response += `${player2Name} (${player2.position} - ${player2.team}):\n`;
  response += `• Fantasy Points: ${player2.fantasyPoints.toFixed(2)}\n`;
  response += `• Overall Rank: #${player2Rank}\n\n`;
  
  if (player1.fantasyPoints > player2.fantasyPoints) {
    response += `🏆 Winner: ${player1Name} (+${(player1.fantasyPoints - player2.fantasyPoints).toFixed(2)} points)`;
  } else if (player2.fantasyPoints > player1.fantasyPoints) {
    response += `🏆 Winner: ${player2Name} (+${(player2.fantasyPoints - player1.fantasyPoints).toFixed(2)} points)`;
  } else {
    response += `🤝 Tie: Both players have ${player1.fantasyPoints.toFixed(2)} fantasy points`;
  }
  
  return response;
};

const getPlayerInfo = (playerName) => {
  const player = findPlayerByName(playerName);
  
  if (!player) {
    return `I couldn't find "${playerName}" in my database. Please check the spelling and try again.`;
  }
  
  const rank = getPlayerRank(player);
  
  let response = `🏈 ${player.name}\n\n`;
  response += `📊 Player Info:\n`;
  response += `• Position: ${player.position}\n`;
  response += `• Team: ${player.team}\n`;
  response += `• Fantasy Points: ${player.fantasyPoints.toFixed(2)}\n`;
  response += `• Overall Rank: #${rank}\n\n`;
  
  // Add position-specific ranking
  const allPlayers = apiPlayersData.length > 0 ? apiPlayersData : Object.values(fantasyPlayersData);
  
  // Get ALL players in this position (including those without fantasy points)
  const allPositionPlayers = allPlayers.filter(p => p.position === player.position);
  const fantasyPositionPlayers = allPositionPlayers.filter(p => p.fantasyPoints > 0);
  
  // Rank among players with fantasy points
  const positionRank = fantasyPositionPlayers.findIndex(p => p.name === player.name) + 1;
  
  response += `📈 ${player.position} Rank: #${positionRank} of ${fantasyPositionPlayers.length} (${allPositionPlayers.length} total ${player.position}s)\n\n`;
  
  // Add recommendation
  if (rank <= 10) {
    response += `🔥 Recommendation: Must-start player!`;
  } else if (rank <= 25) {
    response += `💪 Recommendation: Strong starter`;
  } else if (rank <= 50) {
    response += `📊 Recommendation: Flex option`;
  } else {
    response += `📋 Recommendation: Bench/depth player`;
  }
  
  return response;
};

const recommendPlayersByPosition = (position, count) => {
  const players = (apiPlayersData.length > 0 ? apiPlayersData : Object.values(fantasyPlayersData))
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

const recommendTopPlayers = (count) => {
  const players = (apiPlayersData.length > 0 ? apiPlayersData : Object.values(fantasyPlayersData))
    .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
    .slice(0, count);
  
  let response = `Top ${count} fantasy players:\n\n`;
  players.forEach((player, index) => {
    response += `${index + 1}. ${player.name} (${player.position} - ${player.team})\n`;
    response += `   Fantasy Points: ${player.fantasyPoints.toFixed(2)}\n\n`;
  });
  
  return response;
};

const getFantasyAdvice = () => {
  const players = apiPlayersData.length > 0 ? apiPlayersData : Object.values(fantasyPlayersData);
  const topQB = players
    .filter(p => p.position === 'QB')
    .sort((a, b) => b.fantasyPoints - a.fantasyPoints)[0];
  
  const topRB = players
    .filter(p => p.position === 'RB')
    .sort((a, b) => b.fantasyPoints - a.fantasyPoints)[0];
  
  const topWR = players
    .filter(p => p.position === 'WR')
    .sort((a, b) => b.fantasyPoints - a.fantasyPoints)[0];
  
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

const PORT = 5000;

app.listen(PORT, async () => {
  console.log(`🚀 NFL Fantasy Assistant Server running on port ${PORT}`);
  console.log(`📊 Loaded ${Object.keys(fantasyPlayersData).length} fantasy players from JSON`);
  console.log(`🤖 Local AI responses enabled - no external API needed!`);
  
  // Initialize API data
  await initializeApiData();
}); 