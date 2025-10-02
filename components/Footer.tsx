import React from "react";

const Footer: React.FC = () => (
  <footer className="w-full mt-8">
    <div className="w-full border border-input rounded-md bg-background px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
      <span>
        © {new Date().getFullYear()} Local Digest. All rights reserved.
      </span>
      <div className="flex items-center gap-4">
        <a href="mailto:uef007@gmail.com" className="hover:text-foreground">
          Contact
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
