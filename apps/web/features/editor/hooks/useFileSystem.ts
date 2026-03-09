import { useState } from "react";

export type FileNode = {
    name: string;
    content?: string;
    children?: FileNode[];
};

export function useFileSystem() {
    const [files, setFiles] = useState<FileNode[]>([
        {
            name: "src",
            children: [
                {
                    name: "main.ts",
                    content: `function greet(name: string) {
  return "Hello " + name;
}

console.log(greet("VibeCoder"));`,
                },
                {
                    name: "utils.ts",
                    content: `export function sum(a: number, b: number) {
  return a + b;
}`,
                },
            ],
        },
    ]);

    const addFile = (fileName: string, folderName: string = "src") => {
        setFiles(prevFiles => {
            return prevFiles.map(folder => {
                if (folder.name === folderName) {
                    // Check if file already exists
                    if (folder.children?.some(f => f.name === fileName)) {
                        return folder;
                    }
                    return {
                        ...folder,
                        children: [...(folder.children || []), { name: fileName, content: "" }]
                    };
                }
                return folder;
            });
        });
    };

    const renameFile = (oldName: string, newName: string, folderName: string = "src") => {
        setFiles(prevFiles => {
            return prevFiles.map(folder => {
                if (folder.name === folderName) {
                    // Check if new name already exists
                    if (folder.children?.some(f => f.name === newName)) {
                        return folder;
                    }
                    return {
                        ...folder,
                        children: folder.children?.map(f =>
                            f.name === oldName ? { ...f, name: newName } : f
                        )
                    };
                }
                return folder;
            });
        });
    };

    return {
        files,
        setFiles,
        addFile,
        renameFile,
    };
}