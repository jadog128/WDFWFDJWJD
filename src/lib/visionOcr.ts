export async function extractTimetableWithVision(imageDataUrl: string): Promise<string> {
  const res = await fetch("/api/vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageDataUrl }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Vision API failed");
  }

  const data = await res.json();
  return data.result || "[]";
}
