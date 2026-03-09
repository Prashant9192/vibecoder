"use client";

import { useState } from "react";
import { useFileSystemContext, FileNode } from "@/features/filesystem/context/FileSystemContext";
import { useEditor } from "@/features/editor/context/EditorContext";
import { FilePlus, FolderPlus, FolderInput, Pencil, Trash } from "lucide-react";

export default function Explorer() {
  const { files: fileSystemFiles, addFile, createFolder, renameFile, deleteFile, moveFile } = useFileSystemContext();
  const { activeFile, setActiveFile, files, setFiles, openFiles, setOpenFiles } = useEditor();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const openFile = (file: any) => {
    if (!files[file.name]) {
      setFiles({
        ...files,
        [file.name]: file.content || ""
      });
    }

    setActiveFile(file.name);

    if (!openFiles.includes(file.name)) {
      setOpenFiles([...openFiles, file.name]);
    }
  };

  const handleNewFile = (parentFolder: string = "src") => {
    const fileName = prompt(`Enter new file name in ${parentFolder}:`);
    if (fileName && fileName.trim()) {
      const name = fileName.trim();
      addFile(name, parentFolder);
      openFile({ name, type: "file", content: "" });
    }
  };

  const handleNewFolder = (parentFolder: string = "src") => {
    const folderName = prompt(`Enter new folder name in ${parentFolder}:`);
    if (folderName && folderName.trim()) {
      createFolder(folderName.trim(), parentFolder);
      // Automatically expand parent whenever a child is added
      setExpanded(prev => ({ ...prev, [parentFolder]: true }));
    }
  };

  const handleRename = (e: React.MouseEvent, folderName: string, oldName: string) => {
    e.stopPropagation();
    const newName = prompt(`Rename ${oldName} to:`, oldName);

    if (newName && newName.trim() && newName.trim() !== oldName) {
      const trimName = newName.trim();
      renameFile(oldName, trimName, folderName);

      if (openFiles.includes(oldName)) {
        const newOpenTabs = openFiles.map(f => f === oldName ? trimName : f);
        setOpenFiles(newOpenTabs);
      }

      const activeWasRenamed = activeFile === oldName;

      if (files[oldName] !== undefined) {
        const updated = { ...files };
        updated[trimName] = updated[oldName];
        delete updated[oldName];
        setFiles(updated);
      }

      if (activeWasRenamed) {
        setActiveFile(trimName);
      }
    }
  };

  const handleDelete = (e: React.MouseEvent, folderName: string, fileName: string) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(`Are you sure you want to delete ${fileName}?`);

    if (confirmDelete) {
      deleteFile(fileName, folderName);

      const newOpenFiles = openFiles.filter(f => f !== fileName);
      setOpenFiles(newOpenFiles);

      if (activeFile === fileName) {
        if (newOpenFiles.length > 0) {
          const closedIndex = openFiles.indexOf(fileName);
          const newActiveIndex = closedIndex > 0 ? closedIndex - 1 : 0;
          setActiveFile(newOpenFiles[newActiveIndex]);
        } else {
          setActiveFile(null);
        }
      }

      if (files[fileName] !== undefined) {
        const updated = { ...files };
        delete updated[fileName];
        setFiles(updated);
      }
    }
  };

  const handleMove = (e: React.MouseEvent, oldFolderName: string, fileName: string) => {
    e.stopPropagation();
    const newFolderName = prompt(`Move ${fileName} to folder:`, oldFolderName);

    if (newFolderName && newFolderName.trim() && newFolderName.trim() !== oldFolderName) {
      moveFile(fileName, oldFolderName, newFolderName.trim());
      // Expand target folder automatically to show moved file
      setExpanded(prev => ({ ...prev, [newFolderName.trim()]: true }));
    }
  };

  const toggleFolder = (folderName: string) => {
    setExpanded((prev) => ({
      ...prev,
      [folderName]: prev[folderName] === undefined ? false : !prev[folderName]
    }));
  };

  const renderNode = (node: FileNode, parentName: string = "") => {
    if (node.type === "file") {
      return (
        <li
          key={node.name}
          className="group flex items-stretch justify-between px-1 py-1 pl-4 cursor-pointer transition-colors hover:bg-[#0F0F0F] hover:text-[#FF0000] rounded"
          onClick={() => openFile(node)}
        >
          <div className="flex items-center gap-2">
            <span>📄</span>
            <span>{node.name}</span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => handleMove(e, parentName, node.name)}
              className="text-[#888888] hover:text-[#E5E5E5] transition-colors px-1"
              title="Move"
            >
              <FolderInput size={14} />
            </button>
            <button
              onClick={(e) => handleRename(e, parentName, node.name)}
              className="text-[#888888] hover:text-[#E5E5E5] transition-colors px-1"
              title="Rename"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => handleDelete(e, parentName, node.name)}
              className="text-[#888888] hover:text-[#FF0000] transition-colors px-1"
              title="Delete"
            >
              <Trash size={14} />
            </button>
          </div>
        </li>
      );
    } else if (node.type === "folder") {
      const isExpanded = expanded[node.name] ?? true;

      return (
        <div key={node.name} className="mb-1">
          <div
            className="group flex items-center justify-between px-1 py-1 cursor-pointer text-[#E5E5E5] hover:bg-[#0F0F0F] hover:text-[#FF0000] rounded transition-colors"
            onClick={() => toggleFolder(node.name)}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] w-3 text-center">{isExpanded ? '▼' : '▶'}</span>
              <span className="text-sm">📁</span>
              <span className="text-sm">{node.name}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNewFile(node.name);
                }}
                className="text-[#888888] hover:text-[#E5E5E5] transition-colors px-1"
                title="New File inside folder"
              >
                <FilePlus size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNewFolder(node.name);
                }}
                className="text-[#888888] hover:text-[#E5E5E5] transition-colors px-1"
                title="New Folder inside folder"
              >
                <FolderPlus size={14} />
              </button>
            </div>
          </div>

          {isExpanded && node.children && (
            <ul className="ml-4 flex flex-col text-sm text-[#888888]">
              {node.children.map((child) => renderNode(child, node.name))}
            </ul>
          )}
        </div>
      );
    }
  };

  return (
    <div className="w-64 bg-[#0A0A0A] border-r border-[#1F1F1F] p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[#E5E5E5]">Explorer</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNewFile("src")}
            className="text-[#888888] hover:text-[#E5E5E5] transition-colors"
            title="New File"
          >
            <FilePlus size={16} />
          </button>
          <button
            onClick={() => handleNewFolder("src")}
            className="text-[#888888] hover:text-[#E5E5E5] transition-colors"
            title="New Folder"
          >
            <FolderPlus size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        {fileSystemFiles.map((node) => renderNode(node))}
      </div>
    </div>
  );
}