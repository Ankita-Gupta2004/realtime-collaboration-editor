import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export function setupYjs(docId) {
  const ydoc = new Y.Doc();

  const provider = new WebsocketProvider(
    "ws://localhost:1234",  // Your Yjs WebSocket server
    docId,
    ydoc
  );

  const ytext = ydoc.getText("shared-text");

  // Create undo manager observing ytext
  const undoManager = new Y.UndoManager(ytext);

  return { ydoc, provider, ytext, undoManager };
}
