"use client";

import React, { createContext, useContext, useState } from "react";

interface EditorContextType {
    activeFile: string | null;
    openFiles: string[];
    files: Record<string, string>;
    unsavedFiles: string[];
    setActiveFile: (file: string | null) => void;
    setOpenFiles: (files: string[]) => void;
    setFiles: (files: Record<string, string>) => void;
    setUnsavedFiles: (files: string[]) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
    const [activeFile, setActiveFile] = useState<string | null>(null);
    const [openFiles, setOpenFiles] = useState<string[]>([]);
    const [files, setFiles] = useState<Record<string, string>>({});
    const [unsavedFiles, setUnsavedFiles] = useState<string[]>([]);

    return (
        <EditorContext.Provider
            value={{
                activeFile,
                openFiles,
                files,
                unsavedFiles,
                setActiveFile,
                setOpenFiles,
                setFiles,
                setUnsavedFiles,
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
