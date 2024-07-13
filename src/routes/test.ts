import { IncomingMessage, ServerResponse } from "http";
import { RouteHandler } from "./routes-map.js";

export const test: RouteHandler = async (req: IncomingMessage, res: ServerResponse, url) => {
  console.log("/test", url);

  switch (req.method?.toUpperCase()) {
    case "OPTIONS": {
      break;
    }

    case "GET": {
      break;
    }

    case "POST": {
      break;
    }

    case "PUT": {
      break;
    }

    case "DELETE": {
      break;
    }
  }
};
