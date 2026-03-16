"use client";

import React, { createContext, useContext, useState, useCallback, useReducer } from "react";
import { ideLog } from "@/lib/ideLogger";
import { editorReducer, initialEditorLayoutState, EditorGroupsState } from "@/features/editor/state/editorReducer";
import { ideEventBus } from "@/lib/ideEventBus";

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
    const [{ editorGroups, activeGroup, isSplitView }, dispatch] = useReducer(
        editorReducer,
        initialEditorLayoutState
    );

    // Editor buffers and unsaved flags are keyed by stable fileId (not path)
    const [files, setFiles] = useState<Record<string, string>>({});
    const [unsavedFiles, setUnsavedFiles] = useState<string[]>([]);
    const [recentFiles, setRecentFiles] = useState<string[]>([]);
    const [cursorPosition, setCursorPosition] = useState<{ lineNumber: number, column: number } | null>(null);
    const [lineToReveal, setLineToReveal] = useState<number | null>(null);

    const setActiveFile = useCallback(
        (fileId: string | null, group?: "left" | "right") => {
            const targetGroup = group || activeGroup;

            dispatch({
                type: "SET_ACTIVE_FILE",
                payload: { fileId, group: targetGroup },
            });

            if (fileId) {
                setRecentFiles(prev => {
                    const filtered = prev.filter(f => f !== fileId);
                    return [fileId, ...filtered].slice(0, 10);
                });
                ideLog("TAB_SWITCH", { fileId, group: targetGroup });
                ideEventBus.emit("TAB_SWITCH", { fileId, group: targetGroup });
            }
        },
        [activeGroup]
    );

    const setTabs = useCallback((tabs: string[], group: "left" | "right") => {
        dispatch({
            type: "SET_TABS",
            payload: { tabs, group },
        });
    }, []);

    const setActiveGroup = useCallback((group: "left" | "right") => {
        dispatch({
            type: "SET_ACTIVE_GROUP",
            payload: { group },
        });
        ideEventBus.emit("EDITOR_FOCUS", { group });
    }, []);

    const setIsSplitView = useCallback((split: boolean) => {
        dispatch({
            type: "SPLIT_EDITOR",
            payload: { isSplitView: split },
        });
        ideEventBus.emit("EDITOR_SPLIT", { isSplitView: split });
    }, []);

    const openFile = useCallback(
        (fileId: string, group?: "left" | "right") => {
            const targetGroup = group || activeGroup;

            dispatch({
                type: "OPEN_FILE",
                payload: { fileId, group: targetGroup },
            });

            setRecentFiles(prev => {
                const filtered = prev.filter(f => f !== fileId);
                return [fileId, ...filtered].slice(0, 10);
            });

            ideLog("FILE_OPEN", { fileId, group: targetGroup });
            ideEventBus.emit("FILE_OPEN", { fileId, group: targetGroup });
        },
        [activeGroup]
    );

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
