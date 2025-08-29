"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function FolderSelector() {
  const [selectedFolder, setSelectedFolder] = useState("");
  const [fileList, setFileList] = useState<string[]>([]);
  const [folderList, setFolderList] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState("Exclude");
  const [filterPattern, setFilterPattern] = useState("");
  const [sliderValue, setSliderValue] = useState(50);
  const [basePath, setBasePath] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeToBackslashes = (path: string) => path.replaceAll("/", "\\");
  const ensureTrailingBackslash = (path: string) => (path.endsWith("\\") ? path : path + "\\");
  const getNormalizedBase = () => (basePath ? ensureTrailingBackslash(normalizeToBackslashes(basePath)) : "");

  const getFileSizeFromSlider = (value: number): number => {
    if (value <= 50) {
      // Linear scaling from 1kB to 50kB (left side)
      return Math.round(1 + (value / 50) * 49); // 1kB at 0, 50kB at 50
    } else {
      // Exponential scaling from 50kB to 100MB (right side)
      const rightProgress = (value - 50) / 50; // 0 to 1 for positions 50-100
      const exponentialValue = Math.pow(rightProgress, 1.5);
      const sizeInKb = 50 + exponentialValue * (100 * 1024 - 50); // 50kB to 100MB
      return Math.round(sizeInKb);
    }
  };

  const formatFileSize = (sizeInKb: number): string => {
    if (sizeInKb >= 1024) {
      const sizeInMb = Math.round(sizeInKb / 1024);
      return `${sizeInMb}MB`;
    }
    return `${sizeInKb}kB`;
  };

  const currentFileSize = getFileSizeFromSlider(sliderValue);

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Get the folder name from the first file's relative path
      const firstFile = files[0];
      const folderPath = firstFile.webkitRelativePath;
      const rootFolder = folderPath.split("/")[0];
      setSelectedFolder(rootFolder);

      // Collect all file paths
      const allFiles: string[] = [];
      const allFolders: Set<string> = new Set();

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        allFiles.push(f.webkitRelativePath);

        // Collect folder parts
        const parts = f.webkitRelativePath.split("/");
        if (parts.length > 1) {
          for (let j = 0; j < parts.length - 1; j++) {
            allFolders.add(parts.slice(0, j + 1).join("/"));
          }
        }
      }

      setFileList(allFiles);
      setFolderList(Array.from(allFolders));
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("webkitdirectory", "");
    }
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("basePath");
      if (saved) setBasePath(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (basePath) {
        window.localStorage.setItem("basePath", basePath);
      } else {
        window.localStorage.removeItem("basePath");
      }
    } catch {}
  }, [basePath]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Folder Selector</h1>
          <p className="text-muted-foreground">Select a folder from your local machine</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Click the Browse button and select the folder containing the codebase
            </label>
            <Button onClick={handleBrowseClick} variant="outline" className="px-4 bg-transparent">
              Browse
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Filter Options</label>
              <div className="flex">
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                  className="px-3 py-2 bg-background border border-input rounded-l-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring border-r-0"
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Include files under: {formatFileSize(currentFileSize)}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div className="flex justify-center">
              <Button className="w-fit px-8">Ingest</Button>
            </div>
          </div>

          {selectedFolder && (
            <div className="p-3 bg-muted rounded-md space-y-3">
              <p className="text-sm text-muted-foreground">
                Selected Folder: <span className="font-medium text-foreground">{selectedFolder}</span>
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-input rounded-md bg-background p-3">
                  <h2 className="font-medium text-foreground">Summary</h2>
                </div>
                <div className="border border-input rounded-md bg-background p-3">
                  <h2 className="font-medium text-foreground">Directory Structure</h2>
                </div>
              </div>

              <div className="border border-input rounded-md bg-background p-3">
                <h2 className="font-medium text-foreground">Files Content</h2>
              </div>
            </div>
          )}
        </div>

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
    </div>
  );
}
