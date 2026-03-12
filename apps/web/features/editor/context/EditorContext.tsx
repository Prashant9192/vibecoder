"use client";

import React, { createContext, useContext, useState } from "react";

interface EditorContextType {
    activeFile: string | null;
    openFiles: string[];
    files: Record<string, string>;
    unsavedFiles: string[];
    recentFiles: string[];
    cursorPosition: { lineNumber: number, column: number } | null;
    setActiveFile: (file: string | null) => void;
    setOpenFiles: (files: string[]) => void;
    setFiles: (files: Record<string, string>) => void;
    setUnsavedFiles: (files: string[]) => void;
    setCursorPosition: (pos: { lineNumber: number, column: number } | null) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
    const [activeFile, setActiveFile] = useState<string | null>(null);
    const [openFiles, setOpenFiles] = useState<string[]>([]);
    const [files, setFiles] = useState<Record<string, string>>({});
    const [unsavedFiles, setUnsavedFiles] = useState<string[]>([]);
    const [recentFiles, setRecentFiles] = useState<string[]>([]);
    const [cursorPosition, setCursorPosition] = useState<{ lineNumber: number, column: number } | null>(null);

    const handleSetActiveFile = (file: string | null) => {
        setActiveFile(file);
        if (file) {
            setRecentFiles(prev => {
                const filtered = prev.filter(f => f !== file);
                return [file, ...filtered].slice(0, 10);
            });
        }
    };

    return (
        <EditorContext.Provider
            value={{
                activeFile,
                openFiles,
                files,
                unsavedFiles,
                recentFiles,
                cursorPosition,
                setActiveFile: handleSetActiveFile,
                setOpenFiles,
                setFiles,
                setUnsavedFiles,
                setCursorPosition,
            }}
        >
            {children}
        </EditorContext.Provider>
    );
}

export function useEditor() {
    const context = useContext(EditorContext);
    if (context === undefined) {
        throw new Error("useEditor must be used within an EditorProvider");
    }
    return context;
}
