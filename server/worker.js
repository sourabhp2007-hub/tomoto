import { api } from "./api.js";
import { files } from "virtual:tomato-assets";
export default {
  async fetch(req, env) {
    const path = new URL(req.url).pathname;
    if (path.startsWith("/api/")) {
      const id = req.headers.get("oai-authenticated-user-id"),
        email = req.headers.get("oai-authenticated-user-email");
      return api(
        req,
        env.DB,
        id && email ? { id, email, name: email.split("@")[0] } : null,
        {
          admin:
            !!email &&
            email.toLowerCase() === env.TOMATO_OWNER_EMAIL?.toLowerCase(),
        },
      );
    }
    if (!["GET", "HEAD"].includes(req.method))
      return new Response(null, { status: 405 });
    const file = Object.hasOwn(files, path)
      ? files[path]
      : !path.split("/").pop().includes(".")
        ? files["/index.html"]
        : null;
    if (!file) return new Response("File unavailable", { status: 404 });
    return new Response(
      req.method === "HEAD"
        ? null
        : Uint8Array.from(atob(file.body), (c) => c.charCodeAt(0)),
      {
        headers: {
          "content-type": file.type,
          "cache-control": path.startsWith("/assets/")
            ? "public,max-age=31536000,immutable"
            : "no-cache",
          "x-content-type-options": "nosniff",
        },
      },
    );
  },
};
