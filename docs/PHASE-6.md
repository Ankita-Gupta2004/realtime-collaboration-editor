# PHASE 6 — Version History & Time Travel (Google Docs–style)

---

## The Problem (What's Missing Without Phase 6?)

You're collaborating on an important document with your team. Over the course of a week, many people make changes — some good, some accidental, some even malicious (a disgruntled team member deletes the entire document!).

**Common painful scenarios:**

❌ **Scenario 1: Accidental Delete**

- Someone accidentally deletes 10 paragraphs of important text.
- Nobody knows how to undo it across all devices — local undo won't work if they've closed the browser.
- The document is ruined, and there's no way to get the text back.

❌ **Scenario 2: "Who Did This?"**

- You notice an important sentence was changed to something confusing.
- You ask your team: "Who modified this? When?"
- Nobody remembers. No audit trail = impossible to know.

❌ **Scenario 3: Wanting to See How It Looked Last Week**

- A deadline is approaching, and your manager asks: "Show me what the document looked like before we started editing."
- Without a version history, you can't show them. You can only guess from your memory.

❌ **Scenario 4: "Undo" Has Limits**

- Browser undo only works locally and for a few minutes.
- You close your browser — undo history is lost forever.
- There's no way to recover versions from days or weeks ago.

---

## The Solution (Phase 6)

Phase 6 builds **Version History & Time Travel** — think of it like a film director's "take" system. Every 30 seconds, the editor automatically saves a snapshot with:

- **What the document looked like**
- **When it was saved** (timestamp)
- **Who was editing** (optional: user name)
- **A preview** (first few lines of text for easy browsing)

**How it works (plain English):**

1. **Automatic Snapshots**: Every 30 seconds, the server saves a version.
2. **Timeline View**: In the UI, users see a list of all saved versions (sorted newest first).
3. **Preview on Hover**: When you hover over a version, you see a preview of what the document looked like at that time.
4. **Restore**: Click "Restore this version" and the entire document goes back to that point in time.
5. **Diff/Compare**: (Advanced) You can pick two versions and see what changed between them (added text highlighted green, removed text highlighted red).

**Example timeline:**

```
Today, 3:45 PM  — "Hello world, this is our best document yet"
Today, 3:15 PM  — "Hello world, this is our"
Today, 2:45 PM  — "Hello world"
Today, 2:15 PM  — "H"
Yesterday, 6:00 PM — "Our amazing report for the board meeting"
```

Users can click any version and instantly jump back to how the document looked at that time.

---

## Key Insights (Non-Technical)

**Version History = Safety Net**

- Every edit is tracked (non-destructively) in the database.
- Users can always recover old versions without fear.
- This builds trust in collaborative tools.

**Automatic, Not Manual**

- Unlike traditional "Save" buttons, versions are created automatically.
- Users don't have to think about saving — it just happens.
- This is why Google Docs feels safe and modern.

**Preview Before Restore**

- Users can browse and preview versions before restoring.
- This prevents accidental restores to the wrong version.

**Who Changed What**

- Optionally, each version can record the username.
- This creates an audit trail: "Ankit changed it at 3 PM, Sarah changed it at 4 PM."
- Helpful for accountability and debugging disputes.

**Compare & Diff**

- Advanced users can use "Compare" to see exactly what changed between two versions.
- Green = added text, Red = deleted text.
- This is how you answer: "When was this sentence removed?"

---

## Objective of Phase 6

Build a user-friendly Version History UI and time-travel restore logic that:

- Lists all saved versions with timestamps and previews
- Allows users to restore any past version
- Shows a diff/comparison between two versions
- Records author information (optional)
- Deletes old versions to save disk space (retention policy)

---

## How It Works (Technical but Simple)

### Backend (Server)

**Storage:**

- Phase 5 already saves snapshots to a `versions` collection.
- Each snapshot has: `docId`, `createdAt`, `snapshot` (binary), `preview` (text), `author`.

**Endpoints:**

- `GET /history/:docId` → returns all versions for a document (sorted by date, newest first).
- `GET /history/restore/:versionId` → returns the binary snapshot.

### Frontend (Client)

**Version List UI:**

- Displays: timestamp, preview, author.
- Buttons: "View preview" (modal), "Restore this version", "Compare with another".

**Preview Modal:**

- Shows the full text of a past version without restoring it yet.
- User can read and verify before deciding to restore.

**Restore Flow:**

1. User clicks "Restore this version".
2. Client fetches the snapshot from server.
3. Snapshot is decoded (from binary back to text).
4. The live document is updated to match the snapshot.
5. All users see the document revert to that point in time.

**Compare/Diff Feature:**

- User selects two versions (Version A and Version B).
- Client fetches both snapshots.
- A diff algorithm compares them and highlights:
  - **Green**: text added in Version B
  - **Red**: text removed in Version B
- Display side-by-side or inline (inline is simpler).

---

## Database Schema (From Phase 5, Used Here)

```json
versions collection:
{
  "_id": ObjectId,
  "docId": "doc-123",
  "createdAt": ISODate("2025-12-23T15:30:00Z"),
  "snapshot": <Binary>,      // the document state at this point
  "snapshotSize": 5432,      // bytes
  "preview": "Hello world...",
  "author": "Ankit"          // who triggered the save
}
```

**Index:**

- { docId: 1, createdAt: -1 } — to quickly fetch all versions for a doc, sorted by date.

---

## Implementation Checklist

### Server-side:

- [x] `GET /history/:docId` endpoint (already present in repo).
- [x] `GET /history/restore/:id` endpoint (already present in repo).
- [ ] Add author field when saving versions.
- [ ] Add retention policy (e.g., keep only last 50 versions, or versions from last 30 days).

### Client-side (React):

- [x] Display version list with timestamps, previews, author.
- [x] "View preview" modal.
- [x] "Restore this version" button.
- [x] Compare two versions with diff highlights (green/red).
- [ ] Add author display in version list.
- [ ] Add date grouping (Today, Yesterday, This Week, Older).

---

## Testing & Validation

**Scenario 1: Version Restore**

1. Open editor, type "Hello".
2. Wait 30 seconds (snapshot saved).
3. Type " World" (now shows "Hello World").
4. Wait 30 seconds (snapshot saved).
5. Open History, click "Restore" on the first version ("Hello").
6. Document now shows "Hello" again.

**Scenario 2: Preview Without Restoring**

1. Open History.
2. Hover/click "View preview" on an old version.
3. See the text in a modal.
4. Close modal without restoring.
5. Live document is unchanged.

**Scenario 3: Compare Two Versions**

1. Open History.
2. Mark Version A (green button).
3. Mark Version B (red button).
4. Click "Compare".
5. See green highlights for added text, red for removed. ✅

---

## Key Metrics & What This Proves

**For Interviews / System Design:**

- **You understand CRDT history**: You know that CRDTs create commutative operations that can be stored and replayed.
- **You understand user experience**: Version history is not just a feature — it's trust. "My work is safe" is a core promise.
- **You understand distributed systems**: Multi-user edits need safe undo/recovery mechanisms.
- **You understand databases**: Indexing, retention policies, and efficient querying matter.

**Interview lines:**

- "Version history is implemented by storing periodic snapshots of the CRDT state and allowing users to restore or compare any saved version."
- "We debounce saves to avoid storage bloat, and use content hashing to avoid duplicate snapshots."
- "Preview is rendered without restoring, so users can verify before time-traveling."

---

## Git Commit

```bash
git commit -am "Add version history and time-travel restore UI with diff compare"
git push
```
