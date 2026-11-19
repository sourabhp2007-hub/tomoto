import { localApi } from "../server/local.js";

let handler;

export default async function (req, res) {
  if (!handler) {
    handler = localApi();
  }
  return handler(req, res, () => {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Endpoint not found." }));
  });
}

