"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import ActivityBar from "./ActivityBar";
import Explorer from "./Explorer";
import EditorArea from "./EditorArea";
import ChatPanel from "./ChatPanel";
import StatusBar from "./StatusBar";
import { CommandPalette } from "@/features/command/components/CommandPalette";
import { SearchModal } from "@/features/search/components/SearchModal";
import { GitPanel } from "@/features/git/components/GitPanel";
import { ProblemsPanel } from "@/features/problems/components/ProblemsPanel";
import { EditorProvider } from "@/features/editor/context/EditorContext";
import { FileSystemProvider } from "@/features/filesystem/context/FileSystemContext";
import { ThemeProvider } from "@/features/theme/context/ThemeContext";
import dynamic from "next/dynamic";
import { ideLog } from "@/lib/ideLogger";

const TerminalPanel = dynamic(() => import("@/features/terminal/components/TerminalPanel").then(mod => mod.TerminalPanel), { 
  ssr: false 
});

const WorkspaceLayout = memo(function WorkspaceLayout() {
  const [explorerWidth, setExplorerWidth] = useState(260);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<"terminal" | "problems">("terminal");
  const [activePanel, setActivePanel] = useState<"explorer" | "git" | null>("explorer");
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
        setIsBottomPanelOpen((prev) => {
          const next = !prev;
          ideLog("TERMINAL_TOGGLE", { open: next, source: "shortcut" });
          return next;
        });
      }
    };
    document.addEventListener("keydown", handleTerminalToggle);
    return () => document.removeEventListener("keydown", handleTerminalToggle);
  }, []);

  const handleSearchClick = useCallback(() => setSearchOpen(true), []);
  const handleGitClick = useCallback(() => setActivePanel((p) => (p === "git" ? null : "git")), []);
  const handleExplorerClick = useCallback(() => setActivePanel((p) => (p === "explorer" ? null : "explorer")), []);
  const handleTerminalTabClick = useCallback(() => setBottomTab("terminal"), []);
  const handleProblemsTabClick = useCallback(() => setBottomTab("problems"), []);
  const handleCloseBottomPanel = useCallback(() => {
    ideLog("TERMINAL_TOGGLE", { open: false, source: "button" });
    setIsBottomPanelOpen(false);
  }, []);

  return (
    <ThemeProvider>
      <FileSystemProvider>
        <EditorProvider>
          <div className="flex flex-col h-screen overflow-hidden text-black dark:text-white bg-white dark:bg-zinc-900">
            <div className="flex flex-1 min-h-0">
              <ActivityBar
                onSearchClick={handleSearchClick}
                onGitClick={handleGitClick}
                onExplorerClick={handleExplorerClick}
                activePanel={activePanel}
              />
              {activePanel && (
                <>
                  {activePanel === "explorer" && <Explorer width={explorerWidth} />}
                  {activePanel === "git" && (
                    <div style={{ width: explorerWidth, flexShrink: 0 }} className="flex flex-col h-full border-r border-zinc-200 dark:border-zinc-800 overflow-hidden">
                      <GitPanel />
                    </div>
                  )}
                  <div 
                    className="w-1 cursor-col-resize bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors z-10 shrink-0"
                    onMouseDown={startResizing}
                  />
                </>
              )}
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <div className="flex flex-1 min-h-0">
                  <EditorArea />
                  <ChatPanel />
                </div>
                {/* Bottom panel: shared tabs header + panel body */}
                {isBottomPanelOpen && (
                  <div className="flex flex-col shrink-0">
                    {/* Tab bar */}
                    <div className="flex items-center h-8 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2 gap-1 overflow-hidden">
                      <button
                        onClick={handleTerminalTabClick}
                        className={`px-3 h-full text-[11px] tracking-wide font-medium border-b-2 transition-colors ${
                          bottomTab === "terminal"
                            ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                            : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        }`}
                      >
                        Terminal
                      </button>
                      <button
                        onClick={handleProblemsTabClick}
                        className={`px-3 h-full text-[11px] tracking-wide font-medium border-b-2 transition-colors ${
                          bottomTab === "problems"
                            ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                            : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        }`}
                      >
                        Problems
                      </button>
                      <button
                        onClick={handleCloseBottomPanel}
                        className="ml-auto text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs px-1"
                        title="Close panel"
                      >
                        ✕
                      </button>
                    </div>
                    {/* Panel body */}
                    <div className="h-64 flex flex-col overflow-hidden">
                       {bottomTab === "terminal" && <TerminalPanel onClose={handleCloseBottomPanel} />}
                       {bottomTab === "problems" && <ProblemsPanel onClose={handleCloseBottomPanel} />}
                    </div>
                  </div>
                )}
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
});

export default WorkspaceLayout;