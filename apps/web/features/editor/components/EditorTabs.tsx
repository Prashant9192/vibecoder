"use client";

import { useEditor } from "@/features/editor/context/EditorContext";

export default function EditorTabs() {
  const { openFiles, activeFile, setActiveFile } = useEditor();

  return (
    <div className="flex bg-[#0A0A0A] border-b border-[#1F1F1F]">
      {openFiles.map((file) => (
        <div
          key={file}
          onClick={() => setActiveFile(file)}
          className={`px-4 py-2 cursor-pointer text-sm border-t-2 transition-colors ${activeFile === file
              ? "bg-[#0F0F0F] text-[#E5E5E5] border-[#FF0000]"
              : "bg-[#0A0A0A] text-[#888888] border-transparent hover:bg-[#0F0F0F] hover:text-[#E5E5E5]"
            }`}
        >
          {file}
        </div>
      ))}
    </div>
  );
}