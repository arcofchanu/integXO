# Monochrome Tic Tac Toe

A modern, responsive Tic Tac Toe game built with React, TypeScript, and Vite. Features user authentication via Supabase and PayPal integration for premium features.

## Features

- 🎮 Classic Tic Tac Toe gameplay against an intelligent CPU
- 🔐 User authentication with Supabase
- 💳 PayPal integration for unlimited plays
- 📱 Responsive design with Tailwind CSS
- ⚡ Fast development with Vite
- 🎨 Animated background and smooth transitions
- 📊 Score tracking and game statistics

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account
- A PayPal Developer account (for payment features)

### Environment Configuration

1. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

2. Fill in your environment variables:
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# PayPal Configuration  
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
```

### Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your project dashboard, go to Settings > API
3. Copy the Project URL and anon/public key
4. Add these to your `.env` file

### Getting PayPal Client ID

1. Go to [PayPal Developer](https://developer.paypal.com)
2. Create a new application
3. Copy the Client ID from your app
4. Add it to your `.env` file

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## Game Rules

- Players take turns placing X (you) and O (CPU)
- Get 3 in a row horizontally, vertically, or diagonally to win
- After 7 games, a payment popup will appear for unlimited plays
- Scores are tracked for each session

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite 6
- **Authentication**: Supabase
- **Payments**: PayPal SDK
- **Deployment**: Static hosting compatible

## Project Structure

```
├── components/
│   ├── Auth.tsx          # Authentication component
│   ├── Board.tsx         # Game board component
│   ├── LiveBackground.tsx # Animated background
│   ├── PaymentPopup.tsx  # PayPal payment integration
│   └── Square.tsx        # Individual game square
├── hooks/
│   └── useTicTacToe.ts  # Game logic hook
├── lib/
│   └── supabaseClient.ts # Supabase configuration
├── App.tsx              # Main application component
├── index.tsx           # Application entry point
├── types.ts            # TypeScript type definitions
└── vite-env.d.ts       # Vite environment types
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
