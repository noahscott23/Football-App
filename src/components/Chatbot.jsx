import React, { useState, useRef, useEffect } from 'react';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { type: 'bot', text: "🏈 Welcome to your NFL Fantasy Assistant! I can help you with:\n\n🔮 2025 Projections - \"Predict Lamar Jackson\"\n📊 Player Analysis - \"Tell me about Josh Allen\"\n⚖️ Player Comparisons - \"Compare CMC and Saquon\"\n🎯 Position Rankings - \"Top 5 RBs\"\n💡 Fantasy Strategy - \"Give me advice\"\n🔍 Quick Lookup - Just type any player name!\n\nTry asking about projections, comparisons, or just type a player name!" }
  ]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Local response handler
  const getLocalResponse = async (userInput) => {
    try {
      const response = await fetch('https://football-app-98n7.onrender.com/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput }),
      });

      const data = await response.json();
      
      if (data.success) {
        return data.reply;
      } else {
        console.log('Server error:', data.error);
        return "Sorry, I'm having trouble processing your request right now. Please try again!";
      }
    } catch (error) {
      console.error('Error calling server:', error);
      return "Sorry, I can't connect to the server right now. Please check if the server is running!";
    }
  };

  // recommend top players overall
  const recommendTopPlayers = (count) => {
    const players = Object.values(topFantasyPlayers)
      .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
      .slice(0, count);
    
    let response = `Top ${count} fantasy players:\n\n`;
    players.forEach((player, index) => {
      response += `${index + 1}. ${player.name} (${player.position} - ${player.team})\n`;
      response += `   Fantasy Points: ${player.fantasyPoints.toFixed(2)}\n\n`;
    });
    
    return response;
  };

  // compare two players
  const comparePlayers = (player1Name, player2Name) => {
    const player1 = findPlayerByName(player1Name);
    const player2 = findPlayerByName(player2Name);
    
    if (!player1 || !player2) {
      return "I couldn't find one or both players. Make sure to use their full names.";
    }
    
    let response = `**${player1.name} vs ${player2.name}**\n\n`;
    response += `${player1.name}:\n`;
    response += `• Position: ${player1.position}\n`;
    response += `• Team: ${player1.team}\n`;
    response += `• Fantasy Points: ${player1.fantasyPoints.toFixed(2)}\n\n`;
    response += `${player2.name}:\n`;
    response += `• Position: ${player2.position}\n`;
    response += `• Team: ${player2.team}\n`;
    response += `• Fantasy Points: ${player2.fantasyPoints.toFixed(2)}\n\n`;
    
    if (player1.fantasyPoints > player2.fantasyPoints) {
      response += `🏆 ${player1.name} has better fantasy performance this season!`;
    } else if (player2.fantasyPoints > player1.fantasyPoints) {
      response += `🏆 ${player2.name} has better fantasy performance this season!`;
    } else {
      response += `🤝 Both players have similar fantasy performance!`;
    }
    
    return response;
  };

  // get player information
  const getPlayerInfo = (playerName) => {
    const player = findPlayerByName(playerName);
    if (!player) {
      return `I couldn't find information for ${playerName}. Try using their full name.`;
    }
    
    return `${player.name} (${player.position} - ${player.team})\n\n` +
           `2024 Fantasy Points: ${player.fantasyPoints.toFixed(2)}\n` +
           `Position: ${player.position}\n` +
           `Team: ${player.team}\n\n` +
           `This player is ranked #${getPlayerRank(player)} in fantasy points this season!`;
  };

  // get fantasy advice
  const getFantasyAdvice = () => {
    const topQB = Object.values(topFantasyPlayers)
      .filter(p => p.position === 'QB')
      .sort((a, b) => b.fantasyPoints - a.fantasyPoints)[0];
    
    const topRB = Object.values(topFantasyPlayers)
      .filter(p => p.position === 'RB')
      .sort((a, b) => b.fantasyPoints - a.fantasyPoints)[0];
    
    const topWR = Object.values(topFantasyPlayers)
      .filter(p => p.position === 'WR')
      .sort((a, b) => b.fantasyPoints - a.fantasyPoints)[0];
    
    return `**Fantasy Football Advice**\n\n` +
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

  // helper functions
  const findPlayerByName = (name) => {
    return Object.values(topFantasyPlayers).find(player => 
      player.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(player.name.toLowerCase())
    );
  };

  const getPlayerRank = (player) => {
    const sortedPlayers = Object.values(topFantasyPlayers)
      .sort((a, b) => b.fantasyPoints - a.fantasyPoints);
    return sortedPlayers.findIndex(p => p.name === player.name) + 1;
  };

  const extractPlayerNames = (input) => {
    // simple extraction - could be improved with NLP
    const words = input.split(' ');
    const players = [];
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i].match(/^[A-Z][a-z]+$/) && words[i + 1].match(/^[A-Z][a-z]+$/)) {
        players.push(`${words[i]} ${words[i + 1]}`);
      }
    }
    return players;
  };

  const extractPlayerName = (input) => {
    const words = input.split(' ');
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i].match(/^[A-Z][a-z]+$/) && words[i + 1].match(/^[A-Z][a-z]+$/)) {
        return `${words[i]} ${words[i + 1]}`;
      }
    }
    return null;
  };

  // handle send message
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    // add user message
    setMessages(prev => [...prev, { type: 'user', text: input }]);
    setIsLoading(true);
    
    try {
      // get local response
      const response = await getLocalResponse(input);
      setMessages(prev => [...prev, { type: 'bot', text: response }]);
    } catch (error) {
      console.error('Error getting response:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: "Sorry, I'm having trouble processing your request right now. Please try again!" 
      }]);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  // handle enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSend();
    }
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg z-50 transition-all duration-300"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chatbot Interface */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-96 bg-dark-100 rounded-lg shadow-xl border border-gray-700 z-40 flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg">
            <h3 className="font-bold">NFL Fantasy Assistant</h3>
            <p className="text-sm opacity-90">Powered by local data • Ask me anything!</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans text-sm">{message.text}</pre>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="text-sm">Processing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isLoading ? "Processing..." : "Ask about players..."}
                disabled={isLoading}
                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot; 
