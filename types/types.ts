export interface ScanRequest {
  files: File[];
  patterns?: string[];
  maxSizeKb: number;
  mode: "Exclude" | "Include";
}

export interface DirectoryNode {
  name: string;
  files: string[];
  subfolders: DirectoryNode[];
}

export interface DigestResult {
  fileCount: number;
  lines: string[];
  directoryStructure: DirectoryNode;
}
