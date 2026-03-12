"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface EditorGroup {
    tabs: string[];
    activeFile: string | null;
}

interface EditorGroupsState {
    left: EditorGroup;
    right: EditorGroup;
}

interface EditorContextType {
    editorGroups: EditorGroupsState;
    activeGroup: "left" | "right";
    isSplitView: boolean;
    files: Record<string, string>;
    unsavedFiles: string[];
    recentFiles: string[];
    cursorPosition: { lineNumber: number, column: number } | null;
    lineToReveal: number | null;
    
    // Actions
    setActiveFile: (file: string | null, group?: "left" | "right") => void;
    setTabs: (tabs: string[], group: "left" | "right") => void;
    setIsSplitView: (split: boolean) => void;
    setFiles: (files: Record<string, string>) => void;
    setUnsavedFiles: (files: string[]) => void;
    setCursorPosition: (pos: { lineNumber: number, column: number } | null) => void;
    setLineToReveal: (line: number | null) => void;
    setActiveGroup: (group: "left" | "right") => void;
    // Helper to gracefully open a file
    openFile: (file: string, group?: "left" | "right") => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
    const [editorGroups, setEditorGroups] = useState<EditorGroupsState>({
        left: { tabs: [], activeFile: null },
        right: { tabs: [], activeFile: null }
    });
    const [activeGroup, setActiveGroup] = useState<"left" | "right">("left");
    const [isSplitView, setIsSplitView] = useState(false);

    const [files, setFiles] = useState<Record<string, string>>({});
    const [unsavedFiles, setUnsavedFiles] = useState<string[]>([]);
    const [recentFiles, setRecentFiles] = useState<string[]>([]);
    const [cursorPosition, setCursorPosition] = useState<{ lineNumber: number, column: number } | null>(null);
    const [lineToReveal, setLineToReveal] = useState<number | null>(null);

    const setActiveFile = useCallback((file: string | null, group?: "left" | "right") => {
        const targetGroup = group || activeGroup;
        setEditorGroups(prev => ({
            ...prev,
            [targetGroup]: {
                ...prev[targetGroup],
                activeFile: file
            }
        }));
        // Only update recent files if we're actually setting a file
        if (file) {
            setRecentFiles(prev => {
                const filtered = prev.filter(f => f !== file);
                return [file, ...filtered].slice(0, 10);
            });
        }
    }, [activeGroup]);

    const setTabs = useCallback((tabs: string[], group: "left" | "right") => {
        setEditorGroups(prev => ({
            ...prev,
            [group]: {
                ...prev[group],
                tabs
            }
        }));
    }, []);

    const openFile = useCallback((fileId: string, group?: "left" | "right") => {
        const targetGroup = group || activeGroup;
        setEditorGroups(prev => {
            const currentTabs = prev[targetGroup].tabs;
            const newTabs = currentTabs.includes(fileId) ? currentTabs : [...currentTabs, fileId];
            return {
                ...prev,
                [targetGroup]: {
                    tabs: newTabs,
                    activeFile: fileId
                }
            };
        });
        
        // Update recently opened
        setRecentFiles(prev => {
            const filtered = prev.filter(f => f !== fileId);
            return [fileId, ...filtered].slice(0, 10);
        });
    }, [activeGroup]);

    return (
        <EditorContext.Provider
            value={{
                editorGroups,
                activeGroup,
                isSplitView,
                files,
                unsavedFiles,
                recentFiles,
                cursorPosition,
                lineToReveal,
                setActiveFile,
                setTabs,
                setIsSplitView,
                setFiles,
                setUnsavedFiles,
                setCursorPosition,
                setLineToReveal,
                setActiveGroup,
                openFile
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
