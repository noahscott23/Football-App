## DEMO:
[![Watch the Demo](public/thumbnail.png)](https://youtu.be/IAeJN9k-NkU)


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

## Features in Detail

### Projection Algorithm
The 2025 projection system considers:
- **Age Factors** - Position-specific aging curves
- **Performance Trends** - Multi-year trajectory analysis
- **Experience Factors** - Rookie and sophomore development
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

## License

This project is open source and available under the [MIT License](LICENSE).
