require("dotenv").config();
const WebSocket = require("ws");
const http = require("http");
const { setupWSConnection, docs } = require("@y/websocket-server/utils");
const { saveSnapshot, saveVersion } = require("./persistence");

const port = 1234;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws, req) => {
  setupWSConnection(ws, req, { gc: true });
});

// Track document updates and save versions automatically with smart debouncing
const docUpdateHandlers = new Map();
const lastSavedAt = new Map();
const lastSavedContent = new Map();
const SAVE_MIN_INTERVAL = 30000; // Save at most every 30 seconds

setInterval(() => {
  for (const [docId, ydoc] of docs) {
    // Add update listener if not already added
    if (!docUpdateHandlers.has(docId)) {
      const handler = () => {
        try {
          const now = Date.now();
          const lastSave = lastSavedAt.get(docId) || 0;
          const timeSinceLastSave = now - lastSave;

          // Skip if too soon after last save
          if (timeSinceLastSave < SAVE_MIN_INTERVAL) {
            return;
          }

          // Check if content actually changed
          let currentContent = "";
          try {
            const ytext = ydoc.getText("shared-text");
            currentContent = ytext.toString();
          } catch (e) {
            // Text type may not exist yet
          }

          const lastContent = lastSavedContent.get(docId) || "";
          if (currentContent === lastContent) {
            // No meaningful change
            return;
          }

          // Save this version
          saveVersion(docId, ydoc).catch(console.error);
          lastSavedAt.set(docId, now);
          lastSavedContent.set(docId, currentContent);
        } catch (e) {
          console.error("Error in auto-save handler:", e);
        }
      };

      ydoc.on("update", handler);
      docUpdateHandlers.set(docId, handler);
    }
  }
}, 500); // Check every 500ms for new docs

server.listen(port, () => {
  console.log(`Yjs WebSocket server running on ws://localhost:${port}`);
});
