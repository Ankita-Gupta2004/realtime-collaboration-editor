import React, { useEffect, useState } from "react";
import { setupYjs } from "./yjs";

function App() {
  const [text, setText] = useState("");
  const [ytext, setYtext] = useState(null); // store ytext reference
  const [undoManager, setUndoManager] = useState(null);
  const docId = "doc-123";

  useEffect(() => {
    const { ydoc, provider, ytext, undoManager } = setupYjs(docId);

    // Save references
    setYtext(ytext);
    setUndoManager(undoManager);

    // Observe Yjs text changes
    ytext.observe(() => {
      setText(ytext.toString());
    });

    return () => {
      provider.disconnect();
      ydoc.destroy();
    };
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    if (!ytext) return;

    // Replace entire Yjs text with new value
    ytext.delete(0, ytext.length);
    ytext.insert(0, value);
  };

  const handleUndo = () => {
    if (undoManager) undoManager.undo();
  };

  const handleRedo = () => {
    if (undoManager) undoManager.redo();
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={handleChange}
        style={{ width: "100%", height: "90vh" }}
      />
      <div>
        <button onClick={handleUndo}>Undo</button>
        <button onClick={handleRedo}>Redo</button>
      </div>
    </div>
  );
}

export default App;
