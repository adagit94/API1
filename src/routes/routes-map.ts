import { IncomingMessage, ServerResponse } from "http";
import { RouteParams } from "../router.js";

export type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  routeParams: RouteParams,
  slug?: string[]
) => Promise<void>;

type RoutesMap = Record<string, RouteHandler>;

export const routesMap: RoutesMap = {
  "/:a": async (req, res, url, params) => {
    console.log("/:a", params);
  },
  "/:a/:b": async (req, res, url, params) => {
    console.log("/:a/:b", params);
  },
  "/a/:b": async (req, res, url, params) => {
    console.log("/a/:b", params);
  },
  "/a/...": async (req, res, url, params, slug) => {
    console.log("/a/...", slug);
  },
  "/a/b/...": async (req, res, url, params, slug) => {
    console.log("/a/b/...", slug);
  },
  "/": async () => console.log("/"),
  "/a": async () => console.log("/a"),
  "/b": async () => console.log("/b"),
  "/a/b": async () => console.log("/a/b"),
};
