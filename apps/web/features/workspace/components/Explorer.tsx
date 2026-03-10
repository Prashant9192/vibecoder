"use client";

import { useState, useRef, useEffect } from "react";
import { useFileSystemContext, FileNode } from "@/features/filesystem/context/FileSystemContext";
import { useEditor } from "@/features/editor/context/EditorContext";
import { FilePlus, FolderPlus, FolderInput, Pencil, Trash, ChevronRight, ChevronDown, Folder, FolderOpen, FileCode } from "lucide-react";

export default function Explorer() {
  const { files: fileSystemFiles, addFile, createFolder, renameFile, deleteFile, moveFile } = useFileSystemContext();
  const { activeFile, setActiveFile, files, setFiles, openFiles, setOpenFiles } = useEditor();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [creatingNode, setCreatingNode] = useState<{ parentPath: string, type: "file" | "folder" } | null>(null);
  const [renamingNode, setRenamingNode] = useState<{ path: string, initialName: string } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
  }, [creatingNode, renamingNode]);

  const openFile = (file: any) => {
    if (!files[file.path]) {
      setFiles({
        ...files,
        [file.path]: file.content || ""
      });
    }

    setActiveFile(file.path);

    if (!openFiles.includes(file.path)) {
      setOpenFiles([...openFiles, file.path]);
    }
  };

  const startCreating = (e: React.MouseEvent, type: "file" | "folder", parentPath: string = "/src") => {
    e.stopPropagation();
    setCreatingNode({ type, parentPath });
    setInputValue("");
    setExpanded(prev => ({ ...prev, [parentPath]: true }));
  };

  const commitCreating = () => {
    if (creatingNode && inputValue.trim()) {
      const name = inputValue.trim();
      if (creatingNode.type === "file") {
        addFile(name, creatingNode.parentPath);
        openFile({ name, path: `${creatingNode.parentPath}/${name}`, type: "file", content: "" });
      } else {
        createFolder(name, creatingNode.parentPath);
      }
    }
    setCreatingNode(null);
    setInputValue("");
  };

  const handleCreatingKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitCreating();
    if (e.key === "Escape") {
      setCreatingNode(null);
      setInputValue("");
    }
  };

  const startRenaming = (e: React.MouseEvent, nodePath: string, initialName: string) => {
    e.stopPropagation();
    setRenamingNode({ path: nodePath, initialName });
    setInputValue(initialName);
  };

  const commitRenaming = (nodePath: string, oldName: string) => {
    if (renamingNode && inputValue.trim() && inputValue.trim() !== oldName) {
      const trimName = inputValue.trim();
      
      const parentPath = nodePath.substring(0, nodePath.lastIndexOf('/'));
      const newPath = `${parentPath}/${trimName}`;
      
      renameFile(nodePath, trimName);

      if (openFiles.includes(nodePath)) {
        const newOpenTabs = openFiles.map(f => f === nodePath ? newPath : f);
        setOpenFiles(newOpenTabs);
      }

      const activeWasRenamed = activeFile === nodePath;

      if (files[nodePath] !== undefined) {
        const updated = { ...files };
        updated[newPath] = updated[nodePath];
        delete updated[nodePath];
        setFiles(updated);
      }

      if (activeWasRenamed) {
        setActiveFile(newPath);
      }
    }
    setRenamingNode(null);
    setInputValue("");
  };

  const handleRenamingKeyDown = (e: React.KeyboardEvent, node: FileNode) => {
    if (e.key === "Enter") commitRenaming(node.path, node.name);
    if (e.key === "Escape") {
      setRenamingNode(null);
      setInputValue("");
    }
  };

  const renderCreatingInput = (parentPath: string) => {
    if (!creatingNode || creatingNode.parentPath !== parentPath) return null;
    return (
      <div className="flex items-center gap-1.5 px-1 py-1 pl-4 text-[13px] bg-[#1A1A1A] border border-[#007FD4] rounded-sm min-w-0 h-7">
        {creatingNode.type === 'file' ? <FileCode size={14} className="flex-shrink-0 text-[#888888]" /> : <Folder size={14} className="flex-shrink-0 text-[#888888]" />}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleCreatingKeyDown}
          onBlur={commitCreating}
          className="bg-transparent outline-none flex-1 min-w-0 m-0 p-0 text-[#E5E5E5] leading-none"
        />
      </div>
    );
  };

  const handleDelete = (e: React.MouseEvent, nodePath: string, fileName: string) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(`Are you sure you want to delete ${fileName}?`);

    if (confirmDelete) {
      deleteFile(nodePath);

      const newOpenFiles = openFiles.filter(f => f !== nodePath);
      setOpenFiles(newOpenFiles);

      if (activeFile === nodePath) {
        if (newOpenFiles.length > 0) {
          const closedIndex = openFiles.indexOf(nodePath);
          const newActiveIndex = closedIndex > 0 ? closedIndex - 1 : 0;
          setActiveFile(newOpenFiles[newActiveIndex]);
        } else {
          setActiveFile(null);
        }
      }

      if (files[nodePath] !== undefined) {
        const updated = { ...files };
        delete updated[nodePath];
        setFiles(updated);
      }
    }
  };

  const handleMove = (e: React.MouseEvent, oldNodePath: string, fileName: string) => {
    e.stopPropagation();
    
    // Quick UI hack for now to select path instead of complicated folder traversing
    const newParentPath = prompt(`Move ${fileName} to folder path (e.g. /src/components):`, "/src");
    
    if (newParentPath && newParentPath.trim()) {
      moveFile(oldNodePath, newParentPath.trim());
      setExpanded(prev => ({ ...prev, [newParentPath.trim()]: true }));
    }
  };

  const toggleFolder = (folderName: string) => {
    setExpanded((prev) => ({
      ...prev,
      [folderName]: prev[folderName] === undefined ? false : !prev[folderName]
    }));
  };

  const renderNode = (node: FileNode) => {
    if (renamingNode && renamingNode.path === node.path) {
      return (
        <div key={node.path} className={`flex items-center gap-1.5 px-1 py-1 ${node.type === 'file' ? 'pl-4' : 'pl-0.5'} text-[13px] bg-[#1A1A1A] border border-[#007FD4] rounded-sm min-w-0 h-7`}>
          {node.type === 'file' ? (
            <FileCode size={14} className="flex-shrink-0 text-[#888888]" />
          ) : (
            <>
              <ChevronRight size={14} className="text-[#888888] flex-shrink-0 opacity-0" />
              <Folder size={14} className="flex-shrink-0 text-[#888888]" />
            </>
          )}
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => handleRenamingKeyDown(e, node)}
            onBlur={() => commitRenaming(node.path, node.name)}
            className="bg-transparent outline-none flex-1 min-w-0 m-0 p-0 text-[#E5E5E5] leading-none"
          />
        </div>
      );
    }

    if (node.type === "file") {
      return (
        <li
          key={node.path}
          className={`group flex items-center justify-between px-1 py-1 pl-4 cursor-pointer transition-colors text-[13px] rounded-sm select-none ${
            activeFile === node.path
              ? "bg-[#1A1A1A] text-[#E5E5E5]"
              : "text-[#888888] hover:bg-[#1A1A1A] hover:text-[#E5E5E5]"
            }`}
          onClick={() => openFile(node)}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <FileCode size={14} className="flex-shrink-0" />
            <span className="truncate leading-none pt-0.5">{node.name}</span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => handleMove(e, node.path, node.name)}
              className="text-[#888888] hover:text-[#E5E5E5] transition-colors p-[2px] rounded hover:bg-[#2A2A2A]"
              title="Move"
            >
              <FolderInput size={14} />
            </button>
            <button
              onClick={(e) => startRenaming(e, node.path, node.name)}
              className="text-[#888888] hover:text-[#E5E5E5] transition-colors p-[2px] rounded hover:bg-[#2A2A2A]"
              title="Rename"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => handleDelete(e, node.path, node.name)}
              className="text-[#888888] hover:text-[#FF0000] transition-colors p-[2px] rounded hover:bg-[#2A2A2A]"
              title="Delete"
            >
              <Trash size={14} />
            </button>
          </div>
        </li>
      );
    } else if (node.type === "folder") {
      const isExpanded = expanded[node.path] ?? true;

      return (
        <div key={node.path} className="mb-[2px]">
          <div
            className="group flex items-center justify-between px-0.5 py-1 cursor-pointer text-[13px] text-[#E5E5E5] hover:bg-[#1A1A1A] rounded-sm transition-colors select-none"
            onClick={() => toggleFolder(node.path)}
          >
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <span className="text-[#888888] flex-shrink-0">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <span className="text-[#888888] flex-shrink-0">
                {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
              </span>
              <span className="truncate leading-none pt-0.5">{node.name}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => startCreating(e, "file", node.path)}
                className="text-[#888888] hover:text-[#E5E5E5] transition-colors p-[2px] rounded hover:bg-[#2A2A2A]"
                title="New File inside folder"
              >
                <FilePlus size={14} />
              </button>
              <button
                onClick={(e) => startCreating(e, "folder", node.path)}
                className="text-[#888888] hover:text-[#E5E5E5] transition-colors p-[2px] rounded hover:bg-[#2A2A2A]"
                title="New Folder inside folder"
              >
                <FolderPlus size={14} />
              </button>
            </div>
          </div>

          {isExpanded && node.children && (
            <ul className="ml-3 pl-1 border-l border-[#2A2A2A] flex flex-col">
              {node.children.map((child) => renderNode(child))}
              {renderCreatingInput(node.path)}
            </ul>
          )}
        </div>
      );
    }
  };

  return (
    <div className="w-64 bg-[#0A0A0A] border-r border-[#1F1F1F] py-2 px-1 overflow-y-auto">
      <div className="flex items-center justify-between mb-2 px-2">
        <h2 className="text-[11px] uppercase tracking-wider font-semibold text-[#888888]">Explorer</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => startCreating(e, "file", "/src")}
            className="text-[#888888] hover:text-[#E5E5E5] transition-colors p-1 rounded hover:bg-[#1A1A1A]"
            title="New File"
          >
            <FilePlus size={14} />
          </button>
          <button
            onClick={(e) => startCreating(e, "folder", "/src")}
            className="text-[#888888] hover:text-[#E5E5E5] transition-colors p-1 rounded hover:bg-[#1A1A1A]"
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        {fileSystemFiles.map((node) => renderNode(node))}
      </div>
    </div>
  );
}