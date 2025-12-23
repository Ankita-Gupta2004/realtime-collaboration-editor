require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const dbName = "collab-editor";

async function connectDB() {
  if (!client.topology?.isConnected()) {
    await client.connect();
    console.log("MongoDB connected (history)");
  }
}

// 📌 Get version history
app.get("/history/:docId", async (req, res) => {
  await connectDB();
  const db = client.db(dbName);
  const collection = db.collection("versions");

  const versions = await collection
    .find({ docId: req.params.docId })
    .sort({ createdAt: -1 })
    .toArray();

  res.json(versions);
});

// 📌 Restore a version
app.get("/history/restore/:id", async (req, res) => {
  await connectDB();
  const db = client.db(dbName);
  const collection = db.collection("versions");

  const version = await collection.findOne({
    _id: new ObjectId(req.params.id),
  });

  if (!version) return res.status(404).send("Not found");

  // Convert binary snapshot to base64 for JSON transport
  // Handle different MongoDB Binary shapes
  let buffer;
  if (version.snapshot && typeof version.snapshot === "object") {
    if (version.snapshot.buffer) {
      // It's a Node.js Buffer
      buffer = version.snapshot.buffer;
    } else if (version.snapshot instanceof Uint8Array) {
      buffer = Buffer.from(version.snapshot);
    } else if (version.snapshot.buffer instanceof ArrayBuffer) {
      // It's a MongoDB Binary object
      buffer = Buffer.from(version.snapshot.buffer);
    } else {
      // Last resort: treat it as a Buffer directly
      buffer = Buffer.from(version.snapshot);
    }
  } else {
    return res.status(400).json({ error: "Invalid snapshot format" });
  }

  const snapshotBase64 = buffer.toString("base64");
  res.json({
    snapshot: snapshotBase64,
  });
});

app.listen(PORT, () => {
  console.log(`History API running on http://localhost:${PORT}`);
});
