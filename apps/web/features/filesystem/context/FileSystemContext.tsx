"use client";

import React, { createContext, useContext, useState } from "react";

export type FileNode = {
    name: string;
    type: "file" | "folder";
    content?: string;
    children?: FileNode[];
};

interface FileSystemContextType {
    files: FileNode[];
    addFile: (fileName: string, folderName?: string) => void;
    createFolder: (folderName: string, parentFolderName?: string) => void;
    renameFile: (oldName: string, newName: string, folderName?: string) => void;
    deleteFile: (fileName: string, folderName?: string) => void;
    moveFile: (fileName: string, oldFolderName: string, newFolderName: string) => void;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

export function FileSystemProvider({ children }: { children: React.ReactNode }) {
    const [files, setFiles] = useState<FileNode[]>([
        {
            name: "src",
            type: "folder",
            children: [
                {
                    name: "main.ts",
                    type: "file",
                    content: `function greet(name: string) {
  return "Hello " + name;
}

console.log(greet("VibeCoder"));`,
                },
                {
                    name: "utils.ts",
                    type: "file",
                    content: `export function sum(a: number, b: number) {
  return a + b;
}`,
                },
            ],
        },
    ]);

    const updateNodeInTree = (nodes: FileNode[], folderName: string, updateFn: (folder: FileNode) => FileNode): FileNode[] => {
        return nodes.map(node => {
            if (node.type === "folder" && node.name === folderName) {
                return updateFn(node);
            }
            if (node.type === "folder" && node.children) {
                return { ...node, children: updateNodeInTree(node.children, folderName, updateFn) };
            }
            return node;
        });
    };

    const addFile = (fileName: string, folderName: string = "src") => {
        setFiles(prevFiles => updateNodeInTree(prevFiles, folderName, folder => {
            if (folder.children?.some(f => f.name === fileName)) return folder;
            return {
                ...folder,
                children: [...(folder.children || []), { name: fileName, type: "file", content: "" }]
            };
        }));
    };

    const createFolder = (newFolderName: string, parentFolderName: string = "src") => {
        setFiles(prevFiles => updateNodeInTree(prevFiles, parentFolderName, folder => {
            if (folder.children?.some(f => f.name === newFolderName)) return folder;
            return {
                ...folder,
                children: [...(folder.children || []), { name: newFolderName, type: "folder", children: [] }]
            };
        }));
    };

    const renameFile = (oldName: string, newName: string, folderName: string = "src") => {
        setFiles(prevFiles => updateNodeInTree(prevFiles, folderName, folder => {
            if (folder.children?.some(f => f.name === newName)) return folder;
            return {
                ...folder,
                children: folder.children?.map(f =>
                    f.name === oldName ? { ...f, name: newName } : f
                )
            };
        }));
    };

    const deleteFile = (fileName: string, folderName: string = "src") => {
        setFiles(prevFiles => updateNodeInTree(prevFiles, folderName, folder => {
            return {
                ...folder,
                children: folder.children?.filter(f => f.name !== fileName)
            };
        }));
    };

    const moveFile = (fileName: string, oldFolderName: string, newFolderName: string) => {
        setFiles(prevFiles => {
            let fileToMove: FileNode | undefined;

            const removeFileFromTree = (nodes: FileNode[]): FileNode[] => {
                return nodes.map(node => {
                    if (node.type === "folder" && node.name === oldFolderName) {
                        const target = node.children?.find(f => f.name === fileName);
                        if (target) {
                            fileToMove = target;
                            return {
                                ...node,
                                children: node.children?.filter(f => f.name !== fileName)
                            };
                        }
                    }
                    if (node.type === "folder" && node.children) {
                        return { ...node, children: removeFileFromTree(node.children) };
                    }
                    return node;
                });
            };

            const afterRemoval = removeFileFromTree(prevFiles);

            if (!fileToMove) return prevFiles;

            const addFileToTree = (nodes: FileNode[]): FileNode[] => {
                return nodes.map(node => {
                    if (node.type === "folder" && node.name === newFolderName) {
                        if (node.children?.some(f => f.name === fileName)) return node;
                        return {
                            ...node,
                            children: [...(node.children || []), fileToMove!]
                        };
                    }
                    if (node.type === "folder" && node.children) {
                        return { ...node, children: addFileToTree(node.children) };
                    }
                    return node;
                });
            };

            return addFileToTree(afterRemoval);
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
