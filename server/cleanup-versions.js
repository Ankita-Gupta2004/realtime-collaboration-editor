require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const dbName = "collab-editor";

async function cleanupVersions() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);

    // Delete all old versions (keep only the most recent one for now)
    const result = await db
      .collection("versions")
      .deleteMany({ docId: "doc-123" });
    console.log(`Deleted ${result.deletedCount} old versions for doc-123`);

    // Verify the document snapshot is still there
    const doc = await db.collection("documents").findOne({ docId: "doc-123" });
    if (doc) {
      console.log(`✓ Latest snapshot preserved in 'documents' collection`);
    }
  } finally {
    await client.close();
  }
}

cleanupVersions().catch(console.error);
