# Predictor Pro

AI-powered football prediction platform built with Next.js 15, TypeScript, and modern web technologies.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)
![Prisma](https://img.shields.io/badge/Prisma-6.1-2D3748)

## Features

- **AI-Powered Predictions**: Combines Elo ratings, Poisson distribution, and team form analysis
- **Live Match Tracking**: Real-time updates for ongoing matches
- **Odds Comparison**: Compare odds across multiple bookmakers
- **Head-to-Head Stats**: Historical match data between teams
- **Match Statistics**: Comprehensive match stats and analytics
- **Dark Mode**: Full dark mode support
- **Responsive Design**: Mobile-first, works on all devices
- **ISR**: Incremental Static Regeneration for optimal performance
- **Edge Runtime**: API routes run at the edge for low latency

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: TailwindCSS 3.4
- **Database**: Neon PostgreSQL with Prisma ORM
- **State Management**: TanStack Query (React Query)
- **Validation**: Zod
- **API Sources**: API-Football, The Odds API
- **AI**: OpenAI GPT-4 for enhanced predictions
- **Deployment**: Vercel / Docker

## Project Structure

```
predictor-pro/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── match/[id]/        # Match detail page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── error.tsx          # Error boundary
├── components/            # React components
│   ├── ui/               # UI primitives (Button, Card, Badge)
│   ├── dashboard/       # Dashboard components
│   ├── match/            # Match-related components
│   ├── layout/           # Layout components
│   └── providers/        # Context providers
├── lib/                   # Utilities
│   ├── prisma.ts         # Prisma client
│   ├── cache.ts          # Cache service
│   ├── logger.ts         # Winston logger
│   ├── rate-limit.ts     # Rate limiting
│   └── utils.ts          # Utility functions
├── services/              # Business logic
│   ├── prediction-engine.ts  # Core prediction algorithm
│   ├── api-football.ts      # API-Football client
│   ├── odds-api.ts          # The Odds API client
│   ├── openai-service.ts    # OpenAI integration
│   ├── match-repository.ts  # Match data access
│   └── team-repository.ts   # Team data access
├── types/                  # TypeScript types
│   ├── index.ts          # Core domain types
│   └── schemas.ts        # Zod schemas
├── hooks/                  # Custom React hooks
│   ├── use-matches.ts    # Match queries
│   └── use-predictions.ts # Prediction hooks
├── actions/                # Server Actions
│   └── match-actions.ts  # Match-related actions
├── prisma/                 # Database
│   └── schema.prisma     # Database schema
└── public/                 # Static assets
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon recommended)
- API keys:
  - [API-Football](https://www.api-football.com/)
  - [The Odds API](https://the-odds-api.com/)
  - [OpenAI](https://platform.openai.com/) (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/predictor-pro.git
cd predictor-pro
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your credentials:
```env
DATABASE_URL="postgresql://..."
API_FOOTBALL_KEY="your-api-key"
ODDS_API_KEY="your-odds-api-key"
OPENAI_API_KEY="your-openai-key"  # Optional
```

5. Generate Prisma client:
```bash
npm run db:generate
```

6. Push schema to database:
```bash
npm run db:push
```

7. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database

### Schema Overview

- **League**: Football leagues (Premier League, La Liga, etc.)
- **Team**: Teams with Elo ratings
- **Match**: Match data with predictions and odds
- **Prediction**: AI-generated predictions with confidence scores
- **MatchOdds**: Historical odds from bookmakers
- **MatchStats**: Match statistics (shots, corners, etc.)
- **H2HRecord**: Head-to-head records
- **FormHistory**: Team form tracking
- **Injury**: Player injuries and suspensions

### Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

## Prediction Engine

The prediction engine combines multiple algorithms:

### Elo Rating System
- Teams start at 1500 Elo
- K-factor of 32 for regular matches
- Home advantage of 65 Elo points
- Goal difference adjustments

### Poisson Distribution
- Expected goals calculated from Elo and form
- Individual team goal probabilities
- Combined outcome calculations

### Form Analysis
- Last 5 matches weighted (recent more important)
- Win/Draw/Loss points system
- Home/Away form separately tracked

### Confidence Score
- Based on Elo difference
- Form consistency
- Recent goal averages
- Odds alignment

## API Routes

### Matches
- `GET /api/v1/matches` - List matches with filters
- `GET /api/v1/matches/live` - Live matches
- `GET /api/v1/matches/today` - Today's matches
- `GET /api/v1/matches/upcoming` - Upcoming matches
- `GET /api/v1/matches/[id]` - Match details

### Predictions
- `GET /api/v1/predictions/[id]` - Get prediction
- `POST /api/v1/predictions/generate` - Generate prediction

### Head to Head
- `GET /api/v1/h2h` - Get H2H records

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker

```bash
# Build image
docker build -t predictor-pro .

# Run container
docker run -p 3000:3000 --env-file .env.local predictor-pro
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |
| `API_FOOTBALL_KEY` | API-Football API key | Yes |
| `ODDS_API_KEY` | The Odds API key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | No |
| `REDIS_URL` | Redis connection for caching | No |
| `NEXT_PUBLIC_APP_URL` | Application URL | No |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | No |

## Features Breakdown

### Dashboard
- Today's matches overview
- Live matches with real-time updates
- Upcoming matches for the week
- Quick statistics

### Match Detail Page
- Team information and logos
- Live score and match status
- AI prediction with confidence
- Match statistics visualization
- Odds comparison across bookmakers
- Head-to-head history

### Prediction Card
- 1X2 probabilities (Home Win, Draw, Away Win)
- Predicted score
- BTTS (Both Teams To Score)
- Over/Under 2.5
- Asian Handicap
- Confidence score

## Performance Optimizations

- **ISR**: Pages revalidate automatically
- **Edge Runtime**: API routes run at the edge
- **Caching**: Redis and in-memory caching
- **Rate Limiting**: Protection against abuse
- **Query Deduplication**: TanStack Query handles this

## Security

- Input validation with Zod
- Rate limiting on all API routes
- Security headers configured
- Environment variables for secrets
- SQL injection protection via Prisma

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- [API-Football](https://www.api-football.com/) for football data
- [The Odds API](https://the-odds-api.com/) for betting odds
- [OpenAI](https://openai.com/) for AI capabilities
- [Neon](https://neon.tech/) for serverless PostgreSQL
