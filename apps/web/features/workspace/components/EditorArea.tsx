"use client";

import MonacoEditor from "@/features/editor/components/MonacoEditor";
import EditorTabs from "@/features/editor/components/EditorTabs";
import Breadcrumbs from "@/features/editor/components/Breadcrumbs";
import { useEditor } from "@/features/editor/context/EditorContext";
import { memo, useState, useCallback, useRef, useEffect } from "react";

const EditorArea = memo(function EditorArea() {
  const { isSplitView, editorGroups, setActiveGroup } = useEditor();
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
      <div id="editor-split-container" className="flex flex-1 min-h-0 min-w-0 flex-row">
        
        {/* Left Group */}
        <div style={{ width: isSplitView ? `${splitWidth}%` : "100%" }} className="relative h-full flex flex-col min-w-0 overflow-hidden" onClick={() => setActiveGroup("left")}>
          <EditorTabs group="left" />
          <Breadcrumbs group="left" />
          <div className="flex-1 w-full relative overflow-hidden">
             <MonacoEditor fileId={editorGroups.left.activeFile} />
          </div>
        </div>
        
        {isSplitView && (
          <div 
            className="w-1 cursor-col-resize bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors z-10 shrink-0"
            onMouseDown={startResizing}
          />
        )}

        {/* Right Group */}
        {isSplitView && (
          <div style={{ width: `${100 - splitWidth}%` }} className="relative h-full flex flex-col min-w-0 overflow-hidden border-l border-zinc-200 dark:border-zinc-800" onClick={() => setActiveGroup("right")}>
            <EditorTabs group="right" />
            <Breadcrumbs group="right" />
            <div className="flex-1 w-full relative overflow-hidden">
                <MonacoEditor fileId={editorGroups.right.activeFile} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default EditorArea;