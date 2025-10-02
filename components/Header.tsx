import React from "react";

const Header: React.FC = () => (
  <header className="fixed top-0 left-0 right-0 z-50 w-full mb-10 border-b-3 border-border bg-gray-100 dark:bg-gray-700 backdrop-blur-sm">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
      {/* Logo + Title */}
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="App logo" className="h-7 w-7" />
        <span className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
          Local Codebase Digest Generator
        </span>
      </div>
      {/* Navigation */}
      <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
        <a
          href="https://github.com/SiarheiAbr/localcode-digest-generator"
          className="hover:text-foreground"
        >
          GitHub
        </a>
      </nav>
    </div>
  </header>
);

export default Header;
