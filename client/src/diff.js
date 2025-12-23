// Simple token-based LCS diff to produce added/removed/equal segments
export function computeDiff(oldText, newText) {
  // Split into tokens, preserving whitespace
  const tokenize = (s) => s.split(/(\s+)/).filter((t) => t.length > 0);
  const a = tokenize(oldText);
  const b = tokenize(newText);

  const n = a.length;
  const m = b.length;
  // Build LCS DP table
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = 1 + dp[i + 1][j + 1];
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // Reconstruct diff
  const result = [];
  let i = 0,
    j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) {
      result.push({ type: "equal", text: a[i] });
      i++;
      j++;
    } else if (j < m && (i === n || dp[i][j + 1] >= dp[i + 1][j])) {
      result.push({ type: "added", text: b[j] });
      j++;
    } else if (i < n && (j === m || dp[i][j + 1] < dp[i + 1][j])) {
      result.push({ type: "removed", text: a[i] });
      i++;
    } else {
      // fallback
      if (i < n) {
        result.push({ type: "removed", text: a[i] });
        i++;
      }
      if (j < m) {
        result.push({ type: "added", text: b[j] });
        j++;
      }
    }
  }

  // Merge consecutive segments of same type
  const merged = [];
  for (const seg of result) {
    if (merged.length && merged[merged.length - 1].type === seg.type) {
      merged[merged.length - 1].text += seg.text;
    } else merged.push({ ...seg });
  }
  return merged;
}
