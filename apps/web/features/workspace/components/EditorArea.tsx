import MonacoEditor from "@/features/editor/components/MonacoEditor";
import EditorTabs from "@/features/editor/components/EditorTabs";

export default function EditorArea() {
  return (
    <div className="flex-1 bg-[#0F0F0F] flex flex-col">
      <EditorTabs />
      <div className="flex-1 w-full h-full">
        <MonacoEditor />
      </div>
    </div>
  );
}