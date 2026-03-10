"use client";

import React, { createContext, useContext, useState } from "react";

export type FileNode = {
    name: string;
    path: string;
    type: "file" | "folder";
    content?: string;
    children?: FileNode[];
};

interface FileSystemContextType {
    files: FileNode[];
    addFile: (fileName: string, parentPath?: string) => void;
    createFolder: (folderName: string, parentPath?: string) => void;
    renameFile: (path: string, newName: string) => void;
    deleteFile: (path: string) => void;
    moveFile: (sourcePath: string, targetParentPath: string) => void;
    saveFile: (path: string, content: string) => void;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

export function FileSystemProvider({ children }: { children: React.ReactNode }) {
    const [files, setFiles] = useState<FileNode[]>([
        {
            name: "src",
            path: "/src",
            type: "folder",
            children: [
                {
                    name: "main.ts",
                    path: "/src/main.ts",
                    type: "file",
                    content: `function greet(name: string) {
  return "Hello " + name;
}

console.log(greet("VibeCoder"));`,
                },
                {
                    name: "utils.ts",
                    path: "/src/utils.ts",
                    type: "file",
                    content: `export function sum(a: number, b: number) {
  return a + b;
}`,
                },
            ],
        },
    ]);

    const updateNodeInTree = (nodes: FileNode[], targetPath: string, updateFn: (folder: FileNode) => FileNode): FileNode[] => {
        return nodes.map(node => {
            if (node.type === "folder" && node.path === targetPath) {
                return updateFn(node);
            }
            if (node.type === "folder" && node.children) {
                return { ...node, children: updateNodeInTree(node.children, targetPath, updateFn) };
            }
            return node;
        });
    };

    const addFile = (fileName: string, parentPath: string = "/src") => {
        setFiles(prevFiles => updateNodeInTree(prevFiles, parentPath, folder => {
            if (folder.children?.some(f => f.name === fileName)) return folder;
            const newPath = `${folder.path}/${fileName}`;
            return {
                ...folder,
                children: [...(folder.children || []), { name: fileName, path: newPath, type: "file", content: "" }]
            };
        }));
    };

    const createFolder = (newFolderName: string, parentPath: string = "/src") => {
        setFiles(prevFiles => updateNodeInTree(prevFiles, parentPath, folder => {
            if (folder.children?.some(f => f.name === newFolderName)) return folder;
            const newPath = `${folder.path}/${newFolderName}`;
            return {
                ...folder,
                children: [...(folder.children || []), { name: newFolderName, path: newPath, type: "folder", children: [] }]
            };
        }));
    };

    const renameFile = (path: string, newName: string) => {
        setFiles(prevFiles => {
            const renameInTree = (nodes: FileNode[]): FileNode[] => {
                return nodes.map(node => {
                    if (node.path === path) { // Found exact match to rename
                       // If folder, technically we need to recursively update children paths. Keeping simple for now since renaming folders isn't explicitly required yet, but let's handle file rename properly.
                        const parentPath = path.substring(0, path.lastIndexOf('/'));
                        const newPath = `${parentPath}/${newName}`;
                        return { ...node, name: newName, path: newPath };
                    }
                    if (node.type === "folder" && node.children) {
                        return { ...node, children: renameInTree(node.children) };
                    }
                    return node;
                });
            };
            return renameInTree(prevFiles);
        });
    };

    const deleteFile = (path: string) => {
        setFiles(prevFiles => {
            const deleteFromTree = (nodes: FileNode[]): FileNode[] => {
                return nodes.filter(node => node.path !== path).map(node => {
                    if (node.type === "folder" && node.children) {
                        return { ...node, children: deleteFromTree(node.children) };
                    }
                    return node;
                });
            };
            return deleteFromTree(prevFiles);
        });
    };

    const moveFile = (sourcePath: string, targetParentPath: string) => {
        setFiles(prevFiles => {
            let fileToMove: FileNode | undefined;

            const removeFileFromTree = (nodes: FileNode[]): FileNode[] => {
                return nodes.map(node => {
                    if (node.type === "folder" && node.children) {
                        const targetIndex = node.children.findIndex(f => f.path === sourcePath);
                        if (targetIndex !== -1) {
                            fileToMove = node.children[targetIndex];
                            const newChildren = [...node.children];
                            newChildren.splice(targetIndex, 1);
                            return { ...node, children: newChildren };
                        }
                        return { ...node, children: removeFileFromTree(node.children) };
                    }
                    return node;
                });
            };

            // First pass mutates slightly by removing it but we return a new array
            let afterRemoval = removeFileFromTree(prevFiles);
            // If it was at the root somehow
            const rootTargetIndex = afterRemoval.findIndex(f => f.path === sourcePath);
             if (rootTargetIndex !== -1) {
                fileToMove = afterRemoval[rootTargetIndex];
                afterRemoval = afterRemoval.filter(f => f.path !== sourcePath);
             }


            if (!fileToMove) return prevFiles;

            // Recalculate path based on new parent
            const newPath = targetParentPath === "" ? `/${fileToMove.name}` : `${targetParentPath}/${fileToMove.name}`;
            const updatedFileToMove = { ...fileToMove, path: newPath };

            const addFileToTree = (nodes: FileNode[]): FileNode[] => {
                return nodes.map(node => {
                    if (node.type === "folder" && node.path === targetParentPath) {
                        if (node.children?.some(f => f.name === updatedFileToMove.name)) return node;
                        return {
                            ...node,
                            children: [...(node.children || []), updatedFileToMove]
                        };
                    }
                    if (node.type === "folder" && node.children) {
                        return { ...node, children: addFileToTree(node.children) };
                    }
                    return node;
                });
            };

            if (targetParentPath === "") {
               return [...afterRemoval, updatedFileToMove];
            }

            return addFileToTree(afterRemoval);
        });
    };

    const saveFile = (path: string, content: string) => {
        setFiles(prevFiles => {
            const updateInTree = (nodes: FileNode[]): FileNode[] => {
                return nodes.map(node => {
                    if (node.path === path && node.type === "file") {
                        return { ...node, content };
                    }
                    if (node.type === "folder" && node.children) {
                        return { ...node, children: updateInTree(node.children) };
                    }
                    return node;
                });
            };
            return updateInTree(prevFiles);
        });
    };

    return (
        <FileSystemContext.Provider
            value={{
                files,
                addFile,
                createFolder,
                renameFile,
                deleteFile,
                moveFile,
                saveFile,
            }}
        >
            {children}
        </FileSystemContext.Provider>
    );
}

export function useFileSystemContext() {
    const context = useContext(FileSystemContext);
    if (context === undefined) {
        throw new Error("useFileSystemContext must be used within a FileSystemProvider");
    }
    return context;
}
