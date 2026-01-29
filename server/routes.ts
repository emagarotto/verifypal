import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import archiver from "archiver";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // API endpoint to download the Chrome extension as a ZIP file
  app.get("/api/download-extension", async (req, res) => {
    try {
      const extensionDir = path.join(process.cwd(), "chrome-extension");
      
      // Check if the extension directory exists
      if (!fs.existsSync(extensionDir)) {
        return res.status(404).json({ error: "Extension not found" });
      }

      // Set headers for ZIP download
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", "attachment; filename=codepaste-extension.zip");

      // Create a zip archive
      const archive = archiver("zip", {
        zlib: { level: 9 }
      });

      // Track if response has been sent
      let responseSent = false;

      // Handle archive errors
      archive.on("error", (err) => {
        console.error("Archive error:", err);
        if (!responseSent) {
          responseSent = true;
          res.status(500).json({ error: "Failed to create archive" });
        }
      });

      // Handle archive end
      archive.on("end", () => {
        responseSent = true;
      });

      // Pipe archive to response
      archive.pipe(res);

      // Add only necessary extension files (exclude SVGs)
      const filesToInclude = [
        "manifest.json",
        "popup.html",
        "popup.js",
        "background.js",
        "email-detector.js",
        "code-filler.js"
      ];

      for (const file of filesToInclude) {
        const filePath = path.join(extensionDir, file);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: `codepaste-extension/${file}` });
        }
      }

      // Add icons directory (only PNGs)
      const iconsDir = path.join(extensionDir, "icons");
      if (fs.existsSync(iconsDir)) {
        const iconFiles = fs.readdirSync(iconsDir).filter(f => f.endsWith('.png'));
        for (const iconFile of iconFiles) {
          archive.file(path.join(iconsDir, iconFile), { name: `codepaste-extension/icons/${iconFile}` });
        }
      }

      // Finalize the archive
      await archive.finalize();
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Failed to download extension" });
    }
  });

  // API endpoint to get extension info
  app.get("/api/extension-info", (req, res) => {
    try {
      const manifestPath = path.join(process.cwd(), "chrome-extension", "manifest.json");
      
      if (!fs.existsSync(manifestPath)) {
        return res.status(404).json({ error: "Extension manifest not found" });
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      
      res.json({
        name: manifest.name,
        version: manifest.version,
        description: manifest.description
      });
    } catch (error) {
      console.error("Extension info error:", error);
      res.status(500).json({ error: "Failed to get extension info" });
    }
  });

  return httpServer;
}
