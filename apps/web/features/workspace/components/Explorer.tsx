"use client";

import { useState } from "react";
import { useFileSystem } from "@/features/editor/hooks/useFileSystem";
import { useEditor } from "@/features/editor/context/EditorContext";

export default function Explorer() {
  const { files: fileSystemFiles, addFile, renameFile } = useFileSystem();
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

      // Update active tabs mapping if file is currently open
      if (openFiles.includes(oldName)) {
        const newOpenTabs = openFiles.map(f => f === oldName ? trimName : f);
        setOpenFiles(newOpenTabs);
      }

      // Re-map the editor code dictionary safely
      if (files[oldName] !== undefined) {
        const updatedFiles = { ...files };
        updatedFiles[trimName] = updatedFiles[oldName];
        delete updatedFiles[oldName];
        setFiles(updatedFiles);
      }

      // Re-claim focused state if it was currently rendered
      if (activeFile === oldName) {
        setActiveFile(trimName);
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
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
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
                    className="group flex items-center justify-between px-1 py-1 pl-4 cursor-pointer transition-colors hover:bg-[#0F0F0F] hover:text-[#FF0000] rounded"
                    onClick={() => openFile(file)}
                  >
                    <div className="flex items-center gap-2">
                      <span>📄</span>
                      <span>{file.name}</span>
                    </div>

                    <button
                      onClick={(e) => handleRename(e, folder.name, file.name)}
                      className="opacity-0 group-hover:opacity-100 text-[#888888] hover:text-[#E5E5E5] transition-opacity px-1"
                      title="Rename"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </button>
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