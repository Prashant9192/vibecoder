const fs = require('fs');
const path = require('path');

// Tailwind mappings
const replacements = [
  // App Backgrounds
  { from: /bg-\[\#000000\]/g, to: "bg-[#FFFFFF] dark:bg-[#000000]" },
  { from: /bg-\[\#0A0A0A\]/g, to: "bg-[#F3F3F3] dark:bg-[#0A0A0A]" },
  { from: /bg-\[\#050505\]/g, to: "bg-[#2C2C2C] dark:bg-[#050505]" }, // Activity Bar (always darkish or slightly different? Actually VS code light activity bar is #2C2C2C). Let's use #2C2C2C.

  // Hover Backgrounds
  { from: /bg-\[\#1A1A1A\]/g, to: "bg-[#E8E8E8] dark:bg-[#1A1A1A]" },
  { from: /hover:bg-\[\#1A1A1A\]/g, to: "hover:bg-[#E8E8E8] dark:hover:bg-[#1A1A1A]" },
  { from: /hover:bg-\[\#2A2A2A\]/g, to: "hover:bg-[#D4D4D4] dark:hover:bg-[#2A2A2A]" },
  { from: /hover:bg-\[\#1F1F1F\]/g, to: "hover:bg-[#D4D4D4] dark:hover:bg-[#1F1F1F]" },
  { from: /group-hover:bg-\[\#1F1F1F\]/g, to: "group-hover:bg-[#D4D4D4] dark:group-hover:bg-[#1F1F1F]" },
  { from: /hover:bg-\[\#0A0A0A\]/g, to: "hover:bg-[#F3F3F3] dark:hover:bg-[#0A0A0A]" },

  // Borders
  { from: /border-\[\#1F1F1F\]/g, to: "border-[#E5E5E5] dark:border-[#1F1F1F]" },
  { from: /border-\[\#2A2A2A\]/g, to: "border-[#D4D4D4] dark:border-[#2A2A2A]" },
  { from: /border-\[\#FF0000\]/g, to: "border-[#FF0000] dark:border-[#FF0000]" },
  { from: /border-\[\#007FD4\]/g, to: "border-[#007FD4] dark:border-[#007FD4]" },
  { from: /border-l-2 border-\[\#E5E5E5\]/g, to: "border-l-2 border-[#FFFFFF] dark:border-[#E5E5E5]" }, // Activity bar indicator

  // Text Colors
  { from: /text-\[\#E5E5E5\]/g, to: "text-[#242424] dark:text-[#E5E5E5]" },
  { from: /text-\[\#888888\]/g, to: "text-[#666666] dark:text-[#888888]" },
  { from: /hover:!text-\[\#E5E5E5\]/g, to: "hover:!text-[#242424] dark:hover:!text-[#E5E5E5]" },
  { from: /hover:text-\[\#E5E5E5\]/g, to: "hover:text-[#242424] dark:hover:text-[#E5E5E5]" },
  { from: /group-hover:text-\[\#888888\]/g, to: "group-hover:text-[#666666] dark:group-hover:text-[#888888]" },
];

const filesToUpdate = [
  'features/workspace/components/ActivityBar.tsx',
  'features/workspace/components/Explorer.tsx',
  'features/workspace/components/ChatPanel.tsx',
  'features/editor/components/EditorTabs.tsx',
  'features/workspace/components/WorkspaceLayout.tsx'
];

for (const relPath of filesToUpdate) {
  const fullPath = path.join(__dirname, relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Custom Activity Bar Overrides (VS code has dark activity bar even in light mode, but with white icons)
    if (relPath.includes('ActivityBar.tsx')) {
        content = content.replace(/text-\[\#E5E5E5\]/g, "text-[#FFFFFF] dark:text-[#E5E5E5]");
        content = content.replace(/text-\[\#888888\]/g, "text-[#CCCCCC] dark:text-[#888888]");
        content = content.replace(/hover:text-\[\#E5E5E5\]/g, "hover:text-[#FFFFFF] dark:hover:text-[#E5E5E5]");
        // prevent dual replacement
    }

    // Apply generic replacements
    for (const { from, to } of replacements) {
      // skip Activity bar generic text replaces to avoid messing up the custom override above
      if (relPath.includes('ActivityBar.tsx') && from.toString().includes('text')) continue;
      content = content.replace(from, to);
    }
    
    fs.writeFileSync(fullPath, content);
  }
}
console.log("Tailwind Dark Classes applied!");
