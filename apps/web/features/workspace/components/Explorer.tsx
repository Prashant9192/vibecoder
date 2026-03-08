"use client";

import { useFileSystem } from "@/features/editor/hooks/useFileSystem";
import { useEditor } from "@/features/editor/hooks/useEditor";

export default function Explorer() {
  const { files } = useFileSystem();
  const { setActiveFile, setCode } = useEditor();

  const openFile = (file: any) => {
    setActiveFile(file.name);
    setCode(file.content || "");
  };

  return (
    <div className="w-64 bg-[#1A1A1D] p-4">
      <h2 className="text-sm font-semibold mb-3">Explorer</h2>

      {files.map((folder) => (
        <div key={folder.name}>
          <p className="text-gray-300">{folder.name}</p>

          <ul className="ml-4 text-sm text-gray-400">
            {folder.children?.map((file) => (
              <li
                key={file.name}
                className="cursor-pointer hover:text-white"
                onClick={() => openFile(file)}
              >
                {file.name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}