# MindMate — Intergenerational Mental Wellbeing Support Platform

> **Final Year Major Project (Semester 7)**  
> *Bridging Generational Wisdom with Youth Mental Health via Anonymous, Privacy-Preserving Mentorship.*

---

## Overview

**MindMate** is an intergenerational mental wellbeing web platform designed to address two complementary societal challenges:
1. **The Student Mental Health Epidemic:** Academic stress, career anxiety, peer pressure, and isolation, often accompanied by the fear of social stigma when seeking help.
2. **Elder Social Disconnection:** Retired seniors and elders who possess abundant life wisdom, empathy, and patience, yet often experience loneliness and underutilized time.

MindMate bridges this gap by facilitating **safe, anonymous, one-on-one mentorship** between university students and verified elder mentors. The platform guarantees absolute privacy through **Zero-Knowledge identity verification**, end-to-end pseudonyms, encrypted journal entries, real-time WebSocket conversations, mood tracking, and a supportive community wall.

---

## Key Features

### 1. Dual Persona Ecosystem
- **Student Dashboard:**
  - Track daily emotional wellbeing and maintain a streak.
  - Keep an encrypted personal journal / diary.
  - Browse and filter elder mentors by life passion and hobbies.
  - Request 1-on-1 mentorship or pair instantly via QR code.
  - Engage in private, encrypted real-time chat with typing indicators.
  - Access guided breathing exercises and crisis emergency contacts.
- **Elder Mentor Portal:**
  - Manage incoming student connection requests (Accept / Reject).
  - Provide empathetic, non-judgmental guidance via 1-on-1 chat.
  - View connected students' shared reflections (read-only diary access).
  - Share inspirational thoughts on the Wall of Encouragement.

### 2. Privacy & Zero-Knowledge Verification
- **Zero-Knowledge Proofs (ZKP):** Students and mentors verify their identity (mock Aadhaar/ID) without the server ever storing their actual national identity numbers. Only a cryptographic commitment (`zkCommitment`) and phone hash are preserved.
- **Pseudonymous Handles:** Automatically generated unique pseudonyms (e.g., `SereneOwl42`, `WiseWillow99`) ensure interactions remain completely detached from real-world identities.
- **Hashed Credentials:** Phone numbers are hashed using bcrypt before database storage.

### 3. Real-Time Secure Chat
- Powered by **Socket.io** WebSockets with token-based handshake authentication.
- **Payload Encryption:** Chat messages are encrypted using **AES-256-GCM** before persistence.
- Live typing indicators, active conversation tracking, and message history synchronization.

### 4. Mental Health & Self-Care Toolkit
- **Interactive Mood Tracker:** Daily 1–5 mood check-in with contextual emotion tags, notes, and visual trend analytics (7-day and 30-day charts powered by Recharts).
- **Encrypted Personal Diary:** Private student journaling with sentiment tagging; option to share reflections with the connected elder mentor.
- **Guided Breathing Exercise:** Animated 4-4-4-4 Box Breathing exercise with tactile audio-visual pacing for immediate stress and panic relief.
- **Silent Support Mode:** Presence-based listening space for students seeking calm companionship without the burden of conversation.
- **Wall of Encouragement & Community:** Anonymous community discussion threads and uplifting sticky-note wall.
- **Crisis Hotlines & Safety Guardrails:** Immediate access to national helplines (Tele-MANAS, KIRAN, Vandrevala Foundation, 112) and automatic crisis keyword detection.

---

## System Architecture

```mermaid
graph TD
    subgraph Client Layer ["Client Application (React + Vite + Tailwind CSS)"]
        UI[User Interface & Pages]
        AuthCtx[Auth Context & State]
        ApiClient[Axios / Fetch API Client]
        SocketClient[Socket.io Client]
    end

    subgraph Security Layer ["Security & Middleware Stack"]
        Helmet[Helmet Security Headers]
        CORS[CORS Whitelist Policy]
        RateLimit[Express Rate Limiter]
        Sanitizer[Mongo-Sanitize & HPP]
        JWTAuth[JWT Auth & RBAC Guard]
    end

    subgraph Server Layer ["Backend Server (Node.js + Express)"]
        AuthCtrl[Auth Controller (OTP / ZKP)]
        UserCtrl[User & Profile Controller]
        ConnCtrl[Connection & QR Controller]
        ChatCtrl[Chat & Socket Controller]
        DiaryCtrl[Encrypted Diary Controller]
        MoodCtrl[Mood Analytics Controller]
        CommCtrl[Community & Wall Controller]
    end

    subgraph Storage Layer ["Database & Crypto"]
        Mongo[(MongoDB Database)]
        AES[AES-256-GCM Encryption Engine]
        Logger[Winston Structured Logger]
    end

    UI --> AuthCtx
    AuthCtx --> ApiClient
    UI --> SocketClient
    ApiClient --> Helmet
    SocketClient -.-> ChatCtrl

    Helmet --> CORS --> RateLimit --> Sanitizer --> JWTAuth

    JWTAuth --> AuthCtrl
    JWTAuth --> UserCtrl
    JWTAuth --> ConnCtrl
    JWTAuth --> ChatCtrl
    JWTAuth --> DiaryCtrl
    JWTAuth --> MoodCtrl
    JWTAuth --> CommCtrl

    AuthCtrl --> Mongo
    UserCtrl --> Mongo
    ConnCtrl --> Mongo
    ChatCtrl --> AES --> Mongo
    DiaryCtrl --> AES --> Mongo
    MoodCtrl --> Mongo
    CommCtrl --> Mongo
    Server Layer --> Logger
```

---

## Technology Stack

### Frontend
- **Framework:** [React 18](https://react.dev/) with [Vite 6](https://vitejs.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) primitives & [shadcn/ui](https://ui.shadcn.com/)
- **Icons & Graphics:** [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/)
- **Data Visualization:** [Recharts](https://recharts.org/)
- **Notifications:** [Sonner](https://sonner.emilkowal.ski/)
- **QR Engine:** `qrcode.react`

### Backend
- **Runtime:** [Node.js](https://nodejs.org/) (v18+ recommended)
- **Web Framework:** [Express.js v4](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) via [Mongoose v8](https://mongoosejs.com/)
- **Real-Time Engine:** [Socket.io v4](https://socket.io/)
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) + `bcryptjs`
- **Security & Hardening:**
  - `helmet` — Secure HTTP response headers
  - `cors` — Cross-Origin Resource Sharing control
  - `express-rate-limit` — Anti-brute force and DDoS mitigation
  - `express-mongo-sanitize` — Protection against NoSQL query injection
  - `hpp` — HTTP Parameter Pollution prevention
  - `xss-clean` / sanitization — Cross-Site Scripting defense
- **Logging:** [Winston](https://github.com/winstonjs/winston) structured logger

---

## Project Structure

```
MindMate/
├── server/                         # Node.js / Express Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # MongoDB Mongoose connection
│   │   ├── controllers/            # Controller business logic
│   │   │   ├── authController.js       # OTP, ZKP verification & JWT issue
│   │   │   ├── chatController.js       # Conversation & message management
│   │   │   ├── communityController.js  # Forum posts & encouragement notes
│   │   │   ├── connectionController.js # Mentor requests & QR pairing
│   │   │   ├── diaryController.js      # Encrypted student journal CRUD
│   │   │   ├── moodController.js       # Mood check-ins & aggregated stats
│   │   │   └── userController.js       # Profile management & mentor catalog
│   │   ├── middleware/             # Express middlewares
│   │   │   ├── auth.js                 # JWT verification & RBAC guards
│   │   │   ├── errorHandler.js         # Centralized API error handler
│   │   │   ├── rateLimiter.js          # Route-specific rate limits
│   │   │   └── validate.js             # Input validation sanitizer
│   │   ├── models/                 # Mongoose Data Models
│   │   │   ├── CommunityPost.js
│   │   │   ├── ConnectionRequest.js
│   │   │   ├── Conversation.js
│   │   │   ├── DiaryEntry.js
│   │   │   ├── EncouragementNote.js
│   │   │   ├── Message.js
│   │   │   ├── MoodEntry.js
│   │   │   └── User.js
│   │   ├── routes/                 # Express API Route Handlers
│   │   │   ├── auth.js
│   │   │   ├── chat.js
│   │   │   ├── community.js
│   │   │   ├── connections.js
│   │   │   ├── diary.js
│   │   │   ├── mood.js
│   │   │   └── users.js
│   │   ├── socket/
│   │   │   └── chatHandler.js      # Socket.io events & live broadcast
│   │   ├── utils/
│   │   │   ├── crypto.js           # AES-256-GCM encryption helpers
│   │   │   └── logger.js           # Winston logger configuration
│   │   └── index.js                # Server entry point & Express bootstrap
│   ├── .env.example                # Backend environment template
│   └── package.json
│
├── src/                            # React + Vite Frontend
│   ├── app/
│   │   ├── components/             # Reusable UI components & layouts
│   │   │   ├── Navbar.tsx
│   │   │   ├── Root.tsx
│   │   │   └── ui/                 # Buttons, modals, cards, sliders
│   │   ├── context/
│   │   │   └── AuthContext.tsx     # Global authentication & session provider
│   │   ├── lib/
│   │   │   └── api.ts              # Centralized typed API client
│   │   ├── pages/                  # Application Views
│   │   │   ├── AskSenior.tsx           # Senior advice forum
│   │   │   ├── BreathingExercise.tsx   # 4-4-4-4 Box breathing exercise
│   │   │   ├── Chat.tsx                # Real-time WebSocket messaging
│   │   │   ├── Community.tsx           # Encouragement wall & posts
│   │   │   ├── Connect.tsx             # Mentor connection hub
│   │   │   ├── ConnectionRequests.tsx  # Mentor request management
│   │   │   ├── Diary.tsx               # Student journal & mood log
│   │   │   ├── EmergencyContacts.tsx   # Crisis safety & helpline numbers
│   │   │   ├── Home.tsx                # Main student/mentor landing
│   │   │   ├── Login.tsx               # Phone OTP login
│   │   │   ├── MoodTracker.tsx         # Mood analytics & check-in
│   │   │   ├── Profile.tsx             # User profile & preferences
│   │   │   ├── QRConnection.tsx        # Instant QR pairing generator/scanner
│   │   │   ├── Safety.tsx              # Safety guidelines & crisis reporting
│   │   │   ├── SelectMentor.tsx        # Mentor browsing & filtering
│   │   │   ├── SignupElder.tsx         # Mentor profile onboarding
│   │   │   ├── SignupStudent.tsx       # Student profile onboarding
│   │   │   ├── SilentSupport.tsx       # Ambient presence listening mode
│   │   │   ├── StudentDiary.tsx        # Mentor reflection viewer
│   │   │   ├── VerifyIdentity.tsx      # Zero-Knowledge Aadhaar verification
│   │   │   └── WellnessHub.tsx         # Mindful exercises & coping strategies
│   │   ├── routes.ts               # React Router route registry
│   │   └── App.tsx                 # Root application wrapper
│   └── main.tsx                    # Client entry point
│
├── vite.config.ts                  # Vite build configuration
├── package.json                    # Frontend dependencies & scripts
└── README.md                       # Project documentation
```

---

## API Reference

Base URL: `http://localhost:5000/api` (All routes except `/auth/*` require `Authorization: Bearer <token>`)

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/auth/send-otp` | Request OTP for mobile authentication |
| | `POST` | `/auth/verify-otp` | Verify OTP code & proceed to identity check |
| | `POST` | `/auth/register` | Register new user with ZK commitment & profile |
| | `POST` | `/auth/login` | Log in existing user and obtain JWT |
| **Users** | `GET` | `/users/me` | Fetch authenticated user profile |
| | `PUT` | `/users/me` | Update preferences and profile settings |
| | `DELETE` | `/users/me` | Delete account and associated records |
| | `GET` | `/users/mentors` | Retrieve active elder mentors (students only) |
| **Connections** | `POST` | `/connections/request` | Send connection request to an elder mentor |
| | `GET` | `/connections/requests` | List pending connection requests (elder only) |
| | `PUT` | `/connections/requests/:id` | Accept or reject connection request |
| | `GET` | `/connections/mine` | List connected mentor/student relationships |
| | `POST` | `/connections/qr/generate` | Generate temporary QR token for instant pairing |
| | `POST` | `/connections/qr/scan` | Redeem QR token to establish connection |
| **Chat** | `GET` | `/chat/conversations` | Retrieve all active user conversations |
| | `GET` | `/chat/:conversationId/messages`| Fetch paginated message history |
| | `POST` | `/chat/:conversationId/messages`| Send an encrypted message |
| **Diary** | `GET` | `/diary` | Fetch student's own encrypted diary entries |
| | `POST` | `/diary` | Save new encrypted diary entry |
| | `DELETE` | `/diary/:id` | Remove a diary entry |
| | `GET` | `/diary/student/:studentId` | Read-only access for connected mentor |
| **Mood** | `POST` | `/mood` | Record a mood check-in (1–5 scale + note) |
| | `GET` | `/mood` | Retrieve recent mood entries (7/30 days) |
| | `GET` | `/mood/stats` | Aggregated analytics (streak, averages) |
| **Community** | `GET` | `/community/posts` | List anonymous forum posts |
| | `POST` | `/community/posts` | Publish new community post |
| | `POST` | `/community/posts/:id/heart` | Toggle heart reaction on post |
| | `GET` | `/community/encouragement` | Get notes from the Wall of Encouragement |
| | `POST` | `/community/encouragement` | Pin a new note to the Wall |

---

## Getting Started

### Prerequisites
- **Node.js** (version 18.0 or higher)
- **npm** or **pnpm**
- **MongoDB** (Local instance running at `mongodb://localhost:27017` or a MongoDB Atlas URI)

---

### 1. Backend Setup

1. Open a terminal and navigate to the server directory:
   ```bash
   cd server
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create and configure your environment file:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` as needed:*
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mindmate
   JWT_SECRET=your_super_secret_jwt_key_here_minimum_64_characters
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:5173
   ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will boot at `http://localhost:5000` with WebSocket support.*

---

### 2. Frontend Setup

1. Open a second terminal and navigate to the project root:
   ```bash
   cd MindMate
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. (Optional) Configure environment variable for custom API URL in `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
   *(If omitted, it defaults to `http://localhost:5000/api` automatically).*

4. Start the Vite development server:
   ```bash
   npm run dev
   ```

5. Open your browser at:
   ```
   http://localhost:5173
   ```

---

## Security & Privacy Practices

- **Zero-Knowledge Commitments:** Client hashes identity details with a salt so the server only receives and verifies a proof commitment. The actual Aadhaar/government ID never traverses the wire.
- **Defense in Depth:** Every request is validated against schema constraints (`express-validator`), sanitized against NoSQL injection (`mongo-sanitize`), and protected from header exploits (`helmet`).
- **Encrypted Storage:** Journal reflections and message payloads are stored using AES-256-GCM authenticated encryption.
- **Strict Role Isolation:** Student APIs are completely separated from Mentor APIs via role-based access control (RBAC). Mentors cannot read arbitrary student diaries; access is granted only if an accepted connection exists.
- **Rate-Limiting Shields:** Auth and OTP generation endpoints enforce strict window-based rate limits to prevent brute-force and SMS bombing attacks.

---

## Roadmap & Future Enhancements

- [ ] **AI-Assisted Empathetic Triage:** Integrate on-device sentiment analysis to flag acute distress and offer immediate supportive guidance.
- [ ] **DigiLocker / Aadhaar API Integration:** Live integration with Aadhaar Paperless Offline e-KYC or IndiaStack DigiLocker.
- [ ] **Encrypted WebRTC Audio Calls:** Anonymized peer-to-peer audio calls with voice masking for elders and students who prefer voice conversations.
- [ ] **Multi-Language Support:** Hindi, Marathi, Tamil, and other regional language localization for senior mentors.

---

## Contributors & Acknowledgements

- **Project:** MindMate — Major Project (Semester 7)
- **Domain:** Mental Healthcare Technology & Applied Cryptography
- **Inspiration:** Bridging the intergenerational gap to build an empathetic society.