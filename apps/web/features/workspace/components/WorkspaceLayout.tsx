"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import ActivityBar from "./ActivityBar";
import Explorer from "./Explorer";
import EditorArea from "./EditorArea";
import ChatPanel from "./ChatPanel";
import { CommandPalette } from "@/features/command/components/CommandPalette";
import { EditorProvider } from "@/features/editor/context/EditorContext";
import { FileSystemProvider } from "@/features/filesystem/context/FileSystemContext";
import { ThemeProvider } from "@/features/theme/context/ThemeContext";

export default function WorkspaceLayout() {
  const [explorerWidth, setExplorerWidth] = useState(260);
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

  return (
    <ThemeProvider>
      <FileSystemProvider>
        <EditorProvider>
          <div className="flex h-screen overflow-hidden text-black dark:text-white bg-white dark:bg-zinc-900">
            <ActivityBar />
            <Explorer width={explorerWidth} />
            <div 
              className="w-1 cursor-col-resize bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors z-10 flex-shrink-0"
              onMouseDown={startResizing}
            />
            <EditorArea />
            <ChatPanel />
            <CommandPalette />
          </div>
        </EditorProvider>
      </FileSystemProvider>
    </ThemeProvider>
  );
}