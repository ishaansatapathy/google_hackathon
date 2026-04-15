import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler from "serve-handler";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, "..", "dist");
const port = Number(process.env.PORT) || 8080;

/** Runtime Maps key — set in Cloud Run → Variables (no rebuild needed). */
function runtimeEnvBody() {
  const key =
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ||
    "";
  return `window.__GOOGLE_MAPS_API_KEY__=${JSON.stringify(key)};`;
}

const server = http.createServer(async (req, res) => {
  const pathname = req.url?.split("?")[0] ?? "/";
  if (pathname === "/runtime-env.js") {
    res.writeHead(200, {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    });
    res.end(runtimeEnvBody());
    return;
  }
  await handler(req, res, {
    public: dist,
    rewrites: [{ source: "**", destination: "/index.html" }],
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Listening on http://0.0.0.0:${port}`);
});
