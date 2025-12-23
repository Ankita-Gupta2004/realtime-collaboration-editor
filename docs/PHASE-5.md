# PHASE 5 — Persistence & Database (Snapshots & Versioning)

---

## The Problem (What Breaks Without Phase 5?)

Imagine you're using a Google Docs-like editor with your team. You and a colleague are both editing a document in real-time. The CRDT magic from Phase 4 ensures that both of you see the same text on screen — edits merge seamlessly, no conflicts.

**But then something happens:**

❌ **Scenario 1: Server Crashes**

- Your server process crashes and restarts.
- All clients reconnect and ask the server: "What's the document state?"
- The server has no memory of the document — it's gone!
- Users see a blank document. All their work appears lost (though Yjs may have it locally in browser memory).

❌ **Scenario 2: Browser Tab Closes**

- A user closes their browser tab accidently.
- The document state was never saved to disk.
- When they reopen the app, the document is blank again.

❌ **Scenario 3: Regulatory/Audit Requirements**

- Your company needs to prove: "What did the document look like at 3 PM on December 1st?"
- Without saved versions, you cannot answer. No history = no audit trail.

❌ **Scenario 4: Undo Far Back in Time**

- A user wants to restore the document to how it looked 2 hours ago.
- No snapshots = impossible.

---

## The Solution (Phase 5)

Phase 5 adds **persistent storage** — saving the document to a database at regular intervals. Think of it like a "Save" button in traditional editors, but automatic.

**How it works (plain English):**

1. **Every 30 seconds** (or when important changes happen), the server takes a "snapshot" of the document state.
2. The snapshot is a compressed, binary representation that captures all text and formatting.
3. This snapshot is stored in a **database** (MongoDB in our case) — which is like a reliable hard drive that survives server crashes.
4. A **timestamp** and **preview** are stored alongside each snapshot for easy browsing.
5. Users can now:
   - Restore to an old version by clicking "Restore" in the UI.
   - Browse a history of who edited what and when.
   - Know their work is safe even if the server crashes.

**Example flow:**

```
User types: "Hello world"
  ↓
30 seconds pass
  ↓
Server: "Time to save. Let me take a snapshot."
  ↓
Snapshot (binary) → Database
  ↓
Server crashes (whoops!)
  ↓
Server restarts
  ↓
New client connects: "Hi, what's the document?"
  ↓
Server fetches latest snapshot from database
  ↓
Server sends snapshot to client
  ↓
Client: "Great, I see 'Hello world' — ready to edit!"
```

---

## Key Insights (Non-Technical)

- **Persistence ≠ Real-Time Sync**: Phase 4 made real-time sync work (CRDT). Phase 5 makes sure edits don't disappear.
- **Database as Insurance**: Think of the database as insurance. Edits are safe because they're written to disk.
- **Snapshots vs. Continuous Saves**: We don't save every keystroke (too slow). We save smart snapshots every 30s or when content changes meaningfully.
- **Preview for Human Readability**: The "preview" (first 200 chars) lets users browse history without loading entire documents.

---

## Objective of Phase 5

Add a durable persistence layer so document state and historical versions are stored reliably. Implement periodic snapshotting, a `versions` collection for history, and restore/preview flows used by the UI.

This phase focuses on:

- Snapshot strategy (when/how to save)
- Database schema and indexing
- Efficient transport of Yjs binary updates
- Restore, preview, and retention policies

---

## Why Persistence?

- CRDTs solve correctness across clients, but process/machine crashes and server restarts require durable storage.
- Snapshots enable:
  - Recovering document state after server restart
  - Version history, previews, and user-initiated restores
  - Auditing and backup

---

## Storage Choices & Tradeoffs

- Database: MongoDB (used in this repo) — flexible JSON + Binary storage.
- Snapshot format: store Yjs updates (binary) as BSON Binary or base64-encoded strings.
- Alternatives: Postgres + bytea, cloud object storage (S3) for large binaries, but Mongo is convenient for quick prototyping.

Key requirements:

- Efficient write path (do not block the realtime loop)
- Compact storage (store encoded update, or periodic compacted state)
- Fast reads for restore and preview

---

## Schema (recommended)

Collection: `versions`

Document example:

```json
{
  "_id": ObjectId,
  "docId": "doc-123",
  "createdAt": ISODate,
  "snapshot": <Binary>,         // Y.encodeStateAsUpdate(ydoc) (stored as Binary or base64 string)
}
```

Indexes:

- { docId: 1, createdAt: -1 } // query most recent versions per document

Retention / compaction policy:

- Keep N latest snapshots per document (e.g., 50) and/or delete snapshots older than X days.
- Optionally compact many updates into one full state occasionally to reduce storage.

---

## Snapshot Creation (server-side pattern)

Use Yjs utilities to encode state:

```javascript
const snapshot = Y.encodeStateAsUpdate(ydoc); // Uint8Array
// store snapshot as Buffer in Mongo
const buf = Buffer.from(snapshot);
await db
  .collection("versions")
  .insertOne({
    docId,
    createdAt: new Date(),
    snapshot: buf,
    snapshotSize: buf.length,
    preview: previewText,
  });
```

Best practices:

- Debounce / throttle saves (e.g., at most once every 30s, or when content changed).
- Offload saving to a background worker or a short-lived queue to avoid blocking realtime message handling.
- Compute a small `preview` string for quick UI listing (first 200 chars).

---

## Restore Flow (server + client)

Server endpoint (example): `GET /history/restore/:id` returns base64 snapshot payload.

Client-side restore:

1. Fetch snapshot (base64) from `history/restore` endpoint.
2. Decode base64 → Uint8Array → `Y.applyUpdate(tempDoc, bytes)`.
3. Extract text from `tempDoc.getText('shared-text')`.
4. Apply to live `ydoc` inside a transaction to avoid corrupting CRDT state.

Security note: validate permissions for who can restore or view snapshots.

---

## Preview Generation

- Store a short `preview` string (plain text) when saving to enable history list rendering without decoding full binary snapshots.
- Alternatively, generate preview from a compacted HTML/text representation server-side and store it alongside snapshot.

---

## Performance & Storage Tips

- Avoid storing every tiny change — use time-based or meaningful-change thresholds.
- Compress or dedupe snapshots: only store when the content hash differs from last saved snapshot.
- Consider storing full snapshot occasionally and differential updates (update deltas) in between, if you need economical storage.

---

## Implementation Checklist (server)

- [ ] Add `versions` collection writes in persistence module (see `server/persistence.js`).
- [ ] Provide `GET /history/:docId` and `GET /history/restore/:id` endpoints (already present in repo; verify binary handling).
- [ ] Implement retention/cleanup script (cron or manual) to prune old snapshots.
- [ ] Add indices on `docId` and `createdAt`.

## Implementation Checklist (client)

- [ ] Save small `preview` string when snapshotting.
- [ ] Implement preview modal that fetches and decodes snapshot (already implemented in this repo).
- [ ] Add UI to list and restore versions (already implemented; verify server returns base64 correctly).

---

## Testing & Validation

- Create edits in two tabs, trigger a manual save, verify a new `versions` document appears in Mongo.
- Test restore flow: open preview, click restore, ensure live document updates correctly.
- Simulate server restart and ensure that fetching the latest snapshot and applying it brings clients to the durable state.

---

## Interview / System Design Lines

- `Persistence is achieved by periodically encoding Yjs state and storing binary snapshots in a versions collection; the client restores by applying the encoded update into a temporary Y.Doc and then merging into the live document inside a transaction.`
- `We debounce saves and dedupe identical snapshots by content hash to limit storage.`

---

## Git Commit

```bash
git commit -am "Add persistence: Yjs snapshots and versions collection"
git push
```

---
