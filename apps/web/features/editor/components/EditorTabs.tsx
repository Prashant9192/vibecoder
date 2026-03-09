"use client";

import { useEditor } from "@/features/editor/context/EditorContext";

export default function EditorTabs() {
  const { openFiles, activeFile, setActiveFile, setOpenFiles } = useEditor();

  const handleClose = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();

    const newOpenFiles = openFiles.filter((file) => file !== fileName);
    setOpenFiles(newOpenFiles);

    if (activeFile === fileName) {
      if (newOpenFiles.length > 0) {
        const closedIndex = openFiles.indexOf(fileName);
        const newActiveIndex = closedIndex > 0 ? closedIndex - 1 : 0;
        setActiveFile(newOpenFiles[newActiveIndex]);
      } else {
        setActiveFile(null);
      }
    }
  };

  return (
    <div className="flex bg-[#0A0A0A] border-b border-[#1F1F1F]">
      {openFiles.map((file) => (
        <div
          key={file}
          onClick={() => setActiveFile(file)}
          className={`group flex items-center gap-2 px-4 py-2 cursor-pointer text-sm border-t-2 transition-colors ${activeFile === file
            ? "bg-[#0F0F0F] text-[#E5E5E5] border-[#FF0000]"
            : "bg-[#0A0A0A] text-[#888888] border-transparent hover:bg-[#0F0F0F] hover:text-[#E5E5E5]"
            }`}
        >
          <span>{file}</span>
          <span
            className="text-transparent group-hover:text-[#888888] hover:!text-[#FF0000] px-1 rounded transition-colors"
            onClick={(e) => handleClose(e, file)}
          >
            ×
          </span>
        </div>
      ))}
    </div>
  );
}