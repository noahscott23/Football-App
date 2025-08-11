import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { calculateProjections } from './src/utils/projectionCalculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load fantasy players JSON data once
const fantasyPlayersData = JSON.parse(
  readFileSync(join(__dirname, 'data/topFantasyPlayers.json'), 'utf8')
);

// Globals for all players loaded from ESPN API
let allPlayersData = [];
let isPlayersLoaded = false;

// Load all NFL players from ESPN API
export const loadAllPlayers = async () => {
  try {
    const playersResponse = await fetch('https://sports.core.api.espn.com/v3/sports/football/nfl/athletes?limit=20000');
    if (!playersResponse.ok) throw new Error('Failed to fetch players');
    const playersData = await playersResponse.json();

    allPlayersData = playersData.items.filter(item =>
      item.active !== false &&
      item.fullName &&
      !item.fullName.includes('[') &&
      !item.fullName.includes(']')
    );

    // Filter Lamar Jackson duplicate jersey
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

// Scoring settings & fantasy points calculations (include your existing functions here)
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

// Paste your calculateSeasonPoints, calculatePlayerFantasyPoints, getDetailedPlayerInfo, etc. here
// (Make sure to export any helper functions you want to test or use outside)

// Example: Extract player name from input
export const extractPlayerName = (input) => {
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


// ... include the rest of your helper functions here like:
// findPlayerByName, findPlayerByNameDetailed, getPlayerInfo, comparePlayers, recommendPlayersByPosition, recommendTopPlayers, getFantasyAdvice, getHelpMessage, getDefaultResponse, getPlayerProjections
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

// extract multiple player names
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
             `🔮 2025 Projections:\n` +
             `• "Predict [Player Name]" or "[Player] 2025"\n` +
             `• "Project Lamar Jackson"\n\n` +
             `📊 Player Analysis:\n` +
             `• "Tell me about [Player Name]"\n` +
             `• Just type a player name\n\n` +
             `⚖️ Player Comparisons:\n` +
             `• "Compare [Player A] and [Player B]"\n` +
             `• "Josh Allen vs Lamar Jackson"\n\n` +
             `🎯 Position Rankings:\n` +
             `• "Top 5 QBs/RBs/WRs/TEs"\n` +
             `• "Recommend me a QB"\n\n` +
             `💡 Fantasy Strategy:\n` +
             `• "Give me fantasy advice"\n` +
             `• "Fantasy strategy tips"\n\n` +
             `💬 Examples:\n` +
             `• "Predict Caleb Williams"\n` +
             `• "Compare Jefferson and Chase"\n` +
             `• "Top 3 running backs"`;
    };
    
    // Get default response
    const getDefaultResponse = () => {
      return `🏈 I didn't quite understand that. Try being more specific!\n\n` +
             `💡 What I can help with:\n` +
             `• Player info: "Tell me about Lamar Jackson"\n` +
             `• 2025 projections: "Predict Josh Allen"\n` +
             `• Comparisons: "Compare CMC and Saquon"\n` +
             `• Rankings: "Top 5 QBs"\n` +
             `• Strategy: "Give me fantasy advice"\n\n` +
             `🔍 Tip: Use full player names for best results!`;
    };
    
    // Get player projections
    const getPlayerProjections = async (playerName) => {
      const player = await findPlayerByNameDetailed(playerName);
      if (!player) return null;
      
      try {
        // Fetch player statistics for projections
        const statsResponse = await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${player.id}/stats`);
        if (!statsResponse.ok) return null;
        
        const statsData = await statsResponse.json();
        
        // Calculate projections using the imported function
        const projections = calculateProjections(player, statsData);
        return projections;
      } catch (error) {
        console.error('Error calculating projections:', error);
        return null;
      }
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
  
  // 2025 projections
  if (input.includes('projection') || input.includes('2025') || input.includes('predict')) {
    const playerName = extractPlayerName(input);
    if (playerName) {
      const projections = await getPlayerProjections(playerName);
      if (projections && !projections.error) {
        return `🔮 2025 Projections for ${playerName}:\n\n` +
               `Projected Fantasy Points: ${projections.projectedFantasyPoints.toFixed(1)}\n` +
               `Factors:\n` +
               `• Age: ${projections.factors.ageFactor}x\n` +
               `• Trend: ${projections.factors.trendFactor}x`;
      } else {
        return `I couldn't calculate 2025 projections for ${playerName}. This might be due to limited statistical data.`;
      }
    } else {
      // No player name found in projection request
      return `I couldn't find a player name in your request. Please try:\n\n` +
             `• "Predict Lamar Jackson"\n` +
             `• "Caleb Williams 2025"\n` +
             `• "Predict Josh Allen"\n\n` +
             `Make sure to use the player's full name!`;
    }
  }
  
  // Just a player name
  const playerName = extractPlayerName(input);
  if (playerName) {
    return await getPlayerInfo(playerName);
  }
  
  // Default response
  return getDefaultResponse();
};

