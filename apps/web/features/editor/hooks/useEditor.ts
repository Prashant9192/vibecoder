import { useState } from "react";

export function useEditor() {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [code, setCode] = useState("");

  return {
    activeFile,
    setActiveFile,
    code,
    setCode,
  };
}