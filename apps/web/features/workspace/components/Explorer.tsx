"use client";

import { useFileSystem } from "@/features/editor/hooks/useFileSystem";
import { useEditor } from "@/features/editor/context/EditorContext";

export default function Explorer() {
  const { files: fileSystemFiles } = useFileSystem();
  const { setActiveFile, files, setFiles, openFiles, setOpenFiles } = useEditor();

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

  return (
    <div className="w-64 bg-[#0A0A0A] border-r border-[#1F1F1F] p-4">
      <h2 className="text-sm font-semibold mb-3 text-[#E5E5E5]">Explorer</h2>

      {fileSystemFiles.map((folder) => (
        <div key={folder.name}>
          <p className="text-[#E5E5E5]">{folder.name}</p>

          <ul className="ml-4 text-sm text-[#888888]">
            {folder.children?.map((file) => (
              <li
                key={file.name}
                className="cursor-pointer transition-colors hover:text-[#FF0000]"
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