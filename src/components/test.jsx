import React, { useEffect } from 'react';

const API_URL = 'https://sports.core.api.espn.com/v3/sports/football/nfl/athletes?limit=1';

export default function TestFetch() {
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        // The data.athletes is an array of teams, each with an items array of players
        console.log('Raw API data:', data);
        if (data.athletes && data.athletes.length > 0) {
          const firstTeam = data.athletes[0];
          const firstPlayer = firstTeam.items[0];
          console.log('Sample player:', firstPlayer);
        }
      })
      .catch(err => console.error('Fetch error:', err));
  }, []);
}