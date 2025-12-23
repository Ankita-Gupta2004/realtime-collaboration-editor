import React, { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { setupYjs } from "./yjs";

function App() {
  const [text, setText] = useState("");
  const [versions, setVersions] = useState([]);
  const [previewVersion, setPreviewVersion] = useState(null);
  const [previewText, setPreviewText] = useState("");
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [userName, setUserName] = useState(
    "User-" + Math.floor(Math.random() * 10000)
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const typingTimeoutRef = useRef(null);

  const ydocRef = useRef(null);
  const ytextRef = useRef(null);
  const undoManagerRef = useRef(null);
  const awarenessRef = useRef(null);
  const textareaRef = useRef(null);

  const docId = "doc-123";
  const userNameRef = useRef(userName);

  useEffect(() => {
    const { ydoc, provider, ytext, undoManager, awareness } = setupYjs(
      docId,
      userName
    );
    ydocRef.current = ydoc;
    ytextRef.current = ytext;
    undoManagerRef.current = undoManager;
    awarenessRef.current = awareness;

    ytext.observe(() => {
      setText(ytext.toString());
    });

    // Listen to awareness changes (other users' presence)
    const handleAwarenessChange = (changes, origin) => {
      try {
        const states = awareness.getStates();
        const users = Array.from(states.entries())
          .filter(
            ([clientId, state]) =>
              state?.user && clientId !== awareness.clientID
          )
          .map(([clientId, state]) => ({
            clientId,
            ...state.user,
            typing: state.typing,
            cursor: state.cursor,
          }));
        setRemoteUsers(users);
      } catch (e) {
        console.error("Error processing awareness change:", e);
      }
    };

    // y-websocket awareness uses event emitter pattern
    if (awareness && typeof awareness.on === "function") {
      awareness.on("change", handleAwarenessChange);
    } else if (awareness && typeof awareness.observe === "function") {
      awareness.observe(handleAwarenessChange);
    }

    return () => {
      if (awareness && typeof awareness.off === "function") {
        awareness.off("change", handleAwarenessChange);
      }
      provider.disconnect();
      ydoc.destroy();
    };
  }, [userName]);

  // Update awareness when name changes
  useEffect(() => {
    const awareness = awarenessRef.current;
    if (awareness) {
      const currentState = awareness.getLocalState();
      awareness.setLocalState({
        ...currentState,
        user: {
          name: userName,
          color: currentState?.user?.color || "#e53935",
        },
      });
    }
  }, [userName]);

  const handleNameChange = (newName) => {
    if (newName.trim().length > 0) {
      setUserName(newName.trim());
      setIsEditingName(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    const ytext = ytextRef.current;

    if (!ytext) return;

    // ✅ IMPORTANT: group changes into ONE transaction
    ytext.doc.transact(() => {
      ytext.delete(0, ytext.length);
      ytext.insert(0, value);
    });

    // Update typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const awareness = awarenessRef.current;
    if (awareness) {
      awareness.setLocalState({
        ...awareness.getLocalState(),
        typing: true,
        lastUpdate: Date.now(),
      });
    }

    // Stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (awareness) {
        awareness.setLocalState({
          ...awareness.getLocalState(),
          typing: false,
          lastUpdate: Date.now(),
        });
      }
    }, 1000);

    // Track cursor position
    const textarea = textareaRef.current;
    if (textarea && awareness) {
      awareness.setLocalState({
        ...awareness.getLocalState(),
        cursor: {
          pos: textarea.selectionStart,
          line: value.slice(0, textarea.selectionStart).split("\n").length - 1,
        },
      });
    }
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

      {/* User Name Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "16px",
          padding: "12px",
          backgroundColor: "#f9f9f9",
          borderRadius: "4px",
          border: "1px solid #e0e0e0",
        }}
      >
        <span
          style={{ marginRight: "12px", fontWeight: "bold", color: "#666" }}
        >
          Your Name:
        </span>
        {isEditingName ? (
          <input
            type="text"
            defaultValue={userName}
            placeholder="Enter your name"
            onBlur={(e) => handleNameChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleNameChange(e.target.value);
              }
            }}
            autoFocus
            style={{
              padding: "6px 12px",
              fontSize: "14px",
              border: "1px solid #3f51b5",
              borderRadius: "4px",
              flex: 1,
              maxWidth: "250px",
            }}
          />
        ) : (
          <>
            <span
              style={{
                padding: "6px 12px",
                backgroundColor: "#3f51b5",
                color: "white",
                borderRadius: "4px",
                fontWeight: "bold",
                marginRight: "8px",
              }}
            >
              {userName}
            </span>
            <button
              onClick={() => setIsEditingName(true)}
              style={{
                padding: "6px 12px",
                backgroundColor: "#f50057",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              ✎ Edit
            </button>
          </>
        )}
      </div>

      {/* Active Users Indicator */}
      {remoteUsers.length > 0 && (
        <div
          style={{
            backgroundColor: "#f0f7ff",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "12px",
            border: "1px solid #b3d9ff",
          }}
        >
          <strong>Active Users:</strong>
          <div style={{ marginTop: "8px" }}>
            {remoteUsers.map((user) => (
              <div
                key={user.clientId}
                style={{
                  display: "inline-block",
                  marginRight: "16px",
                  padding: "4px 8px",
                  backgroundColor: user.color,
                  color: "white",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                {user.name}
                {user.typing && <span> ✍️ typing...</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <textarea
        ref={textareaRef}
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
