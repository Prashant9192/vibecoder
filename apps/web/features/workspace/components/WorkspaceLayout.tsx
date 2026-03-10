"use client";

import ActivityBar from "./ActivityBar";
import Explorer from "./Explorer";
import EditorArea from "./EditorArea";
import ChatPanel from "./ChatPanel";
import { EditorProvider, useEditor } from "@/features/editor/context/EditorContext";
import { FileSystemProvider } from "@/features/filesystem/context/FileSystemContext";

function WorkspaceContent() {
  const { editorTheme } = useEditor();
  return (
    <div className={`flex h-screen ${editorTheme === 'vs-dark' ? 'dark' : ''} text-[#242424] dark:text-[#E5E5E5] bg-[#FFFFFF] dark:bg-[#000000]`}>
      <ActivityBar />
      <Explorer />
      <EditorArea />
      <ChatPanel />
    </div>
  );
}

export default function WorkspaceLayout() {
  return (
    <FileSystemProvider>
      <EditorProvider>
        <WorkspaceContent />
      </EditorProvider>
    </FileSystemProvider>
  );
}