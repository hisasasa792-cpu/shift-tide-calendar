// Save the backup file. The share sheet is the reliable path in an installed iPhone app;
// elsewhere a download link is used.
export async function exportBackup(json, name, { nav = navigator, doc = document } = {}) {
  const file = new File([json], name, { type: "application/json" });
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file] });
      return;
    } catch (err) {
      if (err.name === "AbortError") return;
    }
  }
  const a = doc.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}
