"use client";

import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFileSystemContext, FileNode } from "@/features/filesystem/context/FileSystemContext";
import { useEditor } from "@/features/editor/context/EditorContext";
import { FileCode, FileJson, FileText, File, Search } from "lucide-react";

const getFileIcon = (name: string) => {
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return <FileCode size={14} className="text-[#3178C6] opacity-70" />;
  if (name.endsWith('.js') || name.endsWith('.jsx')) return <FileCode size={14} className="text-[#F7DF1E] opacity-70" />;
  if (name.endsWith('.json')) return <FileJson size={14} className="text-[#CBCB41] opacity-70" />;
  if (name.endsWith('.css')) return <FileCode size={14} className="text-[#2965F1] opacity-70" />;
  if (name.endsWith('.md')) return <FileText size={14} className="opacity-70" />;
  return <File size={14} className="opacity-70" />;
};

type SearchResult = {
  path: string;
  name: string;
  lineNumber: number;
  lineContent: string;
  matchIndex: number;
  matchLength: number;
};

export function SearchModal({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  
  const { files: fileSystemFiles } = useFileSystemContext();
  const { setActiveFile, setFiles, files: editorFiles, openFiles, setOpenFiles, setLineToReveal } = useEditor();

  // Recursively extract all files with their contents
  const flattenTree = useCallback((nodes: FileNode[], result: { path: string; name: string; content: string }[] = []) => {
    for (const node of nodes) {
      if (node.type === "file") {
        const currentContent = editorFiles[node.path] !== undefined ? editorFiles[node.path] : (node.content || "");
        result.push({ path: node.path, name: node.name, content: currentContent });
      } else if (node.type === "folder" && node.children) {
        flattenTree(node.children, result);
      }
    }
    return result;
  }, [editorFiles]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const searchTimer = setTimeout(() => {
      const allFiles = flattenTree(fileSystemFiles);
      const lowerQuery = query.toLowerCase();
      const newResults: SearchResult[] = [];

      for (const file of allFiles) {
        const lines = file.content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const matchIndex = line.toLowerCase().indexOf(lowerQuery);
          
          if (matchIndex !== -1) {
            newResults.push({
              path: file.path,
              name: file.name,
              lineNumber: i + 1,
              lineContent: line.trim(),
              matchIndex,
              matchLength: query.length
            });
          }
        }
      }

      setResults(newResults);
    }, 200);

    return () => clearTimeout(searchTimer);
  }, [query, fileSystemFiles, flattenTree]);

  const handleSelect = (filePath: string, lineNumber: number) => {
    onOpenChange(false);
    
    // Add to editor files if not already there
    if (!editorFiles[filePath]) {
      const allFiles = flattenTree(fileSystemFiles);
      const targetFile = allFiles.find(f => f.path === filePath);
      setFiles({
        ...editorFiles,
        [filePath]: targetFile?.content || ""
      });
    }

    // Set as active file
    setActiveFile(filePath);

    // Add to open tabs if not already opened
    if (!openFiles.includes(filePath)) {
      setOpenFiles([...openFiles, filePath]);
    }

    // Trigger line reveal safely after state updates
    setTimeout(() => {
        setLineToReveal(lineNumber);
    }, 50);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] max-w-2xl p-0 overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[60vh] !rounded-xl" showCloseButton={false}>
        <div className="flex items-center px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
          <Input 
            autoFocus
            className="flex-1 bg-transparent border-none p-0 focus-visible:ring-0 text-sm h-auto text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
            placeholder="Search across all files (Ctrl+Shift+F)" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        
        <div className="overflow-y-auto flex-1 min-h-[100px] max-h-[50vh]">
          {results.length === 0 && query.length > 0 && (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No results found for "{query}"
            </div>
          )}
          {results.length > 0 && (
            <div className="py-2">
              {Object.entries(
                results.reduce((acc, result) => {
                  if (!acc[result.path]) acc[result.path] = [];
                  acc[result.path].push(result);
                  return acc;
                }, {} as Record<string, SearchResult[]>)
              ).map(([filePath, fileResults]) => (
                <div key={filePath} className="mb-2">
                  <div className="px-3 py-1.5 flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {getFileIcon(fileResults[0].name)}
                    <span>{filePath}</span>
                    <span className="ml-auto text-zinc-500 text-[10px] bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">{fileResults.length}</span>
                  </div>
                  <div className="flex flex-col">
                    {fileResults.map((result, i) => (
                      <button
                        key={`${result.path}-${result.lineNumber}-${i}`}
                        className="group flex flex-col items-start px-4 py-2 hover:bg-[#007FD4]/10 dark:hover:bg-[#007FD4]/20 transition-colors cursor-pointer text-left focus:outline-none focus:bg-[#007FD4]/10 dark:focus:bg-[#007FD4]/20 w-full"
                        onClick={() => handleSelect(result.path, result.lineNumber)}
                      >
                        <div className="flex w-full items-baseline">
                           <span className="w-8 shrink-0 text-right text-[10px] text-zinc-400 mr-3 font-mono">
                             {result.lineNumber}
                           </span>
                           <span className="text-xs text-zinc-600 dark:text-zinc-300 font-mono truncate max-w-full">
                             {result.lineContent}
                           </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
