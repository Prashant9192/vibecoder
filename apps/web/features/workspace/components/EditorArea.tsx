import MonacoEditor from "@/features/editor/components/MonacoEditor";
import EditorTabs from "@/features/editor/components/EditorTabs";

export default function EditorArea() {
  return (
    <div className="flex flex-col flex-1 min-w-0 bg-white dark:bg-zinc-950">
      <EditorTabs />
      <div className="flex-1 overflow-hidden">
        <MonacoEditor />
      </div>
    </div>
  );
}