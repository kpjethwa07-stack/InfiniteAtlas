# 🗺️ Infinity Atlas (formerly Traveloop)

Infinity Atlas is an **intelligent, AI-powered travel planner** that crafts personalized, multi-destination itineraries in seconds. Built with a stunning, modern UI and powered by Google's Gemini AI, it takes the hassle out of vacation planning by automatically generating comprehensive day-by-day schedules, budget estimations, packing lists, and local insights.

![Infinity Atlas Demo](https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000&auto=format&fit=crop)

## ✨ Features

- **🤖 Smart Plan AI Engine**: Enter a destination, dates, and optional budget. Gemini AI generates a complete itinerary instantly.
- **📍 Multi-City Support**: Automatically segments your trips into stops with intelligent activity scheduling.
- **💰 Expense Tracking**: Built-in budget planner to track transportation, accommodation, and food costs.
- **🎒 Smart Packing Lists**: Automatically suggested packing items based on your destination.
- **🔗 Public Sharing**: Generate unique URLs to share your itinerary with friends, family, or travel companions. They can clone it to their own dashboard!
- **🔐 Secure Authentication**: Handled seamlessly by Firebase Auth.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Framer Motion (for fluid UI/UX), Radix UI (shadcn)
- **Backend & Database**: Firebase (Auth & Firestore)
- **AI Integration**: Google Gemini API (`@google/genai`)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase Project
- Google Gemini API Key

### 1. Clone & Install
```bash
git clone https://github.com/kpjethwa07-stack/InfiniteAtlas.git
cd InfiniteAtlas
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory and add your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Your Firebase configuration is stored in `firebase-applet-config.json` and loaded automatically via `src/lib/firebase.ts`.

### 3. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` to view the application!

## 🔐 Security Rules
Make sure to deploy your Firestore security rules (or run the applet setup) to ensure data is properly scoped to individual users!

## 📄 License
This project is open-source and available under the MIT License.
