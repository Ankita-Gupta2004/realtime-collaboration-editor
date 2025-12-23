# PHASE 1 — Backend Skeleton & Real-Time Foundation

**Short summary**

This phase established the backend foundation required for real-time collaboration. The goal was not to build all features, but to create a reliable base (HTTP server + WebSocket layer) so future phases (CRDT sync, persistence, presence, versioning) can be implemented on top.

This document explains what was done, why each decision was made, how to run and test the code, and the main technical lessons learned.

---

## Objectives

- Create a minimal backend that supports persistent, bidirectional connections.
- Provide a small, verifiable test harness to validate WebSocket handshakes and basic connectivity.
- Document why WebSockets are necessary and what this phase enabled for later work.

---

## High-level decisions and rationale

- Real-time collaboration requires a persistent channel for instantly propagating small edits. HTTP request/response is insufficient (stateless, higher latency).
- `socket.io` was chosen instead of a low-level ws implementation because it provides connection management, reconnection, and a stable API for rooms and events, speeding up iteration.

---

## What I implemented (step-by-step)

1. Initialize backend project

```bash
cd server
npm init -y
npm install express cors socket.io
```

Why: `express` gives a simple HTTP server and routing, `cors` enables the dev frontend to talk to the backend, and `socket.io` provides a proven WebSocket layer.

2. Create a server entry point

File: `server/index.js`

```javascript
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
```

What this achieves:

- A basic Express HTTP server (useful for future REST endpoints and health checks).
- An attached Socket.IO server that handles WebSocket handshakes and maintains persistent connections.

---

## How to run & verify locally

1. Start the backend

```bash
cd server
node index.js
```

2. Verify in logs

When a client connects, the server logs `User connected: <socket-id>`.

3. Quick client test (Node)

```javascript
// quick-test-client.js
const io = require("socket.io-client");
const socket = io("http://localhost:5000");
socket.on("connect", () => console.log("connected", socket.id));
```

Run `node quick-test-client.js` in another terminal and confirm the server printed a new connection.

---

## Repo files touched in this phase

- `server/index.js` — entry point, Express + Socket.IO setup.
- `server/package.json` — dependencies.
- (small commits) — initial `git` commits to capture the phase checkpoint.

---

## Key learnings (technical and process)

- Backend-first approach is essential for collaboration features — the server enforces a single coordination point.
- WebSockets are not optional for low-latency collaboration; they are the appropriate primitive.
- Choosing a higher-level library (Socket.IO) accelerates development thanks to built-in reconnection, rooms, and cross-browser compatibility.

---

## Next steps & recommended Phase 2 scope

Phase 2 should focus on document state synchronization and persistence:

- Integrate a CRDT library (Yjs) to manage document state across clients.
- Add a persistence strategy (periodic snapshots + versioning in a `versions` collection).
- Implement a simple REST API to list saved versions and restore snapshots.
- Add basic presence/awareness (who is online, cursors) using Yjs awareness or socket rooms.

---

## Notes for reviewers

- This phase intentionally kept scope small and testable. It is a springboard for the more complex, correctness-focused phases (CRDT + persistence).
- If you want this written as a short README or as a developer diary with timestamps and commit links, tell me which format and I'll produce it.

---

## Contact / Author

This document was authored as part of the realtime-collaboration-editor project. For questions, request the Phase 2 plan and I will expand the documentation accordingly.
