import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const port = process.env.PORT || "8080";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const serveCli = path.join(root, "node_modules", "serve", "build", "main.js");

const child = spawn(
  process.execPath,
  [serveCli, "-s", "dist", "-l", `tcp://0.0.0.0:${port}`],
  { cwd: root, stdio: "inherit", env: process.env },
);
child.on("exit", (code) => process.exit(code ?? 0));
