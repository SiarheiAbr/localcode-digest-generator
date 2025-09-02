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

export async function digestService(
  request: ScanRequest
): Promise<DigestResult> {
  let fileCount = 0;
  const lines: string[] = [];

  const rootName = getRootFolder(request.files);

  const { fileRegexes, dirRegexes } = preparePatternRegexes(request.patterns);

  const directoryStructure = await buildDirectoryNode(
    rootName,
    request.files,
    request,
    lines,
    () => {
      fileCount++;
    },
    fileRegexes,
    dirRegexes
  );

  return { fileCount, lines, directoryStructure, tokenCount: 0 };
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
  incrementFileCount: () => void,
  fileRegexes: RegExp[],
  dirRegexes: RegExp[]
): Promise<DirectoryNode> {
  const dirFiles: string[] = [];
  const subfolders: DirectoryNode[] = [];

  const grouped: Record<string, File[]> = {};
  for (const f of files) {
    const relPath = (f as any).webkitRelativePath || f.name;
    const parts = relPath.split("/");

    if (parts[0] === dirName && parts.length === 2) {
      // file in root
      if (isTextFile(f.name) && f.size <= request.maxSizeKb * 1024) {
        if (!matchesPattern(relPath, request.mode, fileRegexes, dirRegexes)) {
          continue;
        }
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
      incrementFileCount,
      fileRegexes,
      dirRegexes
    );

    if (!subNode) continue;

    const subPath = `${dirName}/${sub}`;
    const matchesDir = dirRegexes.some((rx) => rx.test(subPath));

    if (request.mode === "Exclude" && matchesDir) {
      continue; // skip whole folder
    }

    if (request.mode === "Include") {
      const hasContent =
        subNode.files.length > 0 || subNode.subfolders.length > 0;
      if (matchesDir || hasContent) {
        subfolders.push(subNode);
      }
    } else {
      // Exclude mode: keep if not empty
      if (subNode.files.length > 0 || subNode.subfolders.length > 0) {
        subfolders.push(subNode);
      }
    }
  }

  if (dirFiles.length === 0 && subfolders.length === 0) {
    return null as any;
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

function preparePatternRegexes(patterns?: string[]): {
  fileRegexes: RegExp[];
  dirRegexes: RegExp[];
} {
  const fileRegexes: RegExp[] = [];
  const dirRegexes: RegExp[] = [];

  if (!patterns) return { fileRegexes, dirRegexes };

  for (const pattern of patterns) {
    if (pattern.includes("*") || pattern.includes("?")) {
      fileRegexes.push(new RegExp(wildcardToRegex(pattern), "i"));
    } else {
      const dirPattern = pattern.replace(/\\/g, "/").replace(/\/$/, "");
      dirRegexes.push(new RegExp(`(^|/)${dirPattern}(/|$)`, "i"));
    }
  }

  return { fileRegexes, dirRegexes };
}

function wildcardToRegex(pattern: string): string {
  return (
    "^" +
    pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".") +
    "$"
  );
}

function matchesPattern(
  relPath: string,
  mode: "Exclude" | "Include",
  fileRegexes: RegExp[],
  dirRegexes: RegExp[]
): boolean {
  const fileName = relPath.split("/").pop() || relPath;
  const matchesFile = fileRegexes.some((rx) => rx.test(fileName));
  const matchesDir = dirRegexes.some((rx) => rx.test(relPath));
  const matches = matchesFile || matchesDir;

  if (mode === "Exclude" && matches) return false; // exclude matching
  if (mode === "Include" && !matches) return false; // include only matching
  return true;
}
