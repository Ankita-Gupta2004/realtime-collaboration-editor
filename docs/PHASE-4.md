# PHASE 4 — CRDT (MOST IMPORTANT)

## Objective of Phase 4

Integrate a battle-tested CRDT (Yjs) to make concurrent editing correct and robust. This phase replaces naive broadcasts with CRDT-based merge semantics so multiple users (and offline clients) can edit without data loss.

---

## Why CRDT?

- Without CRDT: concurrent edits overwrite each other → data loss.
- With CRDT: operations are merged deterministically → eventual consistency.

CRDTs remove the need for a centralized operation ordering and make offline edits safe.

**Interview line (FAANG-ready):**

“I chose CRDT over OT because CRDT allows offline edits, peer-to-peer merging, and avoids central ordering complexity.”

---

## 4.1 Install Yjs

Run in the client (and server if using y-websocket):

```bash
# client
npm install yjs y-websocket y-protocols y-indexeddb

# server (optional when running a dedicated y-websocket server)
npm install y-websocket
```

We do NOT implement CRDT from scratch — we integrate Yjs.

---

## 4.2 Conceptual Flow (MEMORIZE THIS)

1. Each client edits locally in a `Y.Doc` (fast, local operations).
2. Yjs generates updates (binary ops) describing changes.
3. Updates are sent to peers (via a provider such as `y-websocket`).
4. Each client applies received updates to their `Y.Doc`.
5. Yjs merging is conflict-free: no manual resolution required.

Say this plainly in interviews: “Each client edits locally → CRDT emits ops → ops are merged automatically → no conflicts.”

---

## Integration Notes — Server

Options:

- Use the official `y-websocket` server (recommended) which handles update routing.
- Or embed Yjs server-side logic into your existing socket infra.

Example: run a y-websocket server (simple):

```bash
npx y-websocket-server --port 1234
```

This server accepts WebSocket connections and routes updates per-document (room), keeping memory-based state if needed.

If you want persistence, capture Yjs snapshots (Y.encodeStateAsUpdate / Y.encodeStateVector) and store them (e.g., MongoDB) periodically.

---

## Integration Notes — Client

Minimal client pattern (conceptual):

- Create a `Y.Doc()` per open document.
- Use `WebsocketProvider` (from `y-websocket`) to connect to `ws://your-server:1234/doc-id`.
- Bind a `Y.Text` type to your textarea/editor.
- Use `awareness` to share cursors/names.

Example (pseudo):

```javascript
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const ydoc = new Y.Doc();
const provider = new WebsocketProvider("ws://localhost:1234", docId, ydoc);
const ytext = ydoc.getText("shared-text");

// React binding: update textarea when ytext changes
ytext.observe(() => setText(ytext.toString()));

// Local edits push into ytext; Yjs generates updates automatically
// Provider syncs updates to server (and other clients)
```

Use `awareness` to broadcast `user: { name, color }`, `cursor`, and `typing` state.

---

## Persistence & Versioning (practical tip)

- Save periodic snapshots using `Y.encodeStateAsUpdate(ydoc)` (binary) and store as base64/Binary in your DB.
- To restore: fetch snapshot → decode → `Y.applyUpdate(tempDoc, snapshot)` → extract text → apply to live doc via a transaction.

This approach gives reproducible document versions and supports the history/restore UI implemented earlier.

---

## Testing & Validation

- Run `npx y-websocket-server` locally.
- Open two client tabs pointing to the same `docId`.
- Type concurrently in both tabs — edits should merge without loss.
- Test offline: disconnect one tab, make edits, reconnect — edits should merge.

---

## Git Commit

When integrated, commit like:

```bash
git commit -am "Integrated CRDT-based editing using Yjs"
git push
```

---

## Interview / System Design Talking Points

- CRDTs permit offline edits and peer-to-peer merging.
- Yjs is used to avoid implementing CRDTs from scratch and provides providers (websocket, indexeddb) out of the box.
- Persistence is achieved with snapshots/updates; version history uses stored snapshots.

---

## Next steps (Phase 5+)

- Hook Yjs `awareness` into UI for multi-cursor and presence UX.
- Add server-side snapshot persistence and compacting strategy.
- Implement access control (Phase 7) before exposing documents publicly.

---
