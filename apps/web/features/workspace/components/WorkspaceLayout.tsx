"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import ActivityBar from "./ActivityBar";
import Explorer from "./Explorer";
import EditorArea from "./EditorArea";
import ChatPanel from "./ChatPanel";
import StatusBar from "./StatusBar";
import { CommandPalette } from "@/features/command/components/CommandPalette";
import { SearchModal } from "@/features/search/components/SearchModal";
import { GitPanel } from "@/features/git/components/GitPanel";
import { EditorProvider } from "@/features/editor/context/EditorContext";
import { FileSystemProvider } from "@/features/filesystem/context/FileSystemContext";
import { ThemeProvider } from "@/features/theme/context/ThemeContext";
import dynamic from "next/dynamic";

const TerminalPanel = dynamic(() => import("@/features/terminal/components/TerminalPanel").then(mod => mod.TerminalPanel), { 
  ssr: false 
});

export default function WorkspaceLayout() {
  const [explorerWidth, setExplorerWidth] = useState(260);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"explorer" | "git">("explorer");
  const isDragging = useRef(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    e.preventDefault(); // prevent text selection during drag
  }, []);

  const stopResizing = useCallback(() => {
    isDragging.current = false;
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isDragging.current) {
      requestAnimationFrame(() => {
        // ActivityBar standard width is ~48px. 
        // e.clientX gives the global cursor X coordinate.
        const newWidth = e.clientX - 48;
        if (newWidth >= 180 && newWidth <= 500) {
          setExplorerWidth(newWidth);
        }
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  useEffect(() => {
    const handleGlobalSearch = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        if (!isSearchOpen) {
          setSearchOpen(true);
        }
      }
    };
    document.addEventListener("keydown", handleGlobalSearch);
    return () => document.removeEventListener("keydown", handleGlobalSearch);
  }, [isSearchOpen]);

  useEffect(() => {
    const handleTerminalToggle = (e: KeyboardEvent) => {
      // Ctrl + ` (backtick)
      if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleTerminalToggle);
    return () => document.removeEventListener("keydown", handleTerminalToggle);
  }, []);

  return (
    <ThemeProvider>
      <FileSystemProvider>
        <EditorProvider>
          <div className="flex flex-col h-screen overflow-hidden text-black dark:text-white bg-white dark:bg-zinc-900">
            <div className="flex flex-1 min-h-0">
              <ActivityBar
                onSearchClick={() => setSearchOpen(true)}
                onGitClick={() => setActivePanel(p => p === "git" ? "explorer" : "git")}
                activePanel={activePanel}
              />
              {activePanel === "explorer" && <Explorer width={explorerWidth} />}
              {activePanel === "git" && (
                <div style={{ width: explorerWidth, flexShrink: 0 }} className="flex flex-col h-full border-r border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <GitPanel />
                </div>
              )}
              <div 
                className="w-1 cursor-col-resize bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors z-10 flex-shrink-0"
                onMouseDown={startResizing}
              />
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <div className="flex flex-1 min-h-0">
                  <EditorArea />
                  <ChatPanel />
                </div>
                {isTerminalOpen && <TerminalPanel onClose={() => setIsTerminalOpen(false)} />}
              </div>
            </div>
            <StatusBar />
            <CommandPalette />
            <SearchModal isOpen={isSearchOpen} onOpenChange={setSearchOpen} />
          </div>
        </EditorProvider>
      </FileSystemProvider>
    </ThemeProvider>
  );
}