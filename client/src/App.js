import React, { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { setupYjs } from "./yjs";

function App() {
  const [text, setText] = useState("");
  const [versions, setVersions] = useState([]);
  const [previewVersion, setPreviewVersion] = useState(null);
  const [previewText, setPreviewText] = useState("");

  const ydocRef = useRef(null);
  const ytextRef = useRef(null);
  const undoManagerRef = useRef(null);

  const docId = "doc-123";

  useEffect(() => {
    const { ydoc, provider, ytext, undoManager } = setupYjs(docId);

    ydocRef.current = ydoc;
    ytextRef.current = ytext;
    undoManagerRef.current = undoManager;

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
    const ytext = ytextRef.current;

    if (!ytext) return;

    // ✅ IMPORTANT: group changes into ONE transaction
    ytext.doc.transact(() => {
      ytext.delete(0, ytext.length);
      ytext.insert(0, value);
    });
  };

  const handleUndo = () => {
    undoManagerRef.current?.undo();
  };

  const handleRedo = () => {
    undoManagerRef.current?.redo();
  };

  // ---------- Phase 6: History ----------

  const loadHistory = async () => {
    const res = await fetch(`http://localhost:4000/history/${docId}`);
    const data = await res.json();
    setVersions(data);
  };

  const restoreVersion = async (versionId) => {
    try {
      const res = await fetch(
        `http://localhost:4000/history/restore/${versionId}`
      );
      const { snapshot } = await res.json();

      const ydoc = ydocRef.current;
      if (!ydoc) return;

      // Create a temporary Y.Doc to apply the snapshot
      const tempDoc = new Y.Doc();

      // Decode base64 snapshot to Uint8Array
      const binaryString = atob(snapshot);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Apply to temp doc first
      Y.applyUpdate(tempDoc, bytes);

      // Extract text from temp doc
      const tempText = tempDoc.getText("shared-text").toString();

      // Apply to live doc in a transaction
      ydoc.transact(() => {
        const ytext = ydoc.getText("shared-text");
        ytext.delete(0, ytext.length);
        ytext.insert(0, tempText);
      });

      setPreviewVersion(null);
      tempDoc.destroy();
    } catch (error) {
      console.error("Failed to restore version:", error);
      alert("Failed to restore version: " + error.message);
    }
  };

  const openPreview = async (version) => {
    try {
      const res = await fetch(
        `http://localhost:4000/history/restore/${version._id}`
      );
      const { snapshot } = await res.json();

      // Decode and extract text
      const binaryString = atob(snapshot);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const tempDoc = new Y.Doc();
      Y.applyUpdate(tempDoc, bytes);
      const previewText = tempDoc.getText("shared-text").toString();

      setPreviewVersion(version);
      setPreviewText(previewText);
      tempDoc.destroy();
    } catch (error) {
      console.error("Failed to load preview:", error);
      alert("Failed to load preview: " + error.message);
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "16px" }}>
      <h2>Realtime Collaboration Editor</h2>

      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Start typing..."
        style={{
          width: "100%",
          height: "60vh",
          padding: "12px",
          fontSize: "14px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          fontFamily: "monospace",
        }}
      />

      <div style={{ marginTop: "16px", marginBottom: "16px" }}>
        <button onClick={handleUndo} style={{ marginRight: "8px" }}>
          ↶ Undo
        </button>
        <button onClick={handleRedo} style={{ marginRight: "8px" }}>
          ↷ Redo
        </button>
        <button
          onClick={loadHistory}
          style={{ marginLeft: "16px", fontWeight: "bold" }}
        >
          📜 View History
        </button>
      </div>

      {versions.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <h3>Version History ({versions.length} versions)</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {versions.map((v) => (
              <li
                key={v._id}
                style={{
                  marginBottom: "10px",
                  padding: "8px",
                  border: "1px solid #ddd",
                }}
              >
                <div>
                  <strong>{new Date(v.createdAt).toLocaleString()}</strong>
                  {v.snapshotSize && (
                    <span style={{ marginLeft: "10px", color: "#666" }}>
                      ({v.snapshotSize} bytes)
                    </span>
                  )}
                </div>
                {v.preview && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginTop: "4px",
                      maxHeight: "50px",
                      overflow: "hidden",
                    }}
                  >
                    Preview: {v.preview}
                  </div>
                )}
                <div style={{ marginTop: "8px" }}>
                  <button
                    onClick={() => openPreview(v)}
                    style={{ marginRight: "8px" }}
                  >
                    View preview
                  </button>
                  <button onClick={() => restoreVersion(v._id)}>Restore</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Modal */}
      {previewVersion && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "600px",
              maxHeight: "400px",
              overflow: "auto",
              width: "90%",
            }}
          >
            <h3>
              Preview: {new Date(previewVersion.createdAt).toLocaleString()}
            </h3>
            <div
              style={{
                backgroundColor: "#f5f5f5",
                padding: "12px",
                borderRadius: "4px",
                marginBottom: "16px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {previewText}
            </div>
            <div>
              <button
                onClick={() => restoreVersion(previewVersion._id)}
                style={{ marginRight: "8px" }}
              >
                Restore this version
              </button>
              <button onClick={() => setPreviewVersion(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
