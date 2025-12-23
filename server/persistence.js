require("dotenv").config();
const { MongoClient } = require("mongodb");
const Y = require("yjs");

const uri = process.env.MONGO_URI;
const dbName = "collab-editor";
const client = new MongoClient(uri);

async function connectDB() {
  if (!client.topology?.isConnected()) {
    await client.connect();
    console.log("MongoDB connected");
  }
}

// Phase 5 – Snapshot
async function saveSnapshot(docId, ydoc) {
  await connectDB();
  const db = client.db(dbName);

  await db.collection("documents").updateOne(
    { docId },
    {
      $set: {
        snapshot: Y.encodeStateAsUpdate(ydoc),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

// Phase 6 – Version history
async function saveVersion(docId, ydoc) {
  await connectDB();
  const db = client.db(dbName);

  await db.collection("versions").insertOne({
    docId,
    snapshot: Y.encodeStateAsUpdate(ydoc),
    createdAt: new Date(),
  });

  console.log("Version saved for", docId);
}

module.exports = { saveSnapshot, saveVersion };
