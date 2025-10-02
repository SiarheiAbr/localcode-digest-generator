"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { digestService } from "@/lib/digestService";
import { tokenizerService } from "@/lib/tokenizerService";
import type { ScanRequest, DigestResult, DirectoryNode } from "@/types/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  getFileSizeFromSlider,
  formatFileSize,
  formatTokenCount,
} from "@/utils/fileSize";
import renderDirectoryTree from "@/utils/renderDirectoryTree";

export default function FolderSelector() {
  const [selectedFolder, setSelectedFolder] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filterMode, setFilterMode] = useState<"Exclude" | "Include">(
    "Exclude"
  );
  const [filterPattern, setFilterPattern] = useState("");
  const [sliderValue, setSliderValue] = useState(50);
  const [digestResult, setDigestResult] = useState<DigestResult | null>(null);
  const [copiedDirectory, setCopiedDirectory] = useState(false);
  const [copiedFiles, setCopiedFiles] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);

  const currentFileSize = getFileSizeFromSlider(sliderValue);

  // --- handlers ---
  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const arr = Array.from(files);
      setSelectedFiles(arr);

      // Root folder name from webkitRelativePath
      const firstFile = arr[0] as any;
      const folderPath: string = firstFile.webkitRelativePath || arr[0].name;
      const rootFolder = folderPath.split("/")[0];
      setSelectedFolder(rootFolder);
      setDigestResult(null);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleCopyDirectory = () => {
    const text = renderDirectoryTree(digestResult?.directoryStructure ?? null);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedDirectory(true);
      setTimeout(() => setCopiedDirectory(false), 2000);
    });
  };

  const handleCopyFilesContent = () => {
    const text = (digestResult?.lines ?? []).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedFiles(true);
      setTimeout(() => setCopiedFiles(false), 2000);
    });
  };

  const handleDownloadFilesContent = () => {
    const text = (digestResult?.lines ?? []).join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedFolder || "files"}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const parsePatterns = (raw: string): string[] | undefined => {
    const parts = raw
      .split(/[,\n\r]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length ? parts : undefined;
  };

  const handleIngest = async () => {
    if (!selectedFiles.length) {
      return;
    }

    const request: ScanRequest = {
      files: selectedFiles,
      maxSizeKb: currentFileSize,
      mode: filterMode,
      patterns: parsePatterns(filterPattern),
    };

    const baseDigest = await digestService(request);

    const allText = baseDigest.lines.join("\n");
    const tokens = tokenizerService.countTokens(allText);
    const withTokens: DigestResult = { ...baseDigest, tokenCount: tokens };

    setDigestResult(withTokens);

    // Scroll to summary panel
    setTimeout(() => {
      summaryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);
  };

  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("webkitdirectory", "");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4">
      <Header />

      <div className="w-[55%] space-y-6 flex-1 pt-20">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Prompt-friendly Local Codebase
          </h1>
          <p className="text-muted-foreground">
            Turn any local codebase into a simple text digest of its code. This
            is useful for feeding a codebase into any LLM.
          </p>
        </div>

        <div className="space-y-4 border border-input rounded-md bg-background p-4">
          <div className="flex items-center justify-between gap-6">
            <label className="text-sm text-foreground">
              Click the <i>Browse</i> button to select the folder containing
              your codebase. If a prompt appears, confirm your selection by
              clicking <i>Upload</i>. Finally, proceed by clicking the{" "}
              <i>Ingest</i> button.
            </label>
            <Button
              onClick={handleBrowseClick}
              variant="outline"
              className="px-4 bg-transparent button-browse"
              role="button"
            >
              Browse
            </Button>
          </div>
          {selectedFolder && (
            <p
              className="text-sm text-muted-foreground"
              aria-live="polite"
              role="status"
            >
              Selected folder:{" "}
              <span className="font-medium text-foreground">
                {selectedFolder}
              </span>
            </p>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Filter Options
              </label>
              <div className="flex w-[28rem]">
                <select
                  value={filterMode}
                  onChange={(e) =>
                    setFilterMode(e.target.value as "Exclude" | "Include")
                  }
                  className="w-40 px-3 py-2 bg-background border border-input rounded-l-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring border-r-0"
                >
                  <option value="Exclude">Exclude</option>
                  <option value="Include">Include</option>
                </select>
                <input
                  type="text"
                  value={filterPattern}
                  onChange={(e) => setFilterPattern(e.target.value)}
                  placeholder="*md, src/"
                  className="flex-1 px-3 py-2 bg-background border border-input rounded-r-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <label className="block text-sm font-medium text-foreground">
                Include files under: {formatFileSize(currentFileSize)}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-[28rem] h-2 bg-muted rounded-lg appearance-none cursor-pointer slider m-0"
              />
            </div>

            <div className="flex justify-center">
              <Button
                className="w-fit px-8 button-ingest"
                role="button"
                onClick={handleIngest}
                disabled={!selectedFiles.length}
              >
                Ingest
              </Button>
            </div>
          </div>
        </div>

        {selectedFolder && digestResult && (
          <div
            ref={summaryRef}
            className="border border-input rounded-md bg-background p-4 space-y-3"
          >
            {/* SUMMARY + DIRECTORY */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <h2 className="font-medium text-foreground">Summary</h2>
                <div className="border border-input rounded-md bg-background p-3">
                  <p className="text-sm text-foreground">
                    Folder:{" "}
                    <span className="font-medium">{selectedFolder}</span>
                    <br />
                    Files processed:{" "}
                    <span className="font-medium">
                      {digestResult.fileCount}
                    </span>
                    <br />
                    Estimated tokens:{" "}
                    <span className="font-medium">
                      {formatTokenCount(digestResult.tokenCount)}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <h2 className="font-medium text-foreground">
                  Directory Structure
                </h2>
                <div className="border border-input rounded-md bg-background p-3">
                  <pre className="text-xs whitespace-pre mt-2 max-h-96 overflow-auto">
                    {renderDirectoryTree(digestResult.directoryStructure)}
                  </pre>
                </div>
                <div className="mt-2">
                  <Button
                    onClick={handleCopyDirectory}
                    variant="outline"
                    className="px-3 hover:cursor-pointer"
                    title="Copy to clipboard"
                  >
                    {copiedDirectory ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-medium text-foreground">Files Content</h2>
              <div className="border border-input rounded-md bg-background p-3">
                <pre className="text-xs whitespace-pre-wrap mt-2 max-h-96 overflow-auto">
                  {digestResult.lines.join("\n")}
                </pre>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Button
                  onClick={handleCopyFilesContent}
                  variant="outline"
                  className="px-3 hover:cursor-pointer"
                  title="Copy to clipboard"
                >
                  {copiedFiles ? "Copied!" : "Copy"}
                </Button>
                <Button
                  onClick={handleDownloadFilesContent}
                  variant="outline"
                  className="px-3 hover:cursor-pointer"
                  title="Download all content as a single file"
                >
                  Download
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input for folder selection */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFolderSelect}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      <Footer />
    </div>
  );
}
