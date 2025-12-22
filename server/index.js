const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Client joins a document room
  socket.on("join-doc", (docId) => {
    socket.join(docId);
    console.log(`Socket ${socket.id} joined document ${docId}`);
  });

  // Text changes scoped to a document
  socket.on("text-change", ({ docId, content }) => {
    socket.to(docId).emit("receive-change", content);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
