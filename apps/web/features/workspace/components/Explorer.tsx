"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFileSystemContext, FileNode } from "@/features/filesystem/context/FileSystemContext";
import { useEditor } from "@/features/editor/context/EditorContext";
import { FilePlus, FolderPlus, FolderInput, Pencil, Trash, ChevronRight, ChevronDown, Folder, FolderOpen, FileCode, FileJson, FileText, File } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ideLog } from "@/lib/ideLogger";

const getFileIcon = (name: string) => {
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return <FileCode size={14} className="flex-shrink-0 text-[#3178C6]" />;
  if (name.endsWith('.js') || name.endsWith('.jsx')) return <FileCode size={14} className="flex-shrink-0 text-[#F7DF1E]" />;
  if (name.endsWith('.json')) return <FileJson size={14} className="flex-shrink-0 text-[#CBCB41]" />;
  if (name.endsWith('.css')) return <FileCode size={14} className="flex-shrink-0 text-[#2965F1]" />;
  if (name.endsWith('.md')) return <FileText size={14} className="flex-shrink-0 text-zinc-900 dark:text-zinc-100" />;
  return <File size={14} className="flex-shrink-0 text-zinc-500 dark:text-zinc-400" />;
};

const Explorer = memo(function Explorer({ width = 256 }: { width?: number }) {
  const {
    files: fileSystemFiles,
    addFile,
    createFolder,
    renameFileById,
    deleteFileById,
    moveFileById,
    getNodeById,
    getNodeByPath,
  } = useFileSystemContext();
  const { editorGroups, activeGroup, openFile, files, setFiles, deletePath, setIsSplitView } = useEditor();
  const activeFile = editorGroups?.[activeGroup]?.activeFile ?? null;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [creatingNode, setCreatingNode] = useState<{ parentPath: string, type: "file" | "folder" } | null>(null);
  const [renamingNode, setRenamingNode] = useState<{ id: string, initialName: string } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);

  useEffect(() => {
    if (creatingNode || renamingNode) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (renamingNode) {
            const dotIndex = inputValue.lastIndexOf('.');
            if (dotIndex > 0) {
              inputRef.current.setSelectionRange(0, dotIndex);
            } else {
              inputRef.current.select();
            }
          }
        }
      }, 0);
    }
  }, [creatingNode, renamingNode, inputValue]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // F2 Rename Shortcut
      if (e.key === 'F2' && activeFile && !renamingNode) {
        e.preventDefault();
        const node = getNodeById(activeFile);
        if (node?.name) {
          setRenamingNode({ id: activeFile, initialName: node.name });
          setInputValue(node.name);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeFile, renamingNode, getNodeById]);

  const handleOpenFile = useCallback((file: FileNode, group?: "left" | "right") => {
    const fileId = file.id as string | undefined;
    if (!fileId) return;

    if (!files[fileId]) {
      setFiles({
        ...files,
        [fileId]: file.content || ""
      });
    }

    openFile(fileId, group);
  }, [files, openFile, setFiles]);

  const startCreating = useCallback((e: React.MouseEvent, type: "file" | "folder", parentPath: string = "/src") => {
    e.stopPropagation();
    setCreatingNode({ type, parentPath });
    setInputValue("");
    setExpanded(prev => ({ ...prev, [parentPath]: true }));
  }, []);

  const commitCreating = useCallback(() => {
    if (creatingNode && inputValue.trim()) {
      const name = inputValue.trim();
      if (creatingNode.type === "file") {
        addFile(name, creatingNode.parentPath);
        const createdPath = `${creatingNode.parentPath}/${name}`;
        const created = getNodeByPath(createdPath);
        if (created?.type === "file") {
          handleOpenFile(created);
        }
      } else {
        createFolder(name, creatingNode.parentPath);
      }
    }
    setCreatingNode(null);
    setInputValue("");
  }, [addFile, createFolder, creatingNode, getNodeByPath, handleOpenFile, inputValue]);

  const handleCreatingKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitCreating();
    if (e.key === "Escape") {
      setCreatingNode(null);
      setInputValue("");
    }
  };

  const startRenaming = useCallback((e: React.MouseEvent | KeyboardEvent, nodeId: string, initialName: string) => {
    if (e.stopPropagation) e.stopPropagation();
    setRenamingNode({ id: nodeId, initialName });
    setInputValue(initialName);
  }, []);

  const commitRenaming = useCallback((nodeId: string, oldName: string) => {
    if (renamingNode && inputValue.trim() && inputValue.trim() !== oldName) {
      const trimName = inputValue.trim();
      renameFileById(nodeId, trimName);
    }
    setRenamingNode(null);
    setInputValue("");
  }, [inputValue, renameFileById, renamingNode]);

  const handleRenamingKeyDown = (e: React.KeyboardEvent, node: FileNode) => {
    if (e.key === "Enter") commitRenaming(node.id, node.name);
    if (e.key === "Escape") {
      setRenamingNode(null);
      setInputValue("");
    }
  };

  const renderCreatingInput = (parentPath: string, depth: number = 0) => {
    if (!creatingNode || creatingNode.parentPath !== parentPath) return null;
    return (
      <div style={{ paddingLeft: `${depth * 16 + 8}px`, paddingRight: '8px' }} className="flex items-center gap-1.5 py-1 text-[13px] bg-zinc-200 dark:bg-zinc-800 border border-[#007FD4] dark:border-[#007FD4] rounded-sm min-w-0 h-7">
        {creatingNode.type === 'file' ? getFileIcon(inputValue || "new.ts") : <Folder size={14} className="flex-shrink-0 text-zinc-500 dark:text-zinc-400" />}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleCreatingKeyDown}
          onBlur={commitCreating}
          className="bg-transparent outline-none flex-1 min-w-0 m-0 p-0 text-zinc-900 dark:text-zinc-100 leading-none"
        />
      </div>
    );
  };

  const handleDelete = useCallback((e: React.MouseEvent, nodeId: string, fileName: string) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(`Are you sure you want to delete ${fileName}?`);

    if (confirmDelete) {
      const node = getNodeById(nodeId);
      if (!node) return;

      const collectIds = (n: FileNode): string[] => {
        let ids = [n.id];
        if (n.type === "folder" && n.children) {
          n.children.forEach(child => {
            ids = [...ids, ...collectIds(child)];
          });
        }
        return ids;
      };

      const idsToDelete = collectIds(node);
      deleteFileById(nodeId);
      deletePath(node.path, idsToDelete);
    }
  }, [deleteFileById, deletePath, getNodeById]);

  const handleMove = useCallback((e: React.MouseEvent, nodeId: string, fileName: string) => {
    e.stopPropagation();
    
    // Quick UI hack for now to select path instead of complicated folder traversing
    const newParentPath = prompt(`Move ${fileName} to folder path (e.g. /src/components):`, "/src");
    
    if (newParentPath && newParentPath.trim()) {
      const targetParent = newParentPath.trim();
      moveFileById(nodeId, targetParent);
      setExpanded(prev => ({ ...prev, [targetParent]: true }));
    }
  }, [moveFileById]);

  const handleDragStart = useCallback((e: React.DragEvent, nodeId: string) => {
    e.dataTransfer.setData("application/vnd.vibecoder.file", nodeId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = (e: React.DragEvent, nodePath: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverPath !== nodePath) {
      setDragOverPath(nodePath);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverPath(null);
  };

  const handleDrop = useCallback((e: React.DragEvent, targetFolderPath: string) => {
    e.preventDefault();
    setDragOverPath(null);

    const sourceId = e.dataTransfer.getData("application/vnd.vibecoder.file");
    if (!sourceId) return;
    const sourceNode = getNodeById(sourceId);
    if (!sourceNode) return;

    // Prevent folder from dropping into its own child
    if (sourceNode.type === "folder" && targetFolderPath.startsWith(sourceNode.path + "/")) return;

    // Prevent drop if it's already in this folder
    const sourceParent = sourceNode.path.substring(0, sourceNode.path.lastIndexOf("/"));
    if (sourceParent === targetFolderPath) return;

    moveFileById(sourceId, targetFolderPath);
    setExpanded((prev) => ({ ...prev, [targetFolderPath]: true }));
  }, [getNodeById, moveFileById]);

  const toggleFolder = useCallback((folderName: string) => {
    setExpanded((prev) => ({
      ...prev,
      [folderName]: prev[folderName] === undefined ? false : !prev[folderName]
    }));
  }, []);

  const renderNode = useCallback((node: FileNode, depth: number = 0) => {
    const padStyle = { paddingLeft: `${depth * 16 + 8}px`, paddingRight: '8px' };

    if (renamingNode && renamingNode.id === node.id) {
      return (
        <div key={node.id} style={padStyle} className={`flex items-center gap-1.5 py-1 text-[13px] bg-zinc-200 dark:bg-zinc-800 border border-[#007FD4] dark:border-[#007FD4] rounded-sm min-w-0 h-7`}>
          {node.type === 'file' ? getFileIcon(node.name) : (
            <>
              <ChevronRight size={14} className="text-zinc-500 dark:text-zinc-400 flex-shrink-0 opacity-0" />
              <Folder size={14} className="flex-shrink-0 text-zinc-500 dark:text-zinc-400" />
            </>
          )}
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => handleRenamingKeyDown(e, node)}
            onBlur={() => commitRenaming(node.path, node.name)}
            className="bg-transparent outline-none flex-1 min-w-0 m-0 p-0 text-zinc-900 dark:text-zinc-100 leading-none"
          />
        </div>
      );
    }

    if (node.type === "file") {
      return (
        <ContextMenu key={node.id}>
          <ContextMenuTrigger>
            <li
              draggable
              onDragStart={(e) => handleDragStart(e, node.id)}
              style={padStyle}
              className={`group flex items-center justify-between py-1 cursor-pointer transition-colors text-[13px] select-none ${
                activeFile === node.id
                  ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              onClick={() => handleOpenFile(node)}
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                {getFileIcon(node.name)}
                <span className="truncate leading-none pt-0.5">{node.name}</span>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleMove(e, node.id, node.name)}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 transition-colors p-[2px] rounded hover:bg-zinc-200 dark:hover:bg-zinc-300"
                  title="Move"
                >
                  <FolderInput size={14} />
                </button>
                <button
                  onClick={(e) => startRenaming(e, node.id, node.name)}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 transition-colors p-[2px] rounded hover:bg-zinc-200 dark:hover:bg-zinc-300"
                  title="Rename"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={(e) => handleDelete(e, node.id, node.name)}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-[#FF0000] transition-colors p-[2px] rounded hover:bg-zinc-200 dark:hover:bg-zinc-300"
                  title="Delete"
                >
                  <Trash size={14} />
                </button>
              </div>
            </li>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48 text-[13px] rounded-lg">
            <ContextMenuItem onClick={(e) => { e.stopPropagation(); handleOpenFile(node); }}>Open</ContextMenuItem>
            <ContextMenuItem
              onClick={(e) => { 
                e.stopPropagation(); 
                handleOpenFile(node, "right"); 
                setIsSplitView(true); 
                ideLog("EDITOR_SPLIT", { primary: "left", secondary: "right", fileId: node.id });
              }}
            >
              Open to Side
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={(e) => { e.stopPropagation(); startRenaming(e, node.id, node.name); }}>Rename</ContextMenuItem>
            <ContextMenuItem onClick={(e) => handleMove(e, node.id, node.name)}>Move</ContextMenuItem>
            <ContextMenuItem onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(node.path); }}>Copy Path</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={(e) => handleDelete(e, node.id, node.name)} className="text-red-500 focus:text-red-500 focus:bg-red-100 dark:focus:bg-red-900/30">Delete</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    } else if (node.type === "folder") {
      const isExpanded = expanded[node.path] ?? true;

      return (
        <ContextMenu key={node.id}>
          <div className="mb-[2px]">
            <ContextMenuTrigger>
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, node.id)}
                onDragOver={(e) => handleDragOver(e, node.path)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, node.path)}
                style={padStyle}
                className={`group flex items-center justify-between py-1 cursor-pointer text-[13px] text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors select-none ${
                  dragOverPath === node.path ? "!bg-zinc-200 dark:!bg-zinc-800" : ""
                }`}
                onClick={() => toggleFolder(node.path)}
              >
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <span className="text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                    {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
                  </span>
                  <span className="truncate leading-none pt-0.5">{node.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => startCreating(e, "file", node.path)}
                    className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 transition-colors p-[2px] rounded hover:bg-zinc-200 dark:hover:bg-zinc-300"
                    title="New File inside folder"
                  >
                    <FilePlus size={14} />
                  </button>
                  <button
                    onClick={(e) => startCreating(e, "folder", node.path)}
                    className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 transition-colors p-[2px] rounded hover:bg-zinc-200 dark:hover:bg-zinc-300"
                    title="New Folder inside folder"
                  >
                    <FolderPlus size={14} />
                  </button>
                </div>
              </div>
            </ContextMenuTrigger>

            <ContextMenuContent className="w-48 text-[13px] rounded-lg">
              <ContextMenuItem onClick={(e) => startCreating(e, "file", node.path)}>New File</ContextMenuItem>
              <ContextMenuItem onClick={(e) => startCreating(e, "folder", node.path)}>New Folder</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={(e) => startRenaming(e, node.id, node.name)}>Rename</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={(e) => handleDelete(e, node.id, node.name)} className="text-red-500 focus:text-red-500 focus:bg-red-100 dark:focus:bg-red-900/30">Delete</ContextMenuItem>
            </ContextMenuContent>

            {isExpanded && node.children && (
              <ul className="flex flex-col">
                {node.children.map((child) => renderNode(child, depth + 1))}
                {renderCreatingInput(node.path, depth + 1)}
              </ul>
            )}
          </div>
        </ContextMenu>
      );
    }
  }, [commitRenaming, creatingNode, dragOverPath, expanded, handleDelete, handleDragLeave, handleDragOver, handleDragStart, handleDrop, handleMove, handleOpenFile, handleRenamingKeyDown, inputValue, renamingNode, startCreating, startRenaming, toggleFolder]);

  const renderedTree = useMemo(() => fileSystemFiles.map((node) => renderNode(node)), [fileSystemFiles, renderNode]);

  return (
    <div 
      style={{ width, flexShrink: 0 }}
      className="bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 py-2 overflow-y-auto flex flex-col min-w-0"
    >
      <div className="flex items-center justify-between mb-2 px-2">
        <h2 className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Explorer</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => startCreating(e, "file", "/src")}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 transition-colors p-1 rounded hover:bg-zinc-200 dark:bg-zinc-800"
            title="New File"
          >
            <FilePlus size={14} />
          </button>
          <button
            onClick={(e) => startCreating(e, "folder", "/src")}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 transition-colors p-1 rounded hover:bg-zinc-200 dark:bg-zinc-800"
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        {renderedTree}
      </div>
    </div>
  );
});

export default Explorer;