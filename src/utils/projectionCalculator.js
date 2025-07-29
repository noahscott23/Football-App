// 2025 NFL Player Projection Calculator
// Calculates projected fantasy stats based on historical performance, age, trends, and situational factors

// Age factor multipliers by position
const AGE_FACTORS = {
  'QB': {
    22: 1.05, 23: 1.05, 24: 1.05, 25: 1.05, 26: 1.05,
    27: 1.02, 28: 1.02, 29: 1.00, 30: 1.00, 31: 1.00, 32: 1.00,
    33: 0.95, 34: 0.95, 35: 0.95,
    36: 0.85, 37: 0.85, 38: 0.85,
    39: 0.70, 40: 0.70
  },
  'RB': {
    21: 1.15, 22: 1.10, 23: 1.08, 24: 1.05,
    25: 1.02, 26: 1.00,
    27: 0.95, 28: 0.90,
    29: 0.80, 30: 0.75,
    31: 0.65, 32: 0.60, 33: 0.55
  },
  'WR': {
    21: 1.10, 22: 1.08, 23: 1.06, 24: 1.05, 25: 1.03,
    26: 1.02, 27: 1.02, 28: 1.00,
    29: 0.98, 30: 0.95,
    31: 0.90, 32: 0.85,
    33: 0.75, 34: 0.70, 35: 0.65
  },
  'TE': {
    22: 1.08, 23: 1.06, 24: 1.05, 25: 1.03, 26: 1.02,
    27: 1.00, 28: 1.00, 29: 1.00,
    30: 0.95, 31: 0.92, 32: 0.90,
    33: 0.85, 34: 0.80, 35: 0.75
  },
  'K': {
    22: 1.02, 23: 1.02, 24: 1.01, 25: 1.01, 26: 1.00,
    27: 1.00, 28: 1.00, 29: 1.00, 30: 1.00, 31: 1.00, 32: 1.00,
    33: 0.98, 34: 0.98, 35: 0.95,
    36: 0.90, 37: 0.85, 38: 0.80
  }
};

// Default scoring settings for fantasy points calculation
const DEFAULT_SCORING = {
  passingYards: 0.04,
  passingTDs: 4,
  interceptions: -2,
  rushingYards: 0.1,
  rushingTDs: 6,
  fumbles: -2,
  receptions: 1,
  receivingYards: 0.1,
  receivingTDs: 6,
  extraPoints: 1,
  fieldGoals: 3.5
};

// Calculate age factor for a player
export const getAgeFactor = (age, position) => {
  const positionFactors = AGE_FACTORS[position] || AGE_FACTORS['WR'];
  
  // Use exact age if available, otherwise use closest age
  if (positionFactors[age]) {
    return positionFactors[age];
  }
  
  // Find closest age in the table
  const ages = Object.keys(positionFactors).map(Number).sort((a, b) => a - b);
  const closestAge = ages.reduce((prev, curr) => 
    Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev
  );
  
  return positionFactors[closestAge] || 1.0;
};

// Calculate baseline stats from historical data (weighted average)
export const calculateBaseline = (historicalStats, yearsInNFL) => {
  if (!historicalStats || historicalStats.length === 0) return {};
  
  console.log('Historical stats for baseline:', historicalStats);
  
  // Sort by year (most recent first)
  const sortedStats = [...historicalStats].sort((a, b) => b.year - a.year);
  
  let baseline = {};
  
  if (sortedStats.length === 1) {
    // Rookie: use their single season as baseline
    console.log('Using rookie season as baseline:', sortedStats[0].fantasyPoints);
    baseline = { ...sortedStats[0] };
  } else if (sortedStats.length === 2) {
    // 2 years: weighted average (30% recent, 70% previous)
    const weights = [0.3, 0.7];
    
    console.log('Using 2-year weighted average:');
    console.log(`${sortedStats[0].year} (30%):`, sortedStats[0].fantasyPoints);
    console.log(`${sortedStats[1].year} (70%):`, sortedStats[1].fantasyPoints);
    
    Object.keys(sortedStats[0]).forEach(stat => {
      if (typeof sortedStats[0][stat] === 'number') {
        baseline[stat] = sortedStats.slice(0, 2).reduce((sum, season, index) => 
          sum + (season[stat] || 0) * weights[index], 0
        );
      }
    });
  } else if (sortedStats.length >= 3) {
    // 3+ years: weighted average (25% recent, 40% middle, 35% oldest)
    const weights = [0.25, 0.40, 0.35];
    
    console.log('Using 3+ year weighted average:');
    console.log(`${sortedStats[0].year} (25%):`, sortedStats[0].fantasyPoints);
    console.log(`${sortedStats[1].year} (40%):`, sortedStats[1].fantasyPoints);
    console.log(`${sortedStats[2].year} (35%):`, sortedStats[2].fantasyPoints);
    
    Object.keys(sortedStats[0]).forEach(stat => {
      if (typeof sortedStats[0][stat] === 'number') {
        baseline[stat] = sortedStats.slice(0, 3).reduce((sum, season, index) => 
          sum + (season[stat] || 0) * weights[index], 0
        );
      }
    });
    
    console.log('Calculated baseline fantasy points:', baseline.fantasyPoints);
  }
  
  return baseline;
};

// Calculate performance trend factor
export const getTrendFactor = (historicalStats) => {
  if (!historicalStats || historicalStats.length < 2) return 1.0;
  
  const sortedStats = [...historicalStats].sort((a, b) => b.year - a.year);
  
  // Calculate year-over-year fantasy point changes (already per-game adjusted)
  let trends = [];
  
  for (let i = 0; i < sortedStats.length - 1; i++) {
    const current = sortedStats[i].fantasyPoints || 0;
    const previous = sortedStats[i + 1].fantasyPoints || 0;
    const currentGames = sortedStats[i].gamesPlayed || 17;
    const previousGames = sortedStats[i + 1].gamesPlayed || 17;
    
    // Skip trend if either season had significant injury (< 12 games)
    if (currentGames < 12 || previousGames < 12) {
      console.log(`Skipping trend ${sortedStats[i].year} vs ${sortedStats[i + 1].year} due to injury (${currentGames} vs ${previousGames} games)`);
      continue;
    }
    
    if (previous > 0) {
      const trend = (current - previous) / previous;
      trends.push(trend);
      console.log(`Trend ${sortedStats[i].year} vs ${sortedStats[i + 1].year}: ${current.toFixed(1)} vs ${previous.toFixed(1)} = ${(trend * 100).toFixed(1)}%`);
    }
  }
  
  if (trends.length === 0) return 1.0; // No valid trends, assume stable
  
  // Weight recent trends more heavily
  const weightedTrend = trends.length === 1 ? trends[0] : 
    trends[0] * 0.7 + (trends[1] || 0) * 0.3;
  
  console.log(`Weighted trend: ${(weightedTrend * 100).toFixed(1)}%`);
  
  // Convert trend to multiplier
  if (weightedTrend > 0.15) return 1.15;      // Strong improvement
  if (weightedTrend > 0.05) return 1.08;      // Moderate improvement
  if (weightedTrend > -0.05) return 1.00;     // Stable
  if (weightedTrend > -0.15) return 0.92;     // Moderate decline
  return 0.85;                                // Strong decline
};

// Calculate situation factor (team changes, supporting cast, etc.)
export const getSituationFactor = (playerData, situationalFactors = {}) => {
  let factor = 1.0;
  
  // Only apply factors we can actually detect or that user manually provides
  if (situationalFactors.injuryHistory) factor *= 0.92;
  if (situationalFactors.newTeam) factor *= 0.90;
  
  return Math.max(0.7, Math.min(1.3, factor));
};

// Apply regression to mean to prevent extreme projections
export const getRegressionFactor = (baselineValue, positionAverage, statType) => {
  if (!positionAverage || positionAverage === 0) return 1.0;
  
  const distanceFromMean = Math.abs(baselineValue - positionAverage);
  const regressionStrength = Math.min(0.15, (distanceFromMean / positionAverage) * 0.1);
  
  if (baselineValue > positionAverage) {
    return 1 - regressionStrength;
  } else {
    return 1 + regressionStrength;
  }
};

// Calculate experience factor for young players
export const getExperienceFactor = (yearsInNFL) => {
  if (yearsInNFL === 0) return 1.25;      // Rookie growth
  if (yearsInNFL === 1) return 1.15;      // Second year jump
  if (yearsInNFL === 2) return 1.08;      // Third year refinement
  return 1.00;                            // Established
};

// Calculate confidence score for projection reliability
export const calculateConfidence = (playerData, historicalStats, situationalFactors = {}) => {
  let confidence = 1.0;
  
  const yearsInNFL = playerData.experience || 0;
  const age = playerData.age || 25;
  const position = playerData.position || 'WR';
  

  
  // Reduce confidence for system changes
  if (situationalFactors.newTeam) confidence *= 0.85;
  if (situationalFactors.newOffensiveCoordinator) confidence *= 0.9;
  
  // Reduce confidence for age cliff risk
  if (age > 30 && position === 'RB') confidence *= 0.75;
  if (age > 32 && position === 'WR') confidence *= 0.8;
  if (age > 35 && position === 'QB') confidence *= 0.85;
  
  // Increase confidence for established players
  if (yearsInNFL > 5) confidence *= 1.1;
  
  // Check for consistent performance (low variance)
  if (historicalStats && historicalStats.length >= 3) {
    const fantasyPoints = historicalStats.map(s => s.fantasyPoints || 0);
    const mean = fantasyPoints.reduce((a, b) => a + b, 0) / fantasyPoints.length;
    const variance = fantasyPoints.reduce((sum, fp) => sum + Math.pow(fp - mean, 2), 0) / fantasyPoints.length;
    const coefficient = Math.sqrt(variance) / mean;
    
    if (coefficient < 0.2) confidence *= 1.05; // Very consistent
  }
  
  return Math.max(0.3, Math.min(1.0, confidence)); // Cap between 0.3 and 1.0
};

// Main projection calculation function
export const calculateProjections = (playerData, playerStats, situationalFactors = {}, scoringSettings = DEFAULT_SCORING) => {
  if (!playerData || !playerStats) {
    return { error: 'Missing player data or stats' };
  }
  
  const age = playerData.age || 25;
  const position = playerData.position || 'WR';
  const yearsInNFL = playerData.experience || 0;
  
  // Extract historical fantasy points from player stats
  const historicalStats = extractHistoricalStats(playerStats, scoringSettings);
  
  // Calculate baseline from historical data
  const baseline = calculateBaseline(historicalStats, yearsInNFL);
  
  // Calculate adjustment factors
  const ageFactor = getAgeFactor(age, position);
  const trendFactor = getTrendFactor(historicalStats);
  const situationFactor = getSituationFactor(playerData, situationalFactors);
  const experienceFactor = getExperienceFactor(yearsInNFL);
  
  console.log('=== PROJECTION CALCULATION ===');
  console.log('Baseline fantasy points:', baseline.fantasyPoints);
  console.log('Age factor:', ageFactor);
  console.log('Trend factor:', trendFactor);
  console.log('Situation factor:', situationFactor);
  console.log('Experience factor:', experienceFactor);
  
  // Calculate projections for each stat category
  const projectedStats = {};
  const breakdown = {};
  
  Object.keys(baseline).forEach(stat => {
    if (typeof baseline[stat] === 'number') {
      // Apply all factors to get projection
      let projection = baseline[stat] * ageFactor * trendFactor * situationFactor;
      
      // Apply experience factor for young players
      if (yearsInNFL < 3) {
        projection *= experienceFactor;
      }
      
      // Apply regression to mean (using position averages)
      const positionAverage = getPositionAverage(position, stat);
      const regressionFactor = getRegressionFactor(baseline[stat], positionAverage, stat);
      projection *= regressionFactor;
      
      projectedStats[stat] = Math.round(projection * 100) / 100;
      
      if (stat === 'fantasyPoints') {
        console.log('Fantasy points calculation:');
        console.log(`${baseline[stat]} × ${ageFactor} × ${trendFactor} × ${situationFactor} × ${regressionFactor} = ${projectedStats[stat]}`);
      }
    }
  });
  
  // Use the projected fantasy points directly instead of recalculating
  const projectedFantasyPoints = projectedStats.fantasyPoints || calculateFantasyPoints(projectedStats, scoringSettings);
  
  console.log('Final projected fantasy points:', projectedFantasyPoints);
  console.log('=== END CALCULATION ===');
  
  // Calculate confidence score
  const confidence = calculateConfidence(playerData, historicalStats, situationalFactors);
  
  return {
    playerInfo: {
      name: playerData.name,
      age,
      position,
      yearsInNFL
    },
    projectedStats,
    projectedFantasyPoints,
    confidence,
    breakdown,
    factors: {
      ageFactor,
      trendFactor,
      situationFactor,
      experienceFactor: yearsInNFL < 3 ? experienceFactor : 1.0
    },
    historicalStats
  };
};

// Extract historical stats and calculate fantasy points for each season
const extractHistoricalStats = (playerStats, scoringSettings) => {
  if (!playerStats || !playerStats.categories) return [];
  
  const seasonMap = {};
  
  // Process each category of stats
  playerStats.categories.forEach(category => {
    console.log(`Processing category: ${category.name}`);
    if (category.statistics) {
      category.statistics
        .filter(stat => !stat.displayName?.includes('Totals'))
        .forEach(stat => {
          const year = stat.season?.year;
          if (!year) return;
          
          if (!seasonMap[year]) {
            seasonMap[year] = { year, fantasyPoints: 0, gamesPlayed: 0 };
          }
          
          // Store individual stats and find games played
          let gamesPlayed = 0;
          if (category.labels && stat.stats) {
            console.log(`Year ${year} - Labels:`, category.labels);
            console.log(`Year ${year} - Stats:`, stat.stats);
            
            category.labels.forEach((label, index) => {
              const value = stat.stats[index];
              const cleanValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
              
              // Track games played
              if (label === 'GP' || label === 'G' || label === 'Games Played') {
                gamesPlayed = cleanValue || 0;
                seasonMap[year].gamesPlayed = Math.max(seasonMap[year].gamesPlayed, gamesPlayed);
                console.log(`Found games played for ${year}: ${gamesPlayed}`);
              }
              
              seasonMap[year][`${category.name}_${label}`] = cleanValue || 0;
            });
          }
          
          // Calculate fantasy points for this category
          const categoryPoints = calculateCategoryFantasyPoints(stat, category, scoringSettings);
          seasonMap[year].fantasyPoints += categoryPoints.total;
        });
    }
  });
  
  console.log('Season map before per-game conversion:', seasonMap);
  
  // Convert to per-game stats and project to 17 games
  return Object.values(seasonMap)
    .map(season => {
      const games = season.gamesPlayed || 16; // fallback to 16 if no GP data
      const perGameStats = {};
      
      console.log(`Converting ${season.year}: ${season.fantasyPoints} points in ${games} games`);
      
      // Convert all stats to per-game, then project to 17 games
      Object.keys(season).forEach(key => {
        if (typeof season[key] === 'number' && key !== 'year' && key !== 'gamesPlayed') {
          perGameStats[key] = (season[key] / games) * 17;
        } else {
          perGameStats[key] = season[key];
        }
      });
      
      console.log(`${season.year} projected to 17 games: ${perGameStats.fantasyPoints} points`);
      
      return perGameStats;
    })
    .sort((a, b) => b.year - a.year);
};

// Calculate fantasy points for a specific category
const calculateCategoryFantasyPoints = (stat, category, scoringSettings) => {
  if (!stat.stats || !category.labels) return { total: 0 };
  
  let points = 0;
  const statMap = {};
  
  category.labels.forEach((label, index) => {
    const value = stat.stats[index];
    statMap[label] = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : (value || 0);
  });
  
  switch (category.name) {
    case 'passing':
      points += (statMap['YDS'] || 0) * scoringSettings.passingYards;
      points += (statMap['TD'] || 0) * scoringSettings.passingTDs;
      points += (statMap['INT'] || 0) * scoringSettings.interceptions;
      break;
      
    case 'rushing':
      points += (statMap['YDS'] || 0) * scoringSettings.rushingYards;
      points += (statMap['TD'] || 0) * scoringSettings.rushingTDs;
      points += (statMap['FUM'] || 0) * scoringSettings.fumbles;
      break;
      
    case 'receiving':
      points += (statMap['REC'] || 0) * scoringSettings.receptions;
      points += (statMap['YDS'] || 0) * scoringSettings.receivingYards;
      points += (statMap['TD'] || 0) * scoringSettings.receivingTDs;
      break;
      
    case 'kicking':
      points += (statMap['FG'] || 0) * scoringSettings.fieldGoals;
      points += (statMap['XPM'] || 0) * scoringSettings.extraPoints;
      break;
  }
  
  return { total: Math.round(points * 100) / 100 };
};

// Calculate total fantasy points from projected stats
const calculateFantasyPoints = (stats, scoringSettings) => {
  let totalPoints = 0;
  
  // Passing stats
  totalPoints += (stats.passing_YDS || 0) * scoringSettings.passingYards;
  totalPoints += (stats.passing_TD || 0) * scoringSettings.passingTDs;
  totalPoints += (stats.passing_INT || 0) * scoringSettings.interceptions;
  
  // Rushing stats
  totalPoints += (stats.rushing_YDS || 0) * scoringSettings.rushingYards;
  totalPoints += (stats.rushing_TD || 0) * scoringSettings.rushingTDs;
  totalPoints += (stats.rushing_FUM || 0) * scoringSettings.fumbles;
  
  // Receiving stats
  totalPoints += (stats.receiving_REC || 0) * scoringSettings.receptions;
  totalPoints += (stats.receiving_YDS || 0) * scoringSettings.receivingYards;
  totalPoints += (stats.receiving_TD || 0) * scoringSettings.receivingTDs;
  
  // Kicking stats
  totalPoints += (stats.kicking_FG || 0) * scoringSettings.fieldGoals;
  totalPoints += (stats.kicking_XPM || 0) * scoringSettings.extraPoints;
  
  return Math.round(totalPoints * 100) / 100;
};

// Get position averages (simplified - you could expand this with real data)
const getPositionAverage = (position, stat) => {
  const averages = {
    'QB': {
      'passing_YDS': 3800,
      'passing_TD': 25,
      'passing_INT': 12,
      'rushing_YDS': 250,
      'rushing_TD': 3
    },
    'RB': {
      'rushing_YDS': 800,
      'rushing_TD': 8,
      'receiving_REC': 35,
      'receiving_YDS': 300,
      'receiving_TD': 2
    },
    'WR': {
      'receiving_REC': 65,
      'receiving_YDS': 900,
      'receiving_TD': 7,
      'rushing_YDS': 50,
      'rushing_TD': 1
    },
    'TE': {
      'receiving_REC': 50,
      'receiving_YDS': 600,
      'receiving_TD': 5
    },
    'K': {
      'kicking_FG': 25,
      'kicking_XPM': 35
    }
  };
  
  return averages[position]?.[stat] || 0;
};

export default {
  calculateProjections,
  getAgeFactor,
  getTrendFactor,
  getSituationFactor,
  calculateConfidence
};












