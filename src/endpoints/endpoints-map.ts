import { IncomingMessage, ServerResponse } from "http"
import { test } from "./test.js"

// type EndpointHandlerParams = {}

export type EndpointHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) => Promise<void>

type EndpointsMap = Record<string, EndpointHandler>

export const endpointsMap: EndpointsMap = {
  "/test": test,
  "/:test": async () => {
    console.log("/:test")
  },
  "/:test/test": async () => {
    console.log("/:test/test")
  },
  "/test/:test": async () => {
    console.log("/test/:test")
  },
  "/:test/:test": async () => {
    console.log("/:test/:test")
  },
}
