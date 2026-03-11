"use client";

import ActivityBar from "./ActivityBar";
import Explorer from "./Explorer";
import EditorArea from "./EditorArea";
import ChatPanel from "./ChatPanel";
import { CommandPalette } from "@/features/command/components/CommandPalette";
import { EditorProvider } from "@/features/editor/context/EditorContext";
import { FileSystemProvider } from "@/features/filesystem/context/FileSystemContext";
import { ThemeProvider } from "@/features/theme/context/ThemeContext";

export default function WorkspaceLayout() {
  return (
    <ThemeProvider>
      <FileSystemProvider>
        <EditorProvider>
          <div className="flex h-screen overflow-hidden text-black dark:text-white bg-white dark:bg-zinc-900">
            <ActivityBar />
            <Explorer />
            <EditorArea />
            <ChatPanel />
            <CommandPalette />
          </div>
        </EditorProvider>
      </FileSystemProvider>
    </ThemeProvider>
  );
}