import { DirectoryNode } from "@/types/types";

const renderDirectoryTree = (root: DirectoryNode | null): string => {
  if (!root) return "Directory structure:\n(no files matched)";
  const lines: string[] = [];
  lines.push("Directory structure:");
  lines.push(`└── ${root.name}/`);

  const renderNode = (node: DirectoryNode, prefix: string) => {
    // files (first)
    const files = [...node.files].sort();
    const folders = [...node.subfolders].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const total = files.length + folders.length;
    const items: Array<{
      type: "file" | "dir";
      name: string;
      node?: DirectoryNode;
    }> = [
      ...files.map((f) => ({ type: "file" as const, name: f })),
      ...folders.map((d) => ({
        type: "dir" as const,
        name: d.name,
        node: d,
      })),
    ];

    items.forEach((item, idx) => {
      const isLast = idx === total - 1;
      const branch = isLast ? "└──" : "├──";
      if (item.type === "file") {
        lines.push(`${prefix}${branch} ${item.name}`);
      } else {
        lines.push(`${prefix}${branch} ${item.name}/`);
        const nextPrefix = prefix + (isLast ? "    " : "│   ");
        renderNode(item.node!, nextPrefix);
      }
    });
  };

  renderNode(root, "    ");
  return lines.join("\n");
};

export default renderDirectoryTree;
