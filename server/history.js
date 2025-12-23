const express = require("express");
const router = express.Router();
const { MongoClient } = require("mongodb");
const Y = require("yjs");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const dbName = "collab-editor";

async function connectDB() {
  if (!client.topology?.isConnected()) {
    await client.connect();
  }
}

router.get("/:docId", async (req, res) => {
  await connectDB();
  const db = client.db(dbName);
  const versions = await db
    .collection("versions")
    .find({ docId: req.params.docId })
    .sort({ createdAt: -1 })
    .project({ snapshot: 0 }) // don’t send heavy data
    .toArray();

  res.json(versions);
});
router.post("/restore/:versionId", async (req, res) => {
  await connectDB();
  const db = client.db(dbName);

  const version = await db
    .collection("versions")
    .findOne({ _id: new require("mongodb").ObjectId(req.params.versionId) });

  if (!version) {
    return res.status(404).json({ message: "Version not found" });
  }

  res.json({ snapshot: version.snapshot });
});


module.exports = router;
