import { useEffect, useState } from "react";
import socket from "./socket";

const docId = "doc-123";

function App() {
  const [text, setText] = useState("");

  useEffect(() => {
    socket.emit("join-doc", docId);

    const handleReceiveChange = (content) => {
      setText((prev) => (prev !== content ? content : prev));
    };

    socket.on("receive-change", handleReceiveChange);

    return () => {
      socket.off("receive-change", handleReceiveChange);
    };
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);
    socket.emit("text-change", { docId, content: value });
  };

  return (
    <textarea
      value={text}
      onChange={handleChange}
      style={{ width: "100%", height: "100vh" }}
    />
  );
}

export default App;
