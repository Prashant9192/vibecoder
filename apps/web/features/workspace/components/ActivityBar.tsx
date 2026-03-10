"use client";

import { useEditor } from "@/features/editor/context/EditorContext";
import { Copy, MessageSquare, Settings, Sun, Moon } from "lucide-react";

export default function ActivityBar() {
  const { editorTheme, setEditorTheme } = useEditor();

  const toggleTheme = () => {
    setEditorTheme(editorTheme === "vs-dark" ? "light" : "vs-dark");
  };

  return (
    <div className="w-12 bg-[#2C2C2C] dark:bg-[#050505] border-r border-[#E5E5E5] dark:border-[#1F1F1F] flex flex-col items-center py-4 justify-between h-full text-[#CCCCCC] dark:text-[#888888]">
      <div className="flex flex-col gap-6 w-full items-center">
        <button className="cursor-pointer text-[#FFFFFF] dark:text-[#E5E5E5] transition-colors border-l-2 border-[#FFFFFF] dark:border-[#E5E5E5] pl-[-2px] w-full flex justify-center">
          <Copy strokeWidth={1.5} size={24} />
        </button>
        <button className="cursor-pointer hover:text-[#FFFFFF] dark:text-[#E5E5E5] transition-colors">
          <MessageSquare strokeWidth={1.5} size={24} />
        </button>
      </div>
      <div className="flex flex-col gap-6 items-center w-full">
        <button className="cursor-pointer hover:text-[#FFFFFF] dark:text-[#E5E5E5] transition-colors" onClick={toggleTheme} title="Toggle Editor Theme">
          {editorTheme === "vs-dark" ? <Sun strokeWidth={1.5} size={24} /> : <Moon strokeWidth={1.5} size={24} />}
        </button>
        <button className="cursor-pointer hover:text-[#FFFFFF] dark:text-[#E5E5E5] transition-colors mb-2">
          <Settings strokeWidth={1.5} size={24} />
        </button>
      </div>
    </div>
  );
}