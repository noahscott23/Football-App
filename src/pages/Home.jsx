import React, {useEffect, useState} from 'react'
import Search from '../components/Search.jsx'
import Spinner from '../components/Spinner.jsx'
import {useDebounce} from 'react-use'
import { getTrendingPlayers, updateSearchCount } from '../appwrite.js'
import TestFetch from '../components/test.jsx';
import { Link } from 'react-router-dom';

const API_BASE_URL = 'https://sports.core.api.espn.com/v3/sports/football/nfl/athletes';

const Home = () => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('');
  
  const [playerList, setPlayerList] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [trendingPlayers, setTrendingPlayers] = useState([]);
  const [trendingPlayersLoading, setTrendingPlayersLoading] = useState(false);
  const [trendingPlayersError, setTrendingPlayersError] = useState('');

  // getting all players from api
  const fetchAllPlayers = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const endpoint = `${API_BASE_URL}?limit=20000`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch players');
      const data = await response.json();
      const allItems = data.items || [];
      const players = allItems.filter(item => 
        item.active !== false && 
        item.fullName && 
        !item.fullName.includes('[') && 
        !item.fullName.includes(']')
      );
      setPlayerList(players);
      return players;
    } catch (error) {
      console.error(error);
      setErrorMessage('Error fetching players');
      setPlayerList([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

   // filter players from made playerList
  const searchPlayers = (query) => {
    if (!query) return playerList;
    return playerList.filter(player => player.fullName.toLowerCase().includes(query.toLowerCase()));
  };

  const [filteredPlayers, setFilteredPlayers] = useState([]);

  useDebounce(() => {
    const filtered = searchPlayers(searchTerm);
    setFilteredPlayers(filtered);

    if (searchTerm && filtered.length > 0) {
      updateSearchCount(searchTerm, filtered[0]);
    }
  }, 600, [searchTerm, playerList]);

  const fetchPlayers = async () => {
    setFilteredPlayers(searchPlayers(searchTerm));
  };

  const loadTrendingPlayers = async (players) => {
    setTrendingPlayersLoading(true);
    setTrendingPlayersError('');
    try {
      const searchData = await getTrendingPlayers();
      const playerMap = new Map((players || playerList).map(p => [String(p.id), p]));
      const trendingPlayerData = [];
      for (const searchItem of searchData) {
        if (searchItem.player_id) {
          const player = playerMap.get(String(searchItem.player_id));
          if (player) {
            trendingPlayerData.push({
              ...player,
              searchCount: searchItem.count
            });
          }
        }
      }
      setTrendingPlayers(trendingPlayerData);
    } catch (error) {
      console.error(`Error fetching trending players: ${error}`);
      setTrendingPlayersError('Error fetching trending players. Please try again later.');
    } finally {
      setTrendingPlayersLoading(false);
    }
  };

  // fetch all players, then load trending
  useEffect(() => {
    const loadEverything = async () => {
      const players = await fetchAllPlayers();
      await loadTrendingPlayers(players);
      setFilteredPlayers(players);
    };
    loadEverything();
  }, []);

  return (
    <>
      <TestFetch />
      <main>
        <div className = "pattern"/>
        <div className = "wrapper">
          <header>
            <h1 className="site-title">NFL Stats Zone</h1>
            <img src="./cover.png" className="w-full max-w-5xl h-auto object-contain mx-auto drop-shadow-md"/>
            <h1> Find Players and Their Stats </h1>
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
          </header>
          <section className="trending">
            <h2>Trending Players</h2>
            {trendingPlayersLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : trendingPlayersError ? (
              <p className="text-red-500 text-center py-8">{trendingPlayersError}</p>
            ) : trendingPlayers.length > 0 ? (
              <ul>
                {trendingPlayers.slice(0, 5).map((player, index) => (
                  <li key = {player.id} className="min-w-[230px] flex flex-row items-center">
                    <p className="fancy-text mt-[22px] text-nowrap">{index+1}</p>
                    <Link to={`/player/${player.id}`} className="cursor-pointer hover:scale-105 transition-transform duration-200">
                      <img 
                        src={`https://a.espncdn.com/i/headshots/nfl/players/full/${player.id}.png`}
                        alt={player.fullName} 
                        className="w-[127px] h-[163px] rounded-lg object-cover -ml-3.5"
                        onError={(e) => {
                          e.target.src = '/no-player.png'; 
                        }}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-center py-8">No trending players available</p>
            )}
          </section>
          <section className="all-players"> 
            <h2> All Players</h2>
            {isLoading ? (
              <Spinner />
            ) : errorMessage ? (
              <p className="text-red-500"> {errorMessage} </p>
            ): (
              <ul>
                {filteredPlayers.slice(0, 20).map((player) => (
                  <li key={player.id} className="bg-dark-100 p-4 rounded-lg mb-2 flex items-center space-x-4">
                    <Link to={`/player/${player.id}`} className="flex items-center space-x-4 w-full">
                      <img 
                        src={`https://a.espncdn.com/i/headshots/nfl/players/full/${player.id}.png`}
                        alt={player.fullName}
                        className="w-24 h-24 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = '/no-player.png'; 
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg">{player.fullName}</h3>
                        <p className="text-gray-300">
                          #{player.jersey} • {player.displayHeight} • {player.displayWeight}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Age: {player.age} • Experience: {player.experience?.years || 0} years
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  )
}

export default Home 