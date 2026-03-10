"use client";

import { useEditor } from "@/features/editor/context/EditorContext";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export default function EditorTabs() {
  const { openFiles, activeFile, setActiveFile, setOpenFiles, unsavedFiles } = useEditor();
  const [draggedTab, setDraggedTab] = useState<string | null>(null);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeFile) {
          // We can't just pass the event, so we pass mock or undefined
          // Let's refactor handleClose slightly or just replicate the logic
          const newOpenFiles = openFiles.filter((file) => file !== activeFile);
          setOpenFiles(newOpenFiles);

          if (newOpenFiles.length > 0) {
            const closedIndex = openFiles.indexOf(activeFile);
            const newActiveIndex = closedIndex > 0 ? closedIndex - 1 : 0;
            setActiveFile(newOpenFiles[newActiveIndex]);
          } else {
            setActiveFile(null);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, openFiles]);

  const handleDragStart = (e: React.DragEvent, file: string) => {
    setDraggedTab(file);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetFile: string) => {
    e.preventDefault();
    if (draggedTab && draggedTab !== targetFile) {
      const newFiles = [...openFiles];
      const draggedIndex = newFiles.indexOf(draggedTab);
      const targetIndex = newFiles.indexOf(targetFile);
      
      newFiles.splice(draggedIndex, 1);
      newFiles.splice(targetIndex, 0, draggedTab);
      
      setOpenFiles(newFiles);
    }
    setDraggedTab(null);
  };

  return (
    <div className="flex flex-row bg-[#000000] border-b border-[#1F1F1F] overflow-x-auto hide-scrollbar">
      {openFiles.map((file) => (
        <div
          key={file}
          draggable
          onDragStart={(e) => handleDragStart(e, file)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, file)}
          onClick={() => setActiveFile(file)}
          className={`group flex items-center gap-2 px-3 py-2 min-w-max cursor-pointer text-[13px] border-t-2 select-none ${
            activeFile === file
              ? "bg-[#0A0A0A] text-[#E5E5E5] border-[#FF0000]"
              : "bg-[#000000] text-[#888888] border-transparent hover:bg-[#0A0A0A] hover:text-[#E5E5E5]"
            }`}
        >
          <span>{file.split('/').pop()}</span>
          <span
            className={`flex items-center justify-center p-0.5 rounded transition-all w-5 h-5 
              ${unsavedFiles.includes(file) 
                ? "text-[#E5E5E5] group-hover:bg-[#1F1F1F]" 
                : "text-transparent group-hover:text-[#888888] hover:!text-[#E5E5E5] hover:bg-[#1F1F1F]"}`}
            onClick={(e) => handleClose(e, file)}
          >
            {unsavedFiles.includes(file) ? (
              <span className="text-[10px] absolute group-hover:hidden">●</span>
            ) : null}
            <X 
              size={14} 
              strokeWidth={2.5} 
              className={unsavedFiles.includes(file) ? "opacity-0 group-hover:opacity-100" : ""}
            />
          </span>
        </div>
      ))}
    </div>
  );
}