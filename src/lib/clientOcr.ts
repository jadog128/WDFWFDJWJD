let tesseractWorker: any = null;

export async function recognizeImage(imageData: Blob | string, lang = "eng"): Promise<string> {
  const T = await import("tesseract.js");

  if (!tesseractWorker) {
    tesseractWorker = await T.createWorker(lang, 1, {
      logger: () => {},
    });
  }

  const { data } = await tesseractWorker.recognize(imageData);
  return data.text || "";
}

export async function terminateOcr() {
  if (tesseractWorker) {
    await tesseractWorker.terminate();
    tesseractWorker = null;
  }
}
