"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useFileSystemContext, FileNode } from "@/features/filesystem/context/FileSystemContext";
import { useEditor } from "@/features/editor/context/EditorContext";
import { FileCode, FileJson, FileText, File } from "lucide-react";

// Helpes map an icon
const getFileIcon = (name: string) => {
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return <FileCode size={14} className="text-[#3178C6] opacity-70" />;
  if (name.endsWith('.js') || name.endsWith('.jsx')) return <FileCode size={14} className="text-[#F7DF1E] opacity-70" />;
  if (name.endsWith('.json')) return <FileJson size={14} className="text-[#CBCB41] opacity-70" />;
  if (name.endsWith('.css')) return <FileCode size={14} className="text-[#2965F1] opacity-70" />;
  if (name.endsWith('.md')) return <FileText size={14} className="opacity-70" />;
  return <File size={14} className="opacity-70" />;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { files: fileSystemFiles } = useFileSystemContext();
  const { setActiveFile, setFiles, files: editorFiles, openFiles, setOpenFiles, recentFiles } = useEditor();
  const [flattenedFiles, setFlattenedFiles] = useState<{ path: string; name: string }[]>([]);

  // Recursively extract all file nodes into a flat array
  const flattenTree = useCallback((nodes: FileNode[], result: { path: string; name: string }[] = []) => {
    for (const node of nodes) {
      if (node.type === "file") {
        result.push({ path: node.path, name: node.name });
      } else if (node.type === "folder" && node.children) {
        flattenTree(node.children, result);
      }
    }
    return result;
  }, []);

  useEffect(() => {
    setFlattenedFiles(flattenTree(fileSystemFiles));
  }, [fileSystemFiles, flattenTree]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (filePath: string) => {
    setOpen(false);
    
    // Add to editor files if not already there
    if (!editorFiles[filePath]) {
      setFiles({
        ...editorFiles,
        [filePath]: ""
      });
    }

    // Set as active file
    setActiveFile(filePath);

    // Add to open tabs if not already opened
    if (!openFiles.includes(filePath)) {
      setOpenFiles([...openFiles, filePath]);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search files..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {recentFiles.length > 0 && (
          <CommandGroup heading="Recent Files">
            {recentFiles.map((path) => {
              const file = flattenedFiles.find((f) => f.path === path);
              if (!file) return null;
              return (
                <CommandItem
                  key={`recent-${file.path}`}
                  value={file.name + " " + file.path + " recent"}
                  onSelect={() => handleSelect(file.path)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {getFileIcon(file.name)}
                  <span>{file.name}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-auto">{file.path}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        <CommandGroup heading="All Files">
          {flattenedFiles
            .filter((file) => !recentFiles.includes(file.path))
            .map((file) => (
              <CommandItem
                key={`all-${file.path}`}
                value={file.name + " " + file.path} // search on name and path
                onSelect={() => handleSelect(file.path)}
                className="flex items-center gap-2 cursor-pointer"
              >
                {getFileIcon(file.name)}
                <span>{file.name}</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-auto">{file.path}</span>
              </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
