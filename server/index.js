const WebSocket = require("ws");
const http = require("http");
const { setupWSConnection, map } = require("y-websocket/bin/utils");
const { saveSnapshot } = require("./persistence");

const port = 1234;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws, req) => {
  setupWSConnection(ws, req, { gc: true });
});

// Periodically save snapshots
setInterval(() => {
  for (let [docName, ydoc] of map) { // 'map' contains all Yjs documents
    saveSnapshot(docName, ydoc).catch(console.error);
  }
}, 10000);

server.listen(port, () => {
  console.log(`Yjs WebSocket server with persistence running on ws://localhost:${port}`);
});
