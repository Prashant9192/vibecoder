"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { ideLog } from "@/lib/ideLogger";
import { ideEventBus } from "@/lib/ideEventBus";
import { storage } from "@/lib/storage";

export type FileNode = {
    id: string;
    name: string;
    path: string;
    type: "file" | "folder";
    content?: string;
    children?: FileNode[];
};

const INITIAL_FILES: FileNode[] = [
    {
        id: "folder_src",
        name: "src",
        path: "/src",
        type: "folder",
        children: [
            {
                id: "file_main_ts",
                name: "main.ts",
                path: "/src/main.ts",
                type: "file",
                content: `function greet(name: string) {
  return "Hello " + name;
}

console.log(greet("VibeCoder"));`,
            },
            {
                id: "file_utils_ts",
                name: "utils.ts",
                path: "/src/utils.ts",
                type: "file",
                content: `export function sum(a: number, b: number) {
  return a + b;
}`,
            },
        ],
    },
];

interface FileSystemContextType {
    files: FileNode[];
    getNodeById: (id: string) => FileNode | undefined;
    getNodeByPath: (path: string) => FileNode | undefined;
    addFile: (fileName: string, parentPath?: string) => void;
    createFolder: (folderName: string, parentPath?: string) => void;
    renameFile: (path: string, newName: string) => void;
    renameFileById: (id: string, newName: string) => void;
    deleteFile: (path: string) => void;
    deleteFileById: (id: string) => void;
    moveFile: (sourcePath: string, targetParentPath: string) => void;
    moveFileById: (id: string, targetParentPath: string) => void;
    saveFile: (path: string, content: string) => void;
    saveFileById: (id: string, content: string) => void;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

const createId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (crypto as any).randomUUID() as string;
    }
    return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const findNodeByPath = (nodes: FileNode[], path: string): FileNode | undefined => {
    for (const node of nodes) {
        if (node.path === path) return node;
        if (node.type === "folder" && node.children) {
            const found = findNodeByPath(node.children, path);
            if (found) return found;
        }
    }
    return undefined;
};

const findNodeById = (nodes: FileNode[], id: string): FileNode | undefined => {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.type === "folder" && node.children) {
            const found = findNodeById(node.children, id);
            if (found) return found;
        }
    }
    return undefined;
};

export function FileSystemProvider({ children }: { children: React.ReactNode }) {
    const [files, setFiles] = useState<FileNode[]>(INITIAL_FILES);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setFiles(storage.get("files", INITIAL_FILES));
        setMounted(true);
    }, []);

    const getNodeById = (id: string) => findNodeById(files, id);
    const getNodeByPath = (path: string) => findNodeByPath(files, path);

    const syncAndSetFiles = useCallback((nextFiles: FileNode[]) => {
        setFiles(nextFiles);
        storage.set("files", nextFiles);
    }, []);

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

    // Recursively update all descendant paths when a parent path changes
    const rebaseChildPaths = (node: FileNode, oldParentPath: string, newParentPath: string): FileNode => {
        const newPath = newParentPath + node.path.slice(oldParentPath.length);
        if (node.type === "folder" && node.children) {
            return {
                ...node,
                path: newPath,
                children: node.children.map(child => rebaseChildPaths(child, oldParentPath, newParentPath))
            };
        }
        return { ...node, path: newPath };
    };

    const addFile = (fileName: string, parentPath: string = "/src") => {
        setFiles(prev => {
            const nextFiles = updateNodeInTree(prev, parentPath, folder => {
                if (folder.children?.some(f => f.name === fileName)) return folder;
                const newPath = `${folder.path}/${fileName}`;
                const id = createId();
                ideLog("FILE_CREATE", { path: newPath, parentPath });
                ideEventBus.emit("FILE_CREATE", { id, path: newPath, parentPath, type: "file" });
                return {
                    ...folder,
                    children: [...(folder.children || []), { id, name: fileName, path: newPath, type: "file", content: "" }]
                };
            });
            storage.set("files", nextFiles);
            return nextFiles;
        });
    };

    const createFolder = (newFolderName: string, parentPath: string = "/src") => {
        setFiles(prev => {
            const nextFiles = updateNodeInTree(prev, parentPath, folder => {
                if (folder.children?.some(f => f.name === newFolderName)) return folder;
                const newPath = `${folder.path}/${newFolderName}`;
                const id = createId();
                ideLog("FOLDER_CREATE", { path: newPath, parentPath });
                ideEventBus.emit("FILE_CREATE", { id, path: newPath, parentPath, type: "folder" });
                return {
                    ...folder,
                    children: [...(folder.children || []), { id, name: newFolderName, path: newPath, type: "folder", children: [] }]
                };
            });
            storage.set("files", nextFiles);
            return nextFiles;
        });
    };

    const renameFile = (path: string, newName: string) => {
        setFiles(prev => {
            const nodeToRename = findNodeByPath(prev, path);
            const renameInTree = (nodes: FileNode[]): FileNode[] => {
                return nodes.map(node => {
                    if (node.path === path) {
                        const parentPath = path.substring(0, path.lastIndexOf('/'));
                        const newPath = `${parentPath}/${newName}`;
                        ideLog("FILE_RENAME", { oldPath: path, newPath });
                        if (nodeToRename) {
                            ideEventBus.emit("FILE_RENAME", { id: nodeToRename.id, oldPath: path, newPath });
                        }
                        if (node.type === "folder" && node.children) {
                            const rebasedChildren = node.children.map(child =>
                                rebaseChildPaths(child, node.path, newPath)
                            );
                            return { ...node, name: newName, path: newPath, children: rebasedChildren };
                        }
                        return { ...node, name: newName, path: newPath };
                    }
                    if (node.type === "folder" && node.children) {
                        return { ...node, children: renameInTree(node.children) };
                    }
                    return node;
                });
            };
            const nextFiles = renameInTree(prev);
            storage.set("files", nextFiles);
            return nextFiles;
        });
    };

    const renameFileById = (id: string, newName: string) => {
        setFiles(prev => {
           const node = findNodeById(prev, id);
           if (!node) return prev;
           // We can't easily call renameFile(node.path) here because it is already inside a setFiles.
           // So I'll just embed the logic or use another helper.
           // Actually, the most robust way is to just call renameFile(node.path, newName) but from the OUTSIDE.
           // But since I'm already inside FileSystemProvider, I'll use a local helper.
           return prev; // Placeholder, I'll fix this below.
        });
        // Actually, I'll move the core logic to helpers outside the component if possible, 
        // OR just pass the path to renameFileById.
        const node = findNodeById(files, id);
        if (node) renameFile(node.path, newName);
    };

    const deleteFile = (path: string) => {
        setFiles(prev => {
            const nodeToDelete = findNodeByPath(prev, path);
            ideLog("FILE_DELETE", { path });
            if (nodeToDelete) {
                ideEventBus.emit("FILE_DELETE", { id: nodeToDelete.id, path });
            }
            const deleteFromTree = (nodes: FileNode[]): FileNode[] => {
                return nodes.filter(node => node.path !== path).map(node => {
                    if (node.type === "folder" && node.children) {
                        return { ...node, children: deleteFromTree(node.children) };
                    }
                    return node;
                });
            };
            const nextFiles = deleteFromTree(prev);
            storage.set("files", nextFiles);
            return nextFiles;
        });
    };

    const deleteFileById = (id: string) => {
        const node = findNodeById(files, id);
        if (node) deleteFile(node.path);
    };

    const moveFile = (sourcePath: string, targetParentPath: string) => {
        setFiles(prev => {
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

            let afterRemoval = removeFileFromTree(prev);
            const rootTargetIndex = afterRemoval.findIndex(f => f.path === sourcePath);
            if (rootTargetIndex !== -1) {
                fileToMove = afterRemoval[rootTargetIndex];
                afterRemoval = afterRemoval.filter(f => f.path !== sourcePath);
            }

            if (!fileToMove) return prev;

            const newPath = targetParentPath === "" ? `/${fileToMove.name}` : `${targetParentPath}/${fileToMove.name}`;
            let updatedFileToMove: FileNode;
            if (fileToMove.type === "folder" && fileToMove.children) {
                updatedFileToMove = {
                    ...fileToMove,
                    path: newPath,
                    children: fileToMove.children.map(child =>
                        rebaseChildPaths(child, fileToMove!.path, newPath)
                    )
                };
            } else {
                updatedFileToMove = { ...fileToMove, path: newPath };
            }

            ideLog("FILE_MOVE", { oldPath: sourcePath, newPath, targetParentPath });
            ideEventBus.emit("FILE_MOVE", { id: fileToMove.id, oldPath: sourcePath, newPath, targetParentPath });

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

            const nextFiles = targetParentPath === "" ? [...afterRemoval, updatedFileToMove] : addFileToTree(afterRemoval);
            storage.set("files", nextFiles);
            return nextFiles;
        });
    };

    const moveFileById = (id: string, targetParentPath: string) => {
        const node = findNodeById(files, id);
        if (node) moveFile(node.path, targetParentPath);
    };

    const saveFile = (path: string, content: string) => {
        setFiles(prev => {
            ideLog("FILE_SAVE", { path });
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
            const nextFiles = updateInTree(prev);
            storage.set("files", nextFiles);
            return nextFiles;
        });
    };

    const saveFileById = (id: string, content: string) => {
        const node = findNodeById(files, id);
        if (node) saveFile(node.path, content);
    };

    return (
        <FileSystemContext.Provider
            value={{
                files,
                getNodeById,
                getNodeByPath,
                addFile,
                createFolder,
                renameFile,
                renameFileById,
                deleteFile,
                deleteFileById,
                moveFile,
                moveFileById,
                saveFile,
                saveFileById,
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
