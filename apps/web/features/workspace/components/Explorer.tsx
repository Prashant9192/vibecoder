"use client";

import { useState } from "react";
import { useFileSystemContext, FileNode } from "@/features/filesystem/context/FileSystemContext";
import { useEditor } from "@/features/editor/context/EditorContext";
import { FilePlus, FolderPlus, FolderInput, Pencil, Trash, ChevronRight, ChevronDown, Folder, FolderOpen, FileCode } from "lucide-react";

export default function Explorer() {
  const { files: fileSystemFiles, addFile, createFolder, renameFile, deleteFile, moveFile } = useFileSystemContext();
  const { activeFile, setActiveFile, files, setFiles, openFiles, setOpenFiles } = useEditor();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

  const handleNewFile = (parentPath: string = "/src") => {
    const fileName = prompt(`Enter new file name in ${parentPath}:`);
    if (fileName && fileName.trim()) {
      const name = fileName.trim();
      addFile(name, parentPath);
      openFile({ name, path: `${parentPath}/${name}`, type: "file", content: "" });
    }
  };

  const handleNewFolder = (parentPath: string = "/src") => {
    const folderName = prompt(`Enter new folder name in ${parentPath}:`);
    if (folderName && folderName.trim()) {
      createFolder(folderName.trim(), parentPath);
      setExpanded(prev => ({ ...prev, [parentPath]: true }));
    }
  };

  const handleRename = (e: React.MouseEvent, nodePath: string, oldName: string) => {
    e.stopPropagation();
    const newName = prompt(`Rename ${oldName} to:`, oldName);

    if (newName && newName.trim() && newName.trim() !== oldName) {
      const trimName = newName.trim();
      
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
              onClick={(e) => handleRename(e, node.path, node.name)}
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleNewFile(node.path);
                }}
                className="text-[#888888] hover:text-[#E5E5E5] transition-colors p-[2px] rounded hover:bg-[#2A2A2A]"
                title="New File inside folder"
              >
                <FilePlus size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNewFolder(node.path);
                }}
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
            onClick={() => handleNewFile("/src")}
            className="text-[#888888] hover:text-[#E5E5E5] transition-colors p-1 rounded hover:bg-[#1A1A1A]"
            title="New File"
          >
            <FilePlus size={14} />
          </button>
          <button
            onClick={() => handleNewFolder("/src")}
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