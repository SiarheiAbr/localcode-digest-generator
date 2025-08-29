import { ScanRequest, DigestResult, DirectoryNode } from "../types/types";

const textFileExtensions = [
  ".cs",
  ".ts",
  ".js",
  ".css",
  ".json",
  ".md",
  ".txt",
  ".html",
  ".xml",
  ".yml",
  ".yaml",
  ".c",
  ".cpp",
  ".cc",
  ".cxx",
  ".h",
  ".hpp",
  ".hxx",
  ".java",
  ".kt",
  ".swift",
  ".go",
  ".rs",
  ".rb",
  ".py",
  ".php",
  ".m",
  ".mm",
  ".dart",
  ".sh",
  ".bat",
  ".cmd",
  ".ps1",
  ".r",
  ".scala",
  ".pl",
  ".pm",
  ".lua",
  ".xhtml",
  ".jsp",
  ".asp",
  ".aspx",
  ".svg",
  ".tsx",
  ".jsx",
  ".env",
  ".ini",
  ".toml",
  ".cfg",
  ".conf",
  ".log",
  ".properties",
  ".gradle",
  ".gitignore",
  ".dockerfile",
  "Dockerfile",
  ".makefile",
  "Makefile",
  ".cmake",
  ".sql",
  ".groovy",
  ".erl",
  ".csproj",
  ".vbproj",
  ".sln",
  ".tsconfig",
  ".jsconfig",
];

export async function digest(request: ScanRequest): Promise<DigestResult> {
  let fileCount = 0;
  const lines: string[] = [];
  const rootName = getRootFolder(request.files);
  const directoryStructure = await buildDirectoryNode(
    rootName,
    request.files,
    request,
    lines,
    () => {
      fileCount++;
    }
  );

  return { fileCount, lines, directoryStructure };
}

function getRootFolder(files: File[]): string {
  if (files.length === 0) return "";
  const path = (files[0] as any).webkitRelativePath || files[0].name;
  return path.split("/")[0];
}

async function buildDirectoryNode(
  dirName: string,
  files: File[],
  request: ScanRequest,
  lines: string[],
  incrementFileCount: () => void
): Promise<DirectoryNode> {
  const dirFiles: string[] = [];
  const subfolders: DirectoryNode[] = [];

  const grouped: Record<string, File[]> = {};
  for (const f of files) {
    const relPath = (f as any).webkitRelativePath || f.name;
    const parts = relPath.split("/");
    if (parts[0] === dirName && parts.length === 2) {
      // файл в корне папки
      if (isTextFile(f.name) && f.size <= request.maxSizeKb * 1024) {
        const content = await f.text();
        incrementFileCount();
        appendFileHeader(lines, relPath);
        lines.push(...content.split("\n"));
        lines.push("", "");
        dirFiles.push(parts[1]);
      }
    } else if (parts[0] === dirName && parts.length > 2) {
      const sub = parts[1];
      if (!grouped[sub]) grouped[sub] = [];
      grouped[sub].push(f);
    }
  }

  for (const sub of Object.keys(grouped)) {
    const subNode = await buildDirectoryNode(
      sub,
      grouped[sub],
      request,
      lines,
      incrementFileCount
    );
    if (subNode.files.length > 0 || subNode.subfolders.length > 0) {
      subfolders.push(subNode);
    }
  }

  return { name: dirName, files: dirFiles, subfolders };
}

function isTextFile(name: string): boolean {
  return textFileExtensions.some((ext) => name.toLowerCase().endsWith(ext));
}

function appendFileHeader(lines: string[], relPath: string) {
  lines.push("================================================");
  lines.push(`FILE: ${relPath}`);
  lines.push("================================================");
}
