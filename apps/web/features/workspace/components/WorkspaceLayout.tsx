import ActivityBar from "./ActivityBar";
import Explorer from "./Explorer";
import EditorArea from "./EditorArea";
import ChatPanel from "./ChatPanel";
import { EditorProvider } from "@/features/editor/context/EditorContext";

export default function WorkspaceLayout() {
  return (
    <EditorProvider>
      <div className="flex h-screen text-[#E5E5E5] bg-[#000000]">
        <ActivityBar />
        <Explorer />
        <EditorArea />
        <ChatPanel />
      </div>
    </EditorProvider>
  );
}