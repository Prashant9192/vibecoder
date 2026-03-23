import dynamic from "next/dynamic";

const WorkspaceLayout = dynamic(() => import("@/features/workspace/components/WorkspaceLayout"), {
  ssr: false,
});

export default function WorkspacePage() {
  return <WorkspaceLayout />;
}