# PHASE 3 — Documents & Rooms (Scoping Collaboration)

## Problem Before Phase 3

In Phase 2 we used global broadcasting:

```js
socket.broadcast.emit("receive-change", content);
```

## Why this is a problem

- Every connected user receives updates
- No concept of multiple documents
- Not scalable
- Impossible to support multiple files, private docs, or per-document ACLs

📉 This design would break at scale.

---

## Objective of Phase 3

Introduce document-level isolation using Socket.IO Rooms so that:

- Each document has its own collaboration space
- Only users working on the same document receive updates
- One document = one room

---

## What I Learned in This Phase

### 1️⃣ What Are Rooms?

Rooms are logical partitions inside a WebSocket server. A socket can join multiple rooms. Messages can be sent to:

- One room
- Multiple rooms
- Everyone except sender

💡 Rooms are not physical servers — just in-memory groupings that let you scope events.

### 2️⃣ Why Rooms Are Critical in Real-Time Apps

Rooms enable:

- Scalability
- Security
- Performance
- Multi-document support

Examples: Google Docs (per document session), Slack (per channel), Zoom (per meeting).

---

## 🛠 What I Implemented

### 3.1 Backend — Join Document Room

File: `server/index.js`

```js
socket.on("join-doc", (docId) => {
  socket.join(docId);
  console.log(`Socket ${socket.id} joined doc ${docId}`);
});
```

**What this does**

When a client opens a document, the backend assigns the socket to a room named after `docId` (for example `doc-123`).

### 3.2 Backend — Scoped Text Updates

```js
socket.on("text-change", ({ docId, content }) => {
  socket.to(docId).emit("receive-change", content);
});
```

**Why `socket.to(docId)`?**

- Sends updates only to users in the same document
- Excludes sender automatically
- Prevents global broadcast chaos

### 3.3 Frontend — Join Document on Load

File: `client/src/App.js`

```js
useEffect(() => {
  socket.emit("join-doc", "doc-123");
}, []);
```

**What happens**

When the editor loads, the client announces which document it is editing and the backend places this socket in that document’s room. This is the document session handshake.

---

## 🔄 Full Data Flow (End-to-End)

1. Client opens document → `join-doc` → Server
   - Server places socket in room `doc-123`.
2. Client types text → `text-change(docId, content)` → Server
3. Server broadcasts to room `doc-123` → other clients receive `receive-change` and update UI

---

## 🎉 Result of Phase 3

- Multiple documents supported
- No cross-document data leaks
- Real collaboration sessions created
- System becomes scalable (independent per-document broadcasts)

Now 100 users can edit 100 different documents with no interference.

---

## HLD LESSON #4 — Rooms as Logical Partitions

Interview-ready explanation:

“Rooms act as logical partitions that isolate real-time traffic per document. This improves scalability, isolation, and performance.”

Benefits:

- Scalability: O(1) broadcast per room
- Isolation: No data leakage
- Performance: Less network traffic
- Security: Easier ACL & auth mapping

**Google interview line:** “We avoid global broadcast by scoping updates to document-specific rooms.”

---

## Git Commit

```bash
git commit -am "Added document rooms for collaboration"
git push
```

---

## How Phase 3 Connects to Next Phases

Phase 3 unlocks:

- CRDT-based syncing (Phase 4)
- Version history per document (Phase 6)
- Permissions per document (Phase 7)

---

## Phase 3 Summary

By the end of this phase:

- Documents became first-class entities
- Collaboration is scoped and isolated
- Architecture moved closer to Google Docs-level design
