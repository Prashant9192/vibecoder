"use client";

import { useTheme } from "@/features/theme/context/ThemeContext";
import { Copy, MessageSquare, Settings, Sun, Moon } from "lucide-react";

export default function ActivityBar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="w-12 bg-zinc-100 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col items-center py-4 justify-between h-full text-zinc-500 dark:text-zinc-400">
      <div className="flex flex-col gap-6 w-full items-center">
        <button className="cursor-pointer text-zinc-900 dark:text-zinc-100 transition-colors border-l-2 border-zinc-900 dark:border-zinc-100 pl-[0px] w-full flex justify-center">
          <Copy strokeWidth={1.5} size={24} />
        </button>
        <button className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          <MessageSquare strokeWidth={1.5} size={24} />
        </button>
      </div>
      <div className="flex flex-col gap-6 items-center w-full">
        <button className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={toggleTheme} title="Toggle Editor Theme">
          {theme === "dark" ? <Sun strokeWidth={1.5} size={24} /> : <Moon strokeWidth={1.5} size={24} />}
        </button>
        <button className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-2">
          <Settings strokeWidth={1.5} size={24} />
        </button>
      </div>
    </div>
  );
}