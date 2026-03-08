import ActivityBar from "./ActivityBar";
import Explorer from "./Explorer";
import EditorArea from "./EditorArea";
import ChatPanel from "./ChatPanel";

export default function WorkspaceLayout() {
  return (
    <div className="flex h-screen text-white bg-[#0B0B0C]">
      <ActivityBar />
      <Explorer />
      <EditorArea />
      <ChatPanel />
    </div>
  );
}