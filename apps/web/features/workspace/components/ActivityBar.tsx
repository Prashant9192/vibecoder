"use client";

import { useTheme } from "@/features/theme/context/ThemeContext";
import { Copy, MessageSquare, Settings, Sun, Moon, Search, GitBranch } from "lucide-react";

export default function ActivityBar({
  onSearchClick,
  onGitClick,
  activePanel,
}: {
  onSearchClick: () => void;
  onGitClick: () => void;
  activePanel: "explorer" | "git" | null;
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="w-12 bg-zinc-100 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col items-center py-4 justify-between h-full text-zinc-500 dark:text-zinc-400">
      <div className="flex flex-col gap-6 w-full items-center">
        <button
          title="Explorer"
          onClick={() => {}}
          className={`cursor-pointer transition-colors border-l-2 w-full flex justify-center ${
            activePanel === "explorer"
              ? "text-zinc-900 dark:text-zinc-100 border-zinc-900 dark:border-zinc-100"
              : "text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <Copy strokeWidth={1.5} size={24} />
        </button>
        <button
          title="Search"
          className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          onClick={onSearchClick}
        >
          <Search size={20} />
        </button>
        <button
          title="Source Control"
          onClick={onGitClick}
          className={`cursor-pointer transition-colors border-l-2 w-full flex justify-center ${
            activePanel === "git"
              ? "text-zinc-900 dark:text-zinc-100 border-zinc-900 dark:border-zinc-100"
              : "text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <GitBranch strokeWidth={1.5} size={22} />
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