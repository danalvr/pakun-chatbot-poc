import Tesseract from "tesseract.js";

export async function extractTextFromImage(buffer) {
  const {
    data: { text },
  } = await Tesseract.recognize(buffer, "eng");
  return text;
}
