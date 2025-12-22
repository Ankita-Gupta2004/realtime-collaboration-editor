import { useEffect, useState } from "react";
import { setupYjs } from "./yjs";

const docId = "doc-123";

function App() {
  const [text, setText] = useState("");
  const [ytext, setYtext] = useState(null);

  useEffect(() => {
    const { ydoc, provider, ytext } = setupYjs(docId);

    setYtext(ytext);

    const updateText = () => {
      setText(ytext.toString());
    };

    ytext.observe(updateText);

    return () => {
      ytext.unobserve(updateText);
      provider.destroy();
      ydoc.destroy();
    };
  }, []);

  const handleChange = (e) => {
    if (!ytext) return;

    ytext.delete(0, ytext.length);
    ytext.insert(0, e.target.value);
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
