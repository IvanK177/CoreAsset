"use client";

import { useState, useEffect } from "react";
import { decompressText } from "@/lib/compression";

interface DecompressedTextProps {
  text: string;
  className?: string;
  truncate?: number;
}

export function DecompressedText({ text, className, truncate }: DecompressedTextProps) {
  const [prevText, setPrevText] = useState<string>(text);
  const [decompressed, setDecompressed] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(text?.startsWith("gz:") || false);

  if (text !== prevText) {
    setPrevText(text);
    setDecompressed("");
    setLoading(text?.startsWith("gz:") || false);
  }

  useEffect(() => {
    if (!text || !text.startsWith("gz:")) {
      return;
    }

    decompressText(text)
      .then((res) => {
        setDecompressed(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to decompress text:", err);
        setDecompressed(text);
        setLoading(false);
      });
  }, [text]);

  const rawText = text?.startsWith("gz:") ? decompressed : text || "";
  const displayText = truncate
    ? rawText.length > truncate
      ? rawText.substring(0, truncate) + "..."
      : rawText
    : rawText;

  if (loading && text?.startsWith("gz:")) {
    return <span className="text-gray-400">...</span>;
  }

  return <span className={className}>{displayText}</span>;
}
