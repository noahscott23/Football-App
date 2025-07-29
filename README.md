# NFL Fantasy Assistant

A comprehensive React-based web application for NFL fantasy football enthusiasts. Features an intelligent chatbot assistant, player statistics, 2025 projections, and advanced analytics powered by ESPN's API.

## Features

### 🤖 AI Fantasy Assistant
- **2025 Player Projections** - Advanced statistical modeling for next season
- **Player Analysis** - Detailed stats, recommendations, and insights
- **Player Comparisons** - Head-to-head fantasy performance analysis
- **Position Rankings** - Top performers by position
- **Fantasy Strategy** - Expert advice and tips
- **Natural Language Processing** - Just type player names or questions

### 📊 Advanced Analytics
- **Projection Calculator** - Factors in age, trends, experience, and situational changes
- **Fantasy Points Calculator** - Customizable scoring settings (PPR, Half-PPR, Standard)
- **Historical Performance** - Multi-year statistical analysis
- **Trend Analysis** - Performance trajectory and momentum

### 🏈 Player Database
- **Real-time NFL Data** - Live stats from ESPN API
- **Comprehensive Player Profiles** - Stats, bio, team info
- **Search Functionality** - Find any NFL player instantly
- **Usage Tracking** - Popular player searches via Appwrite

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Express.js, Node.js
- **Database**: Appwrite (search tracking)
- **APIs**: ESPN NFL API
- **AI/ML**: Custom projection algorithms
- **Styling**: TailwindCSS, responsive design

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd football-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with your Appwrite credentials:
```
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_APPWRITE_COLLECTION_ID=your_collection_id
```

4. Start the full application:
```bash
npm run dev:full
```

This runs both the frontend (port 5173) and backend server (port 5000) concurrently.

## Available Scripts

- `npm run dev` - Start frontend development server only
- `npm run server` - Start backend server only
- `npm run dev:full` - Start both frontend and backend
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
football-app/
├── public/                    # Static assets
├── src/
│   ├── components/           # React components
│   │   └── Chatbot.jsx      # AI assistant interface
│   ├── pages/               # Page components
│   │   ├── Home.jsx         # Main landing page
│   │   └── PlayerStats.jsx  # Player detail page
│   ├── utils/               # Utility functions
│   │   └── projectionCalculator.js # 2025 projection engine
│   ├── data/                # Static data files
│   │   └── topFantasyPlayers.json # Pre-calculated top players
│   ├── assets/              # Project assets
│   ├── App.jsx              # Main app component
│   ├── appwrite.js          # Appwrite configuration
│   └── main.jsx             # App entry point
├── server.js                # Express backend server
├── package.json
└── README.md
```

## Chatbot Commands

### 🔮 2025 Projections
```
"Predict Lamar Jackson"
"Josh Allen 2025"
"Project Caleb Williams"
```

### 📊 Player Analysis
```
"Tell me about CMC"
"Lamar Jackson"
"Who is Justin Jefferson"
```

### ⚖️ Player Comparisons
```
"Compare Josh Allen and Lamar Jackson"
"CMC vs Saquon Barkley"
"Jefferson vs Chase"
```

### 🎯 Position Rankings
```
"Top 5 QBs"
"Best running backs"
"Recommend me a WR"
```

### 💡 Fantasy Strategy
```
"Give me fantasy advice"
"Fantasy strategy tips"
"Help with my lineup"
```

## API Endpoints

### Backend Server (Port 5000)

- `POST /api/chat` - Chatbot conversation endpoint
  ```json
  {
    "message": "Predict Lamar Jackson"
  }
  ```

## Features in Detail

### Projection Algorithm
The 2025 projection system considers:
- **Age Factors** - Position-specific aging curves
- **Performance Trends** - Multi-year trajectory analysis
- **Experience Factors** - Rookie and sophomore development
- **Situational Factors** - Team changes, injuries, system fits
- **Regression to Mean** - Prevents extreme projections

### Fantasy Scoring
Supports multiple scoring formats:
- **PPR** (Point Per Reception)
- **Half-PPR** (0.5 points per reception)
- **Standard** (No reception points)

Custom scoring settings for:
- Passing yards/TDs/INTs
- Rushing yards/TDs/fumbles
- Receiving yards/TDs/receptions
- Kicking (FGs/extra points)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- ESPN API for real-time NFL data
- Appwrite for database services
- React and Vite communities for excellent tooling
