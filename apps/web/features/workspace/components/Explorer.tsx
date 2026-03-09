"use client";

import { useState } from "react";
import { useFileSystem } from "@/features/editor/hooks/useFileSystem";
import { useEditor } from "@/features/editor/context/EditorContext";

export default function Explorer() {
  const { files: fileSystemFiles } = useFileSystem();
  const { setActiveFile, files, setFiles, openFiles, setOpenFiles } = useEditor();
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

  const toggleFolder = (folderName: string) => {
    setExpanded((prev) => ({
      ...prev,
      [folderName]: prev[folderName] === undefined ? false : !prev[folderName]
    }));
  };

  return (
    <div className="w-64 bg-[#0A0A0A] border-r border-[#1F1F1F] p-4 overflow-y-auto">
      <h2 className="text-sm font-semibold mb-3 text-[#E5E5E5]">Explorer</h2>

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
                    className="flex items-center gap-2 px-1 py-1 pl-4 cursor-pointer transition-colors hover:bg-[#0F0F0F] hover:text-[#FF0000] rounded"
                    onClick={() => openFile(file)}
                  >
                    <span>📄</span>
                    <span>{file.name}</span>
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