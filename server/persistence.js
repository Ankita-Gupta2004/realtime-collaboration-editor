require('dotenv').config();
const { MongoClient } = require("mongodb");
const Y = require("yjs");

const uri = process.env.MONGO_URI;
const dbName = "collab-editor";
const client = new MongoClient(uri);

// Connect once at startup
async function connectDB() {
  if (!client.isConnected?.()) {
    await client.connect();
    console.log("MongoDB connected");
  }
}

async function saveSnapshot(docId, ydoc) {
  await connectDB();
  const db = client.db(dbName);
  const collection = db.collection("documents");

  const snapshot = Y.encodeStateAsUpdate(ydoc);
  await collection.updateOne(
    { docId },
    { $set: { snapshot, updatedAt: new Date() } },
    { upsert: true }
  );
}

async function loadSnapshot(docId) {
  await connectDB();
  const db = client.db(dbName);
  const collection = db.collection("documents");

  const doc = await collection.findOne({ docId });
  if (!doc || !doc.snapshot) return null;

  const ydoc = new Y.Doc();
  Y.applyUpdate(ydoc, doc.snapshot);
  return ydoc;
}

module.exports = { saveSnapshot, loadSnapshot };
