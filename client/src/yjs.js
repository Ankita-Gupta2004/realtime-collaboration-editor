import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

// Generate a random color for each user
function generateUserColor() {
  const colors = [
    "#e53935",
    "#d32f2f",
    "#c62828",
    "#f57c00",
    "#e65100",
    "#d84315",
    "#fbc02d",
    "#f9a825",
    "#f57f17",
    "#7cb342",
    "#689f38",
    "#558b2f",
    "#0097a7",
    "#00838f",
    "#006064",
    "#3f51b5",
    "#283593",
    "#1a237e",
    "#7b1fa2",
    "#6a1b9a",
    "#4a148c",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function setupYjs(docId, userName = "Anonymous") {
  const ydoc = new Y.Doc();

  const provider = new WebsocketProvider(
    "ws://localhost:1234", // Your Yjs WebSocket server
    docId,
    ydoc
  );

  const ytext = ydoc.getText("shared-text");

  // Create undo manager observing ytext
  const undoManager = new Y.UndoManager(ytext);

  // Set up awareness (presence)
  const awareness = provider.awareness;

  // Set user info in awareness state
  awareness.setLocalState({
    user: {
      name: userName,
      color: generateUserColor(),
    },
    cursor: null,
    typing: false,
    lastUpdate: Date.now(),
  });

  return { ydoc, provider, ytext, undoManager, awareness };
}
