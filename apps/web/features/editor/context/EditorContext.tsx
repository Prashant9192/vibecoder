"use client";

import React, { createContext, useContext, useState, useCallback, useReducer } from "react";
import { ideLog } from "@/lib/ideLogger";
import { editorReducer, initialEditorLayoutState, EditorGroupsState, EditorLayoutState } from "@/features/editor/state/editorReducer";
import { ideEventBus } from "@/lib/ideEventBus";
import { storage } from "@/lib/storage";

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
    setFiles: (files: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
    setUnsavedFiles: (files: string[] | ((prev: string[]) => string[])) => void;
    setCursorPosition: (pos: { lineNumber: number, column: number } | null) => void;
    setLineToReveal: (line: number | null) => void;
    setActiveGroup: (group: "left" | "right") => void;
    deletePath: (path: string, ids: string[]) => void;
    closeTab: (fileId: string, group: "left" | "right") => void;
    // Helper to gracefully open a file
    openFile: (file: string, group?: "left" | "right") => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
    const [editorState, dispatch] = useReducer(
        editorReducer,
        storage.get<EditorLayoutState>("editor_layout", initialEditorLayoutState)
    );

    const { editorGroups, activeGroup, isSplitView } = editorState;

    // Editor buffers and unsaved flags are keyed by stable fileId (not path)
    const [files, setFilesInternal] = useState<Record<string, string>>({});
    const [unsavedFiles, setUnsavedFilesInternal] = useState<string[]>([]);
    const [recentFiles, setRecentFilesInternal] = useState<string[]>([]);
    const [cursorPosition, setCursorPosition] = useState<{ lineNumber: number, column: number } | null>(null);
    const [lineToReveal, setLineToReveal] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setFilesInternal(storage.get("editor_buffers", {}));
        setUnsavedFilesInternal(storage.get("unsaved_files", []));
        setRecentFilesInternal(storage.get("recent_files", []));
        setMounted(true);
    }, []);

    const setFiles = useCallback((nextFiles: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
        setFilesInternal(prev => {
            const next = typeof nextFiles === 'function' ? nextFiles(prev) : nextFiles;
            storage.set("editor_buffers", next);
            return next;
        });
    }, []);

    const setUnsavedFiles = useCallback((nextUnsaved: string[] | ((prev: string[]) => string[])) => {
        setUnsavedFilesInternal(prev => {
            const next = typeof nextUnsaved === 'function' ? nextUnsaved(prev) : nextUnsaved;
            storage.set("unsaved_files", next);
            return next;
        });
    }, []);

    const setRecentFiles = useCallback((nextRecent: string[] | ((prev: string[]) => string[])) => {
        setRecentFilesInternal(prev => {
            const next = typeof nextRecent === 'function' ? nextRecent(prev) : nextRecent;
            storage.set("recent_files", next);
            return next;
        });
    }, []);

    const syncLayout = (nextState: EditorLayoutState) => {
        storage.set("editor_layout", nextState);
    };

    const setActiveFile = useCallback(
        (fileId: string | null, group?: "left" | "right") => {
            const targetGroup = group || activeGroup;

            const nextLayout = editorReducer(editorState, {
                type: "SET_ACTIVE_FILE",
                payload: { fileId, group: targetGroup },
            });
            dispatch({ type: "SET_ACTIVE_FILE", payload: { fileId, group: targetGroup } });
            syncLayout(nextLayout);

            if (fileId) {
                const nextRecent = [fileId, ...recentFiles.filter(f => f !== fileId)].slice(0, 10);
                setRecentFiles(nextRecent);
                
                ideLog("TAB_SWITCH", { fileId, group: targetGroup });
                ideEventBus.emit("TAB_SWITCH", { fileId, group: targetGroup });
            }
        },
        [activeGroup, editorState, recentFiles, setRecentFiles]
    );

    const setTabs = useCallback((tabs: string[], group: "left" | "right") => {
        const nextLayout = editorReducer(editorState, {
            type: "SET_TABS",
            payload: { tabs, group },
        });
        dispatch({ type: "SET_TABS", payload: { tabs, group } });
        syncLayout(nextLayout);
    }, [editorState]);

    const setActiveGroup = useCallback((group: "left" | "right") => {
        const nextLayout = editorReducer(editorState, {
            type: "SET_ACTIVE_GROUP",
            payload: { group },
        });
        dispatch({ type: "SET_ACTIVE_GROUP", payload: { group } });
        syncLayout(nextLayout);
        
        ideEventBus.emit("EDITOR_FOCUS", { group });
    }, [editorState]);

    const setIsSplitView = useCallback((split: boolean) => {
        const nextLayout = editorReducer(editorState, {
            type: "SPLIT_EDITOR",
            payload: { isSplitView: split },
        });
        dispatch({ type: "SPLIT_EDITOR", payload: { isSplitView: split } });
        syncLayout(nextLayout);
        
        ideEventBus.emit("EDITOR_SPLIT", { isSplitView: split });
    }, [editorState]);

    const closeTab = useCallback(
        (fileId: string, group: "left" | "right") => {
            const nextLayout = editorReducer(editorState, {
                type: "CLOSE_TAB",
                payload: { fileId, group },
            });
            dispatch({ type: "CLOSE_TAB", payload: { fileId, group } });
            syncLayout(nextLayout);
            ideLog("TAB_CLOSE", { fileId, group });
        },
        [editorState]
    );

    const openFile = useCallback(
        (fileId: string, group?: "left" | "right") => {
            const targetGroup = group || activeGroup;

            const nextLayout = editorReducer(editorState, {
                type: "OPEN_FILE",
                payload: { fileId, group: targetGroup },
            });
            dispatch({ type: "OPEN_FILE", payload: { fileId, group: targetGroup } });
            syncLayout(nextLayout);

            const nextRecent = [fileId, ...recentFiles.filter(f => f !== fileId)].slice(0, 10);
            setRecentFiles(nextRecent);

            ideLog("FILE_OPEN", { fileId, group: targetGroup });
            ideEventBus.emit("FILE_OPEN", { fileId, group: targetGroup });
        },
        [activeGroup, editorState, recentFiles, setRecentFiles]
    );

    const deletePath = useCallback(
        (path: string, ids: string[]) => {
            const nextLayout = editorReducer(editorState, {
                type: "DELETE_PATH",
                payload: { path, ids },
            });
            dispatch({ type: "DELETE_PATH", payload: { path, ids } });
            syncLayout(nextLayout);

            // Clean up internal buffers and lists that match the IDs
            const nextFiles = { ...files };
            let changed = false;
            ids.forEach((id) => {
                if (nextFiles[id]) {
                    delete nextFiles[id];
                    changed = true;
                }
            });
            if (changed) setFiles(nextFiles);

            const nextUnsaved = unsavedFiles.filter(
                (id) => !ids.includes(id)
            );
            if (nextUnsaved.length !== unsavedFiles.length) setUnsavedFiles(nextUnsaved);

            const nextRecent = recentFiles.filter(
                (id) => !ids.includes(id)
            );
            if (nextRecent.length !== recentFiles.length) setRecentFiles(nextRecent);

            ideLog("PATH_DELETE", { path, ids });
        },
        [editorState, files, recentFiles, setFiles, setRecentFiles, setUnsavedFiles, unsavedFiles]
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
                deletePath,
                closeTab,
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
