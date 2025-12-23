// test-save.js
const { saveSnapshot } = require("./persistence");
const Y = require("yjs");

async function run() {
  const ydoc = new Y.Doc();
  const ytext = ydoc.getText("shared-text");
  ytext.insert(0, "Hello MongoDB!");

  await saveSnapshot("doc-123", ydoc);
  await require("./persistence").saveVersion("doc-123", ydoc);
  console.log("Snapshot and version saved!");
  process.exit();
}

run();
