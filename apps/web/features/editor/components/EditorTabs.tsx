"use client";

import { useEditor } from "@/features/editor/context/EditorContext";
import { X } from "lucide-react";

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
    <div className="flex flex-row bg-[#000000] border-b border-[#1F1F1F] overflow-x-auto hide-scrollbar">
      {openFiles.map((file) => (
        <div
          key={file}
          onClick={() => setActiveFile(file)}
          className={`group flex items-center gap-2 px-3 py-2 min-w-max cursor-pointer text-[13px] border-t-2 select-none ${
            activeFile === file
              ? "bg-[#0A0A0A] text-[#E5E5E5] border-[#FF0000]"
              : "bg-[#000000] text-[#888888] border-transparent hover:bg-[#0A0A0A] hover:text-[#E5E5E5]"
            }`}
        >
          <span>{file.split('/').pop()}</span>
          <span
            className="text-transparent group-hover:text-[#888888] hover:!text-[#E5E5E5] hover:bg-[#1F1F1F] p-0.5 rounded transition-all"
            onClick={(e) => handleClose(e, file)}
          >
            <X size={14} strokeWidth={2.5} />
          </span>
        </div>
      ))}
    </div>
  );
}