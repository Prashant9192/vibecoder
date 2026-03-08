import MonacoEditor from "@/features/editor/components/MonacoEditor";

export default function EditorArea() {
  return (
    <div className="flex-1 bg-[#0B0B0C] flex items-center justify-center">
      <MonacoEditor />
    </div>
  );
}