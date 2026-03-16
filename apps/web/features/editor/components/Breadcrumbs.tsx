"use client";

import { useEditor } from "@/features/editor/context/EditorContext";
import { ChevronRight } from "lucide-react";
import { useFileSystemContext } from "@/features/filesystem/context/FileSystemContext";

const getFileIcon = (segment: string) => {
  if (segment.endsWith('.ts') || segment.endsWith('.tsx')) return "text-[#3178C6]";
  if (segment.endsWith('.js') || segment.endsWith('.jsx')) return "text-[#F7DF1E]";
  if (segment.endsWith('.json')) return "text-[#CBCB41]";
  if (segment.endsWith('.css')) return "text-[#2965F1]";
  return "";
};

export default function Breadcrumbs({ group }: { group: "left" | "right" }) {
  const { editorGroups, openFile } = useEditor();
  const { getNodeById } = useFileSystemContext();
  const activeFileId = editorGroups[group].activeFile;
  const activeNode = activeFileId ? getNodeById(activeFileId) : undefined;
  const activePath = activeNode?.path ?? null;

  if (!activeFileId || !activePath) {
    return (
      <div className="flex items-center h-7 px-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shrink-0" />
    );
  }

  // Split path into segments, removing leading slash and empty parts
  const segments = activePath.replace(/^\//, "").split("/");

  const handleSegmentClick = (index: number) => {
    // Build partial path up to index — for folders we can't open, just last file
    // For now, clicking a folder segment just focuses the current file
    if (index === segments.length - 1) {
      openFile(activeFileId, group);
    }
  };

  return (
    <div className="flex items-center h-7 px-3 gap-0.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shrink-0 overflow-x-auto hide-scrollbar">
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        return (
          <div key={`${segment}-${index}`} className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => handleSegmentClick(index)}
              className={`
                text-[12px] px-1 py-0.5 rounded transition-colors
                ${isLast
                  ? `font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 ${getFileIcon(segment)}`
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                }
              `}
            >
              {segment}
            </button>
            {!isLast && (
              <ChevronRight
                size={12}
                className="text-zinc-400 dark:text-zinc-600 shrink-0"
                strokeWidth={2}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
