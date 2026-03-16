"use client";

import Editor, { useMonaco, Monaco } from "@monaco-editor/react";
import { useEditor } from "../context/EditorContext";
import { useTheme } from "@/features/theme/context/ThemeContext";
import { useFileSystemContext } from "@/features/filesystem/context/FileSystemContext";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { ideLog } from "@/lib/ideLogger";

const MonacoEditor = memo(function MonacoEditor({ fileId }: { fileId?: string | null } = {}) {
    const { files, setFiles, unsavedFiles, setUnsavedFiles, setCursorPosition, lineToReveal, setLineToReveal } = useEditor();
    const targetFile = fileId ?? null;
    const { theme } = useTheme();
    const { saveFileById, getNodeById } = useFileSystemContext();
    const monaco = useMonaco();
    const editorRef = useRef<any>(null);

    const fsNode = useMemo(() => (targetFile ? getNodeById(targetFile) : undefined), [getNodeById, targetFile]);
    const activePath = fsNode?.type === "file" ? fsNode.path : null;

    const getUri = useCallback((path: string) => {
        // Create a stable URI per file path.
        return monaco?.Uri.parse(`file://${path}`) ?? null;
    }, [monaco]);

    const ensureModel = useCallback((path: string, initialValue: string) => {
        if (!monaco) return null;
        const uri = monaco.Uri.parse(`file://${path}`);
        let model = monaco.editor.getModel(uri);
        if (!model) {
            model = monaco.editor.createModel(initialValue, "typescript", uri);
        }
        return model;
    }, [monaco]);

    const handleSave = useCallback(() => {
        if (!targetFile) return;
        const currentContent = editorRef.current?.getValue?.() ?? files[targetFile] ?? "";
        saveFileById(targetFile, currentContent);
        setUnsavedFiles(unsavedFiles.filter((f) => f !== targetFile));
        ideLog("FILE_SAVE", { fileId: targetFile });
    }, [files, saveFileById, setUnsavedFiles, targetFile, unsavedFiles]);

    const handleMount = useCallback((editor: any, monacoInstance: Monaco) => {
        editorRef.current = editor;
        
        // Listen to cursor position changes
        editor.onDidChangeCursorPosition((e: any) => {
            setCursorPosition({
                lineNumber: e.position.lineNumber,
                column: e.position.column
            });
        });

        // Initialize state on first mount
        const initialPos = editor.getPosition();
        if (initialPos) {
            setCursorPosition({
                lineNumber: initialPos.lineNumber,
                column: initialPos.column
            });
        }
        
        editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
        });

        editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyF, () => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', shiftKey: true, ctrlKey: true }));
        });
    }, [setCursorPosition]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                handleSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    // Prevent Monaco re-initialization: keep one editor instance and swap models.
    useEffect(() => {
        if (!targetFile || !activePath || !monaco || !editorRef.current) return;

        const initialValue = files[targetFile] ?? (fsNode?.type === "file" ? fsNode.content ?? "" : "");

        // Ensure our editor state has an entry for this fileId.
        if (files[targetFile] === undefined) {
            setFiles({ ...files, [targetFile]: initialValue });
        }

        const model = ensureModel(activePath, initialValue);
        if (!model) return;

        const editor = editorRef.current;
        if (editor.getModel?.() !== model) {
            editor.setModel(model);
        }
    }, [activePath, ensureModel, files, fsNode, monaco, setFiles, targetFile]);

    useEffect(() => {
        if (lineToReveal !== null && editorRef.current) {
            editorRef.current.revealLineInCenter(lineToReveal);
            editorRef.current.setPosition({ lineNumber: lineToReveal, column: 1 });
            // Clean up immediately so we don't accidentally re-trigger
            setLineToReveal(null);
            
            // Focus the editor
            editorRef.current.focus();
        }
    }, [lineToReveal, setLineToReveal]);

    if (!targetFile) return null;
    if (!fsNode || fsNode.type !== "file") return null;

    return (
        <div className="h-full w-full">
            <Editor
                height="100%"
                language="typescript"
                theme={theme === "dark" ? "vs-dark" : "vs-light"}
                onMount={handleMount}
                defaultValue=""
                onChange={(value) => {
                    const nextValue = value || "";
                    if (files[targetFile] !== nextValue) {
                        setFiles({ ...files, [targetFile]: nextValue });
                    }
                    if (!unsavedFiles.includes(targetFile)) {
                        setUnsavedFiles([...unsavedFiles, targetFile]);
                    }
                }}
                options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    automaticLayout: true,
                }}
            />
        </div>
    );
});

export default MonacoEditor;