export async function compressText(text: string): Promise<string> {
  if (!text) return "";
  if (text.startsWith("gz:")) return text;

  try {
    if (typeof CompressionStream === "undefined") {
      return text;
    }
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(text));
        controller.close();
      }
    }).pipeThrough(new CompressionStream("gzip"));

    const response = new Response(stream);
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    const base64 = typeof window !== "undefined"
      ? window.btoa(binary)
      : Buffer.from(buffer).toString("base64");

    return "gz:" + base64;
  } catch (e) {
    console.error("Compression failed:", e);
    return text;
  }
}

export async function decompressText(compressed: string): Promise<string> {
  if (!compressed) return "";
  if (!compressed.startsWith("gz:")) return compressed;

  try {
    if (typeof DecompressionStream === "undefined") {
      return "[Compressed text - DecompressionStream not supported]";
    }
    const base64 = compressed.substring(3);
    let bytes: Uint8Array;
    if (typeof window !== "undefined") {
      const binary = window.atob(base64);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
    } else {
      bytes = new Uint8Array(Buffer.from(base64, "base64"));
    }

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      }
    }).pipeThrough(new DecompressionStream("gzip"));

    const response = new Response(stream);
    return await response.text();
  } catch (e) {
    console.error("Decompression failed:", e);
    return compressed;
  }
}
