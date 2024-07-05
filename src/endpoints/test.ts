import { IncomingMessage, ServerResponse } from "http"
import { EndpointHandler } from "./endpoints-map.js"

export const test: EndpointHandler = async (
  req: IncomingMessage,
  res: ServerResponse,
  url
) => {
  console.log("/test", url)

  switch (req.method?.toUpperCase()) {
    case "OPTIONS": {
      break
    }

    case "GET": {
      break
    }

    case "POST": {
      break
    }

    case "PUT": {
      break
    }

    case "DELETE": {
      break
    }
  }
}
