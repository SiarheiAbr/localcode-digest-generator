import { digestService } from "../lib/digestService";
import { ScanRequest } from "../types/types";

// Helper to create mock File objects
function createFile(name: string, content: string, path?: string): File {
  const file: any = new File([content], name, { type: "text/plain" });

  if (path) {
    file.webkitRelativePath = path;
  } else {
    file.webkitRelativePath = name;
  }

  return file;
}

describe("digestService", () => {
  it("should return empty results for no files", async () => {
    const request: ScanRequest = {
      files: [],
      maxSizeKb: 100,
      mode: "Exclude",
      patterns: [],
    };

    const result = await digestService(request);

    expect(result.fileCount).toBe(0);
    expect(result.lines).toEqual([]);
    expect(result.directoryStructure).toBeNull();
  });

  it("should count and read a single text file", async () => {
    const file = createFile("test.ts", "console.log('hello');", "root/test.ts");

    const request: ScanRequest = {
      files: [file],
      maxSizeKb: 100,
      mode: "Exclude",
      patterns: [],
    };

    const result = await digestService(request);

    expect(result.fileCount).toBe(1);
    expect(result.lines).toContain("console.log('hello');");
    expect(result.directoryStructure?.files).toEqual(["test.ts"]);
  });

  it("should skip binary file extensions", async () => {
    const file = createFile(
      "image.png",
      "not really an image",
      "root/image.png"
    );

    const request: ScanRequest = {
      files: [file],
      maxSizeKb: 100,
      mode: "Exclude",
      patterns: [],
    };

    const result = await digestService(request);

    expect(result.fileCount).toBe(0);
    expect(result.directoryStructure).toBeNull();
  });

  it("should skip file if too large", async () => {
    const largeContent = "x".repeat(200 * 1024); // 200 KB
    const file = createFile("big.ts", largeContent, "root/big.ts");

    const request: ScanRequest = {
      files: [file],
      maxSizeKb: 100, // max = 100 KB
      mode: "Exclude",
      patterns: [],
    };

    const result = await digestService(request);

    expect(result.fileCount).toBe(0);
    expect(result.directoryStructure).toBeNull();
  });

  it("should apply Exclude mode with matching pattern", async () => {
    const file1 = createFile("keep.ts", "keep", "root/keep.ts");
    const file2 = createFile("skip.ts", "skip", "root/skip.ts");

    const request: ScanRequest = {
      files: [file1, file2],
      maxSizeKb: 100,
      mode: "Exclude",
      patterns: ["skip.ts"],
    };

    const result = await digestService(request);

    expect(result.fileCount).toBe(1);
    expect(result.lines.join("\n")).toContain("keep");
    expect(result.lines.join("\n")).not.toContain("skip");
  });

  it("should apply Include mode with matching pattern", async () => {
    const file1 = createFile("keep.ts", "keep", "root/keep.ts");
    const file2 = createFile("skip.ts", "skip", "root/skip.ts");

    const request: ScanRequest = {
      files: [file1, file2],
      maxSizeKb: 100,
      mode: "Include",
      patterns: ["keep.ts"],
    };

    const result = await digestService(request);

    expect(result.fileCount).toBe(1);
    expect(result.lines.join("\n")).toContain("keep");
    expect(result.lines.join("\n")).not.toContain("skip");
  });

  it("should build nested directory structure", async () => {
    const file1 = createFile("a.ts", "file a", "root/src/a.ts");
    const file2 = createFile("b.ts", "file b", "root/src/sub/b.ts");

    const request: ScanRequest = {
      files: [file1, file2],
      maxSizeKb: 100,
      mode: "Exclude",
      patterns: [],
    };

    const result = await digestService(request);

    expect(result.fileCount).toBe(2);
    expect(result.directoryStructure?.name).toBe("root");
    expect(result.directoryStructure?.subfolders.length).toBeGreaterThan(0);
    expect(
      result.directoryStructure?.subfolders.find((f) => f.name === "src")
    ).toBeDefined();
  });
});
