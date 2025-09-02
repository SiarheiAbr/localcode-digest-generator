export interface ScanRequest {
  files: File[];
  maxSizeKb: number;
  mode: "Exclude" | "Include";
  patterns?: string[];
}

export interface DirectoryNode {
  name: string;
  files: string[];
  subfolders: DirectoryNode[];
}

export interface DigestResult {
  fileCount: number;
  lines: string[];
  directoryStructure: DirectoryNode | null;
  tokenCount: number;
}
