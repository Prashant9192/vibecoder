"use client";

import { useEditor } from "@/features/editor/context/EditorContext";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export default function EditorTabs({ group }: { group: "left" | "right" }) {
  const { editorGroups, setActiveFile, setTabs, unsavedFiles, activeGroup, setActiveGroup } = useEditor();
  const [draggedTab, setDraggedTab] = useState<string | null>(null);

  const tabs = editorGroups[group].tabs;
  const activeFile = editorGroups[group].activeFile;
  const isActiveGroup = activeGroup === group;

  const handleClose = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();

    const newTabs = tabs.filter((file) => file !== fileName);
    setTabs(newTabs, group);

    if (activeFile === fileName) {
      if (newTabs.length > 0) {
        const closedIndex = tabs.indexOf(fileName);
        const newActiveIndex = closedIndex > 0 ? closedIndex - 1 : 0;
        setActiveFile(newTabs[newActiveIndex], group);
      } else {
        setActiveFile(null, group);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process Ctrl+W on the active group
      if (!isActiveGroup) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeFile) {
          const newTabs = tabs.filter((file) => file !== activeFile);
          setTabs(newTabs, group);

          if (newTabs.length > 0) {
            const closedIndex = tabs.indexOf(activeFile);
            const newActiveIndex = closedIndex > 0 ? closedIndex - 1 : 0;
            setActiveFile(newTabs[newActiveIndex], group);
          } else {
            setActiveFile(null, group);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, tabs, group, isActiveGroup, setTabs, setActiveFile]);

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
      const newFiles = [...tabs];
      const draggedIndex = newFiles.indexOf(draggedTab);
      const targetIndex = newFiles.indexOf(targetFile);
      
      newFiles.splice(draggedIndex, 1);
      newFiles.splice(targetIndex, 0, draggedTab);
      
      setTabs(newFiles, group);
    }
    setDraggedTab(null);
  };

  return (
    <div 
      className={`flex items-center bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto whitespace-nowrap hide-scrollbar ${isActiveGroup ? 'ring-1 ring-inset ring-transparent' : 'opacity-80'}`}
      onClick={() => setActiveGroup(group)}
    >
      {tabs.length === 0 && <div className="h-[38px] w-full" />}
      {tabs.map((file) => (
        <div
          key={file}
          draggable
          onDragStart={(e) => handleDragStart(e, file)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, file)}
          onClick={(e) => { e.stopPropagation(); setActiveFile(file, group); setActiveGroup(group); }}
          className={`group flex items-center gap-2 px-3 py-2 min-w-max cursor-pointer text-[13px] border-t-2 select-none ${
            activeFile === file
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-[#FF0000] dark:border-[#FF0000]"
              : "bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
        >
          <span>{file.split('/').pop()}</span>
          <span
            className={`flex items-center justify-center p-0.5 rounded transition-all w-5 h-5 
              ${unsavedFiles.includes(file) 
                ? "text-zinc-900 dark:text-zinc-100 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700" 
                : "text-transparent group-hover:text-zinc-500 dark:group-hover:text-zinc-400 hover:!text-zinc-900 dark:hover:!text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
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