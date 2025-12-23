# PHASE 2 — Frontend Skeleton (React)

📌 Objective of Phase 2

To build a minimal frontend editor and connect it to the backend using WebSockets, enabling live text synchronization between multiple users.

This phase focuses on:

- Creating the React client
- Establishing real-time communication with the backend
- Proving that multi-client sync works

---

## 🧠 What I Learned in This Phase

### 1️⃣ Frontend’s Role in Real-Time Systems

- Backend handles:
  - Connection management
  - Broadcasting updates
- Frontend handles:
  - User input
  - Rendering state updates
  - Sending changes to server

➡️ Frontend is reactive; backend is authoritative.

### 2️⃣ Client-Side WebSocket Connections

- Each browser tab creates its own WebSocket connection.
- The socket stays alive while the page is open.
- Events flow continuously without full-page refreshes.

---

## 🛠 What I Implemented

### 2.1 Create React Application

Commands used (if you followed Phase 1 in this repo):

```bash
cd ..
npx create-react-app client
cd client
npm install socket.io-client
```

**Why `socket.io-client`?**

- Browser-compatible WebSocket client
- Automatic reconnect
- Higher-level API that simplifies event handling

### 2.2 Connect Frontend to WebSocket Server

File: `client/src/socket.js`

```javascript
import { io } from "socket.io-client";

// Point to your backend (change port if needed)
const socket = io("http://localhost:5000");

export default socket;
```

**What this does**

- Creates a shared socket instance that can be imported across components
- Avoids redundant connections and centralizes socket configuration

### 2.3 Build a Minimal Editor UI

File: `client/src/App.js` (minimal example)

```javascript
import { useEffect, useState } from "react";
import socket from "./socket";

function App() {
  const [text, setText] = useState("");

  useEffect(() => {
    socket.on("receive-change", (content) => setText(content));
    return () => socket.off("receive-change");
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);
    socket.emit("text-change", value);
  };

  return (
    <textarea
      value={text}
      onChange={handleChange}
      style={{ width: "100%", height: "100vh" }}
    />
  );
}

export default App;
```

### 2.4 Backend Socket Logic (update)

Add server-side handler to broadcast changes:

```javascript
// inside io.on('connection', socket => { ... })
socket.on("text-change", (content) => {
  socket.broadcast.emit("receive-change", content);
});
```

**Why `broadcast`?** Prevents the server from echoing the message back to the sender and avoids infinite loops.

---

## How Real-Time Sync Works (Step-by-Step)

1. User types inside `<textarea>` → `handleChange()` fires.
2. Local UI is updated with `setText(value)`.
3. Client emits `text-change` event to server (`socket.emit('text-change', value)`).
4. Server receives and broadcasts `receive-change` to other clients.
5. Other clients receive `receive-change` and update their UI.

This is a classic Pub/Sub pattern with the server acting as the broker.

---

## How to Run & Test

Start server:

```bash
# server terminal
cd server
node index.js
```

Start client:

```bash
# client terminal
cd client
npm start
```

Test scenario:

- Open two browser tabs (or two devices) to the client app.
- Type in one tab — text should appear instantly in the other tab.

---

## Results of Phase 2

- React frontend created
- WebSocket client integrated
- Live multi-user editing achieved
- Pub/Sub architecture demonstrated

This confirms the end-to-end real-time flow and prepares the codebase for conflict-resolution and CRDT integration in Phase 3.

---

## HLD LESSON #3 — Pub-Sub Architecture

This system implements a Publish–Subscribe model:

- Publisher: client sending a text-change
- Broker: backend server
- Subscriber: other connected clients

Why this matters: decouples senders from receivers, simplifies scaling and reasoning about update flow.

Suggested phrasing for interviews: “Phase 2 implements a Pub-Sub model where the server acts as the message broker.”

---

## Outcome & Next Steps

Phase 2 unlocks:

- Conflict resolution (Phase 3)
- CRDT/Yjs integration for concurrent edits
- Version history and persistence
- Multi-cursor support and presence
