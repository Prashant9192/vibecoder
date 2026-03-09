"use client";

import { useState } from "react";
import { useFileSystem } from "@/features/editor/hooks/useFileSystem";
import { useEditor } from "@/features/editor/context/EditorContext";
import { FilePlus, Pencil, Trash } from "lucide-react";

export default function Explorer() {
  const { files: fileSystemFiles, addFile, renameFile, deleteFile } = useFileSystem();
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

  const handleNewFile = () => {
    const fileName = prompt("Enter new file name:");
    if (fileName && fileName.trim()) {
      const name = fileName.trim();
      addFile(name, "src");
      openFile({ name, content: "" });
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

      if (files[oldName] !== undefined) {
        const updatedFiles = { ...files };
        updatedFiles[trimName] = updatedFiles[oldName];
        delete updatedFiles[oldName];
        setFiles(updatedFiles);
      }

      if (activeFile === oldName) {
        setActiveFile(trimName);
      }
    }
  };

  const handleDelete = (e: React.MouseEvent, folderName: string, fileName: string) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(`Are you sure you want to delete ${fileName}?`);

    if (confirmDelete) {
      deleteFile(fileName, folderName);

      // Clean up open tabs and fallback active rendering naturally
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

      // Cleanup local state code cache dict
      if (files[fileName] !== undefined) {
        const updatedFiles = { ...files };
        delete updatedFiles[fileName];
        setFiles(updatedFiles);
      }
    }
  };

  const toggleFolder = (folderName: string) => {
    setExpanded((prev) => ({
      ...prev,
      [folderName]: prev[folderName] === undefined ? false : !prev[folderName]
    }));
  };

  return (
    <div className="w-64 bg-[#0A0A0A] border-r border-[#1F1F1F] p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[#E5E5E5]">Explorer</h2>
        <button
          onClick={handleNewFile}
          className="text-[#888888] hover:text-[#E5E5E5] transition-colors"
          title="New File"
        >
          <FilePlus size={16} />
        </button>
      </div>

      {fileSystemFiles.map((folder) => {
        const isExpanded = expanded[folder.name] ?? true;

        return (
          <div key={folder.name} className="mb-1">
            <div
              className="flex items-center gap-1.5 px-1 py-1 cursor-pointer text-[#E5E5E5] hover:bg-[#0F0F0F] hover:text-[#FF0000] rounded transition-colors"
              onClick={() => toggleFolder(folder.name)}
            >
              <span className="text-[10px] w-3 text-center">{isExpanded ? '▼' : '▶'}</span>
              <span className="text-sm">📁</span>
              <span className="text-sm">{folder.name}</span>
            </div>

            {isExpanded && (
              <ul className="ml-4 flex flex-col text-sm text-[#888888]">
                {folder.children?.map((file) => (
                  <li
                    key={file.name}
                    className="group flex items-stretch justify-between px-1 py-1 pl-4 cursor-pointer transition-colors hover:bg-[#0F0F0F] hover:text-[#FF0000] rounded"
                    onClick={() => openFile(file)}
                  >
                    <div className="flex items-center gap-2">
                      <span>📄</span>
                      <span>{file.name}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleRename(e, folder.name, file.name)}
                        className="text-[#888888] hover:text-[#E5E5E5] transition-colors px-1"
                        title="Rename"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, folder.name, file.name)}
                        className="text-[#888888] hover:text-[#FF0000] transition-colors px-1"
                        title="Delete"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}