export default function ActivityBar() {
  return (
    <div className="w-12 bg-[#050505] border-r border-[#1F1F1F] flex flex-col items-center py-4 gap-6 text-[#888888]">
      <span className="cursor-pointer hover:text-[#E5E5E5] transition-colors">📁</span>
      <span className="cursor-pointer hover:text-[#E5E5E5] transition-colors">💬</span>
      <span className="cursor-pointer hover:text-[#E5E5E5] transition-colors">⚙️</span>
    </div>
  );
}