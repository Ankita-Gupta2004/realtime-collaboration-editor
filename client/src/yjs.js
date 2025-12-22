import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export function setupYjs(docId) {
  const ydoc = new Y.Doc();

  const provider = new WebsocketProvider(
    "ws://localhost:1234", // make sure this matches your server port
    docId,                  // use the docId passed in
    ydoc
  );

  const ytext = ydoc.getText("shared-text");

  // Optional: listen for remote updates
  ytext.observe(event => {
    console.log("Yjs update received:", ytext.toString());
  });

  return { ydoc, provider, ytext };
}
