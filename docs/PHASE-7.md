# PHASE 7 — Presence (Cursor & User Name)

---

## The Problem (What's Missing Without Phase 7?)

You're editing a document with two colleagues in real-time. Everything is working — text syncs, versions are saved, but something feels... wrong. **You have no idea what the other people are doing.**

**Painful scenarios:**

❌ **Scenario 1: Editing the Same Sentence**

- You start typing a new section at the bottom of the document.
- Your colleague is simultaneously editing the middle section.
- You can't see their cursor — so you don't know they're working nearby.
- You both end up editing overlapping areas and get confused about what changed where.
- "Wait, who edited paragraph 3?"

❌ **Scenario 2: Typing Collision**

- You're writing: "The product is amazing because..."
- Your colleague is also typing at the same spot (they're not sure if you're there).
- Your texts interleave randomly, creating: "The product amazing is because..."
- Both of you are confused about what went wrong.

❌ **Scenario 3: "Who's Editing Right Now?"**

- You open a shared document.
- You don't know if anyone else is currently editing.
- You don't know their names, locations, or what part of the document they're working on.
- You feel alone, even though you're collaborating.

❌ **Scenario 4: Connection Mystery**

- Someone connects to the document but doesn't type anything.
- You don't know they're there.
- Later, they ask "Did you see my cursor?" but you never saw anything.
- Missing presence = broken communication.

---

## The Solution (Phase 7)

Phase 7 adds **Presence** — a real-time display of who is editing and where. This includes:

1. **User Names** — each person sees their own name and the names of everyone else editing.
2. **Cursor Positions** — each user's text cursor (blinking line) is visible to others, with a colored highlight.
3. **Typing Indicators** — when someone is actively typing, a visual badge shows "📝 Sarah is typing..."
4. **User Avatars/Colors** — each user gets a unique color for their cursor and name (blue for Ankit, red for Sarah, green for Mike, etc.).

**How it works (plain English):**

```
Ankit opens the doc
  ↓
Server: "Ankit just joined, I'll tell everyone else"
  ↓
Sarah sees: "Ankit (blue) is here"
Mike sees: "Ankit (blue) is here"
  ↓
Ankit starts typing
  ↓
Server broadcasts: "Ankit's cursor is at position 234, he's typing"
  ↓
Sarah & Mike see: Ankit's blue cursor moving, "Ankit ✍️ typing..."
  ↓
Ankit stops typing for 2 seconds
  ↓
Typing indicator disappears, but his cursor is still visible
  ↓
Mike starts typing elsewhere
  ↓
Everyone sees Mike's cursor light up in a different color
```

**Real-world example:**

Imagine Google Docs:

- You see your colleagues' names in the top-right corner.
- You see their colored cursors in the document (red line for Sarah, blue for Ankit).
- When they type, their cursor moves and a "typing" badge appears.
- You know exactly what they're doing and where, preventing conflicts.

---

## Key Insights (Non-Technical)

**Presence = Awareness**

- Without presence, users are isolated — collaboration feels broken.
- With presence, users feel connected and coordinated.
- This is the difference between a spreadsheet and Google Sheets.

**Prevents Accidental Conflicts**

- Seeing someone's cursor tells you: "Don't edit here, I'm working on it."
- This human-readable signal prevents most conflicts naturally.
- Better than code-level conflict detection — users just avoid each other.

**Creates a Sense of Togetherness**

- Users feel like they're in the same room, even if they're continents apart.
- "I see my team is here, working with me" → psychological trust.

**Typing Indicator is Critical**

- "✍️ Sarah is typing..." tells you she's active (not just idle).
- Prevents duplicate edits and confusion.
- Similar to chat apps where you see "someone is typing...".

**Colors Matter**

- Each user gets a unique color.
- Easier to say: "The blue cursor on line 5 is mine" (instead of "the cursor").
- Colors reduce cognitive load.

---

## Objective of Phase 7

Build a real-time presence system that:

- Broadcasts each user's name, color, and cursor position to all other users in the same document.
- Shows live typing indicators.
- Updates cursors as users move their selection or type.
- Works seamlessly with the CRDT system (Phase 4+).
- Cleans up user presence when they disconnect.

---

## How It Works (Technical but Simple)

### Yjs Awareness (Built-in to Yjs)

Yjs includes a built-in **Awareness** protocol for sharing non-document state (like presence). It's designed specifically for this.

**What Awareness does:**

- Each client maintains a local state object: `{ user: { name, color }, cursor: { index }, typing: true/false }`
- This state is broadcast to all peers via the WebSocket provider.
- When a peer's state changes, an event fires and the UI updates.
- When a peer disconnects, their state is automatically cleaned up.

### Server-side (minimal)

The Yjs WebSocket provider (y-websocket-server) handles awareness automatically — no server code needed! The server just passes awareness messages between clients.

### Client-side (React)

```javascript
// Setup (already in this repo's yjs.js)
const awareness = provider.awareness;

// Broadcast local state
awareness.setLocalState({
  user: { name: "Ankit", color: "#3f51b5" },
  cursor: { index: 42, line: 5 },
  typing: true,
});

// Listen for changes from others
awareness.on("change", (changes) => {
  const remoteUsers = Array.from(awareness.getStates().entries())
    .filter(([clientId, state]) => clientId !== awareness.clientID)
    .map(([clientId, state]) => ({
      clientId,
      name: state.user?.name,
      color: state.user?.color,
      cursor: state.cursor,
      typing: state.typing,
    }));

  setRemoteUsers(remoteUsers);
});
```

### UI Rendering

**Show Remote Cursors:**

```javascript
remoteUsers.forEach((user) => {
  // Draw a line at user.cursor.index with user.color
  renderCursor(user.cursor.index, user.color);
});
```

**Show Names & Typing:**

```javascript
remoteUsers.forEach((user) => {
  const label = user.typing ? `${user.name} ✍️ typing...` : user.name;
  // Display label with user.color background
  renderUserBadge(user.name, label, user.color);
});
```

---

## Implementation Checklist

### Server:

- [x] Use y-websocket-server (handles awareness automatically).
- [ ] Optionally log presence events for analytics.

### Client:

- [x] Initialize awareness with user info (name, color).
- [x] Update awareness on cursor position change.
- [x] Update awareness on typing (with debounce to reduce traffic).
- [x] Render remote users' cursors in the editor.
- [x] Display remote users' names and typing status.
- [ ] Polish: add user avatars or initials.
- [ ] Polish: add presence in a sidebar showing "3 people editing".

---

## Testing & Validation

**Scenario 1: Two Users, Two Cursors**

1. Open document in two browser tabs.
2. In Tab 1, position cursor at line 5.
3. In Tab 2, you should see a colored cursor appear at line 5 (different color from yours).
4. Move the cursor in Tab 1 → Tab 2's cursor follows. ✅

**Scenario 2: Typing Indicator**

1. Start typing in Tab 1.
2. In Tab 2, you should see "User-1234 ✍️ typing...".
3. Stop typing for 2 seconds.
4. Badge disappears. ✅

**Scenario 3: Disconnect Cleanup**

1. Tab 1 and Tab 2 both show each other's cursors.
2. Close Tab 1.
3. Tab 2's remote user list becomes empty, cursor disappears. ✅

**Scenario 4: Multiple Users (3+ tabs)**

1. Open 3 tabs, each with a unique username (Ankit, Sarah, Mike).
2. Each tab shows the other two users with different colors.
3. Edit in any tab and watch all three cursors + typing indicators update. ✅

---

## Database & Persistence

Presence is **ephemeral** — it's not saved to the database.

- Cursor position, typing status, and user names live only in memory.
- When a user disconnects, their presence disappears.
- When they reconnect, they're treated as a new user (fresh presence).

This is intentional: presence is about "right now," not "in history."

---

## Interview / System Design Talking Points

**Why Presence Matters:**

- "Presence prevents users from editing the same area simultaneously, reducing conflicts."
- "It creates a shared mental model: everyone knows who's editing and where."

**Technical elegance:**

- "We use Yjs Awareness, which provides conflict-free, automatic synchronization of non-document state."
- "Awareness messages are lightweight and sent only when state changes (cursor moves, typing starts/stops)."

**Scalability consideration:**

- "Presence is broadcast per room/document, so 100 concurrent users on 100 documents don't interfere."

---

## Git Commit

```bash
git commit -am "Add presence: cursors, names, typing indicators via Yjs Awareness"
git push
```

---

## Real-World Examples

- **Google Docs**: Shows user names, cursors (colored), and "typing..." badges.
- **Figma**: Shows user names, cursor position, and the shape they're editing.
- **Slack**: Shows "typing" indicator when someone is composing a message.
- **VS Code Live Share**: Shows programmer cursors with names in shared editing sessions.

All of these use a presence system like Phase 7.

---
