import http from "node:http";
import { route } from "./router.js";

const { PORT } = process.env;

if (typeof Number(PORT) !== "number") throw new Error("PORT env. variable number must be defined.");

http
  .createServer(async (req, res) => {
    try {
      await route(req, res);
    } catch (err) {
      console.error(err);

      if (!req.closed) {
        res.writeHead(500, "Internal server error.");
        res.end();
      }
    }
  })
  .listen(Number(PORT));
