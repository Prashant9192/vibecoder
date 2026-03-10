"use client";

import Editor, { useMonaco, Monaco } from "@monaco-editor/react";
import { useEditor } from "../context/EditorContext";
import { useFileSystemContext } from "@/features/filesystem/context/FileSystemContext";
import { useEffect, useRef } from "react";

export default function MonacoEditor() {
    const { activeFile, files, setFiles, unsavedFiles, setUnsavedFiles, editorTheme } = useEditor();
    const { saveFile } = useFileSystemContext();
    const monaco = useMonaco();
    const editorRef = useRef<any>(null);

    const handleSave = () => {
        if (!activeFile) return;
        const currentContent = files[activeFile] || "";
        saveFile(activeFile, currentContent);
        setUnsavedFiles(unsavedFiles.filter(f => f !== activeFile));
    };

    const handleMount = (editor: any, monaco: Monaco) => {
        editorRef.current = editor;
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            // Need to use the latest state, so we trigger a custom event or use ref trick? 
            // Monaco commands get captured. We can instead register global window listener if this is stale. 
            // But let's let Monaco capture the keydown and we'll dispatch a custom event.
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
        });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                handleSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeFile, files, unsavedFiles]); // dependencies so handleSave gets fresh state

    if (!activeFile) return null;

    return (
        <div className="h-full w-full">
            <Editor
                height="100%"
                language="typescript"
                theme={editorTheme}
                value={files[activeFile] || ""}
                onMount={handleMount}
                onChange={(value) => {
                    setFiles({
                        ...files,
                        [activeFile]: value || ""
                    });
                    if (!unsavedFiles.includes(activeFile)) {
                        setUnsavedFiles([...unsavedFiles, activeFile]);
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
}