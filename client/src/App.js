import { useEffect, useState } from "react";
import socket from "./socket";

function App() {
  const [text, setText] = useState("");

  useEffect(() => {
    socket.on("receive-change", (content) => {
      setText(content);
    });
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);
    socket.emit("text-change", value);
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
