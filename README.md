# CodeNest 🚀

CodeNest is a real-time collaborative, browser-based sandbox and developer assessment platform. It allows interviewers and recruiters to create coding environments, generate assessment links, and conduct pair-programming sessions with candidates seamlessly directly in the browser. 

---

## 🌟 Features

* **Browser-based IDE**: A full-fledged code editor powered by Monaco Editor, supporting syntax highlighting, auto-completion, and live error reporting.
* **Instant Live Preview**: Powered by CodeSandbox's `Sandpack`, enabling instant bundling and live previewing for React and Vanilla JavaScript without requiring local dev environments.
* **Real-time Collaboration**: Built with Socket.io, allowing multiple users to simultaneously edit files, create folders, and see real-time updates within the same workspace.
* **Candidate Assessment Workflows**:
  * **Master Assessment Links**: Recruiters can create reusable assessment templates. 
  * **Timed Sessions**: Assessment rooms automatically track elapsed time and gracefully lock upon expiry.
  * **Auto-submit**: Automatically saves candidate code to the database on completion.
* **Persistent File System**: A robust virtual file system using MongoDB to store complex nested directory structures.
* **Package Management**: Install NPM dependencies directly within the browser, handled seamlessly by Sandpack.

---

## 🏗️ Folder Architecture

The application is structured as a monorepo consisting of a frontend `client` and a backend `server`.

```text
CodeNest/
├── client/                     # Frontend React (Vite) Application
│   ├── src/
│   │   ├── components/         # React UI Components
│   │   │   ├── Auth/           # Login & Signup flows
│   │   │   ├── Editor/         # Monaco Editor integration & Tabs
│   │   │   ├── FileTree/       # Recursive folder tree navigation
│   │   │   ├── Layout/         # Resizable panels & Navigation
│   │   │   ├── Sandbox/        # Sandpack Provider, Preview & Package Installer
│   │   │   ├── Terminal/       # Interactive Terminal UI
│   │   │   └── Workspace/      # Interviewer & Candidate Dashboards
│   │   ├── hooks/              # Custom React hooks (useProject, useSocket)
│   │   ├── services/           # Axios API integrations
│   │   ├── store/              # Zustand state management (FileStore, ProjectStore)
│   │   ├── utils/              # Helper functions
│   │   ├── App.jsx             # Main router
│   │   └── main.jsx            # Entry point
│   ├── index.css               # Global CSS & Tailwind imports
│   └── package.json            # Client dependencies
│
└── server/                     # Backend Express Application
    ├── config/                 # DB and Environment config
    ├── controllers/            # Route logic (projects, files, rooms, assessments)
    ├── middleware/             # Express middlewares (Auth, CORS, Error Handling)
    ├── models/                 # Mongoose Schemas (User, Project, File, Room, Assessment)
    ├── routes/                 # Express API routes
    ├── socket/                 # Socket.io event handlers (file-update, file-delete, join-room)
    ├── index.js                # Server entry point
    └── package.json            # Server dependencies
```

---

## 🛣️ API Routes

### Authentication (`/api/auth`)
* `POST /api/auth/register` - Create a new interviewer account
* `POST /api/auth/login` - Authenticate and receive a token
* `GET /api/auth/me` - Get current user profile

### Projects (`/api/projects`)
* `GET /api/projects` - Get all projects for the logged-in user
* `GET /api/projects/:id` - Fetch project details and its associated files
* `POST /api/projects` - Create a new project (seeds default framework files)
* `DELETE /api/projects/:id` - Delete a project

### Files (`/api/files`)
* `GET /api/files/:projectId` - Fetch all files for a specific project
* `POST /api/files` - Create a new file or directory (supports `.gitkeep` for empty folders)
* `PATCH /api/files/:id` - Update file content
* `DELETE /api/files/:id` - Delete a file

### Assessments & Rooms (`/api/assessments`, `/api/rooms`)
* `POST /api/assessments` - Create a new "Master Link" assessment template
* `GET /api/assessments` - List all assessments
* `POST /api/assessments/join/:id` - Candidate joins an assessment (spawns a unique session/room)
* `GET /api/rooms/:id` - Fetch live room state, files, and countdown timer
* `POST /api/rooms/save/:id` - Auto-save / Manual submit candidate's progress

---

## 🛠️ Setup Instructions

### Prerequisites
* **Node.js** (v18+ recommended)
* **MongoDB** (Local instance or MongoDB Atlas)

### 1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd CodeNest
\`\`\`

### 2. Backend Setup
\`\`\`bash
cd server
npm install
\`\`\`
Create a `.env` file in the `server` directory:
\`\`\`env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
\`\`\`
Start the backend development server:
\`\`\`bash
npm run dev
\`\`\`

### 3. Frontend Setup
Open a new terminal window:
\`\`\`bash
cd client
npm install
\`\`\`
Start the Vite development server:
\`\`\`bash
npm run dev
\`\`\`

### 4. Open the Application
Navigate to \`http://localhost:5173\` in your web browser. You can create an account, generate projects, and share assessment links to test the real-time collaboration.
