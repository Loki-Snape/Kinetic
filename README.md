# Kinetic 🚀

Kinetic is a professional-grade, high-performance, and visually stunning Kanban board designed for agile product development. Built with a modern, glassmorphic dark-theme aesthetic, Kinetic offers real-time synchronization, advanced task metadata, activity logging, and live search.

---

## 🏗️ Architecture & Tech Stack

Kinetic is split into two primary components:
*   **Frontend (`/frontend`)**: Single Page Application built on **React** and **Vite**, using **Tailwind CSS** for custom glassmorphic layout styling, **lucide-react** for iconography, and **@hello-pangea/dnd** for fluid drag-and-drop mechanics.
*   **Backend (`/backend`)**: Lightweight REST & WebSocket API built on **Node.js** and **Express**, using **Prisma ORM** connected to a **Neon PostgreSQL** database. Real-time updates are driven by **Socket.io**.

---

## ✨ Key Features

1.  **Glassmorphic Dark Mode:** High-fidelity UI using translucent surface layers, backing filters, and subtle border lines.
2.  **Drag-and-Drop Task Management:** Move tasks seamlessly within or across columns, synchronizing coordinates in real-time.
3.  **Advanced Metadata Support:**
    *   **Priority Badges:** Dynamic task priority classification (`Low` - Green dot, `Medium` - Orange dot, `High` - Red dot).
    *   **Interactive Tags Input:** Custom tag-chip input box featuring tag creation on pressing `Enter` and deletion via `x` badge buttons.
4.  **Col-options Dropdown (3-Dots):** Actions to "Clear All Tasks" or "Delete Column" instantly.
5.  **Live Search:** Instantly filters tasks by matching text on titles and descriptions on the client side.
6.  **Socket.io Real-Time Synchronization:** Instant updates propagated across all connected clients for task creations, deletions, and moves.
7.  **Auto-healing Auth Interceptors:** Custom Axios client intercepts expired/stale tokens (from database resets) and safely resets local storage before redirecting users to the Login view.

---

## 🗄️ Database Schema (Prisma)

The application models relations in `schema.prisma`:

*   **User:** Owns boards and manages tasks.
*   **Board:** Holds columns and organizes project workspaces.
*   **Column:** Logical board containers storing tasks with custom ordering (`orderIndex`).
*   **Task:** Project cards containing title, description, optional code snippets, priority, tags array, and assignees.
*   **Activity:** Action logs recording changes to tasks, movements, and updates.

---

## 🚀 Getting Started

Follow these steps to spin up the development environment.

### Prerequisites
*   Node.js (v18+)
*   npm or yarn

### 1. Database Setup & Seeding
Navigate to the `/backend` directory:
```bash
cd backend
```

Create a `.env` file matching this template:
```env
DATABASE_URL="your-neon-postgres-url"
JWT_SECRET="supersecretjwt"
PORT=5000
```

Deploy the database schema using Prisma:
```bash
npx prisma db push
```

Run the database seed script to setup the default board, columns, and seed tasks:
```bash
node seed.js
```
*Seeder will create a default user `dev@kinetic.app` with the password `password123`.*

### 2. Start the Backend API
From the `/backend` folder:
```bash
node server.js
```
The server will start on port `5000` with WebSocket support.

### 3. Start the Frontend App
Navigate to the `/frontend` directory:
```bash
cd ../frontend
```

Install packages and boot the Vite development server:
```bash
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🔑 Demo Access
Log in to the seeded board using the following credentials:
*   **Email:** `dev@kinetic.app`
*   **Password:** `password123`
