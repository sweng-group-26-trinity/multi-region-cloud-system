import { serve } from "bun";
import index from "./index.html";

const BACKEND_URL = "http://localhost:8080";
const GCS_EMULATOR_URL = "https://localhost:4443";

const server = serve({
  routes: {
    "/public/*": async (req) => {
      const url = new URL(req.url);
      const file = Bun.file(`./src${url.pathname}`);
      if (await file.exists()) {
        return new Response(file);
      }
      return new Response("Not found", { status: 404 });
    },

    // Proxy GCS emulator image requests — avoids self-signed cert errors in the browser
    "/gcs/*": async (req) => {
      const url = new URL(req.url);
      const gcsPath = url.pathname.replace("/gcs", "");
      const gcsUrl = `${GCS_EMULATOR_URL}${gcsPath}${url.search}`;
      const proxyRes = await fetch(gcsUrl, {
        tls: { rejectUnauthorized: false },
      });
      return new Response(proxyRes.body, {
        status: proxyRes.status,
        headers: proxyRes.headers,
      });
    },

    // Proxy all /api/* requests to Spring backend
    "/api/*": async (req) => {
      const url = new URL(req.url);
      const backendUrl = `${BACKEND_URL}${url.pathname}${url.search}`;
      const proxyRes = await fetch(backendUrl, {
        method: req.method,
        headers: req.headers,
        body:
          req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      });
      return new Response(proxyRes.body, {
        status: proxyRes.status,
        headers: proxyRes.headers,
      });
    },

    "/api/hello": {
      async GET(req) {
        return Response.json({ message: "Hello, world!", method: "GET" });
      },
      async PUT(req) {
        return Response.json({ message: "Hello, world!", method: "PUT" });
      },
    },

    "/api/hello/:name": async (req) => {
      const name = req.params.name;
      return Response.json({ message: `Hello, ${name}!` });
    },

    "/*": index,
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
