"use client";

import MonacoEditor from "@/features/editor/components/MonacoEditor";
import EditorTabs from "@/features/editor/components/EditorTabs";
import { useEditor } from "@/features/editor/context/EditorContext";
import { useState, useCallback, useRef, useEffect } from "react";

export default function EditorArea() {
  const { isSplitView, rightFileId, activeFile } = useEditor();
  const [splitWidth, setSplitWidth] = useState(50); // percentage
  const isDragging = useRef(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    isDragging.current = false;
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isDragging.current) {
      requestAnimationFrame(() => {
        const container = document.getElementById("editor-split-container");
        if (container) {
          const containerWidth = container.clientWidth;
          const offsetLeft = container.getBoundingClientRect().left;
          const newWidthPx = e.clientX - offsetLeft;
          const newPercentage = Math.max(20, Math.min(80, (newWidthPx / containerWidth) * 100));
          setSplitWidth(newPercentage);
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
    <div className="flex flex-col flex-1 min-w-0 bg-white dark:bg-zinc-950">
      <EditorTabs />
      <div id="editor-split-container" className="flex flex-1 min-h-0 min-w-0">
        <div style={{ width: isSplitView ? `${splitWidth}%` : '100%' }} className="relative h-full flex flex-col min-w-0 overflow-hidden">
          <MonacoEditor fileId={activeFile} />
        </div>
        
        {isSplitView && (
          <div 
            className="w-1 cursor-col-resize bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors z-10 flex-shrink-0"
            onMouseDown={startResizing}
          />
        )}

        {isSplitView && (
          <div style={{ width: `${100 - splitWidth}%` }} className="relative h-full flex flex-col min-w-0 overflow-hidden">
            <MonacoEditor fileId={rightFileId} />
          </div>
        )}
      </div>
    </div>
  );
}