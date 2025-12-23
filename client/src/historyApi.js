// src/historyApi.js

export async function fetchHistory(docId) {
  const res = await fetch(`http://localhost:4000/history/${docId}`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function restoreVersion(versionId) {
  const res = await fetch(
    `http://localhost:4000/history/restore/${versionId}`
  );
  if (!res.ok) throw new Error("Failed to restore version");
  return res.json();
}
