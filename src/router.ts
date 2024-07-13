import { IncomingMessage, ServerResponse } from "http";
import { RouteHandler, routesMap as routesMap } from "./routes/routes-map.js";
import { unsupportedEndpointRes } from "./responses.js";

export type RouteParams = Record<string, string>;

export type RouteData = { handler: RouteHandler; params: RouteParams; slug?: string[] };

export const route = async (req: IncomingMessage, res: ServerResponse) => {
  if (req.url === undefined) {
    res.writeHead(400, "Url not found.");
    res.end();
    return;
  }

  if (req.method === undefined) {
    res.writeHead(400, "Method isnt present.");
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const routeData = selectRoute(url);

  if (routeData) {
    await routeData.handler(req, res, url, routeData.params, routeData.slug);
  } else {
    unsupportedEndpointRes(req, res, url.pathname);
  }
};

const selectRoute = (url: URL): RouteData | null => {
  const segments = url.pathname.split("/");

  {
    let staticRoutes: RouteData[] = [];
    let dynamicRoutes: [number | undefined, RouteData][] = [];

    for (const route of Object.keys(routesMap)) {
      const routeSegments = route.split("/");

      if (segments.length === routeSegments.length && routeSegments.at(-1) !== "...") {
        const evalResult = evalRoute([segments, routeSegments]);

        if (evalResult) {
          evalResult.isStatic
            ? staticRoutes.push({ handler: routesMap[route], params: evalResult.params })
            : dynamicRoutes.push([evalResult.dynamicAt, { handler: routesMap[route], params: evalResult.params }]);
        }
      }
    }

    if (staticRoutes.length > 0) return staticRoutes[0];

    if (dynamicRoutes.length > 0) {
      const mostPrecise = dynamicRoutes.reduce((prev, current) =>
        current[0] !== undefined && prev[0] !== undefined && current[0] > prev[0] ? current : prev
      );

      return mostPrecise[1];
    }
  }

  // slugs
  {
    let routes: [number, RouteData][] = [];

    for (const route of Object.keys(routesMap)) {
      const routeSegments = route.split("/");

      if (segments.length >= routeSegments.length && routeSegments.at(-1) === "...") {
        const evalResult = evalRoute([segments, routeSegments.slice(0, routeSegments.length - 1)], true);

        evalResult &&
          evalResult.isStatic &&
          routes.push([routeSegments.length - 1, { handler: routesMap[route], params: evalResult.params }]);
      }
    }

    if (routes.length > 0) {
      const mostPrecise = routes.reduce((prev, current) => (current[0] > prev[0] ? current : prev));
      const data = {
        ...mostPrecise[1],
        slug: segments.slice(mostPrecise[0], segments.length),
      };

      return data;
    }
  }

  return null;
};

const evalRoute = (segments: [string[], string[]], slug?: boolean) => {
  let params: RouteParams = {};
  let isStatic = true;
  let dynamicAt: number | undefined;

  for (let i = 0; i < segments[slug ? 1 : 0].length; i++) {
    const segA = segments[0][i];
    const segB = segments[1][i];

    // static one
    if (!segA.startsWith(":") && !segB.startsWith(":") && segA === segB) {
      continue;
    }

    // dynamic one
    if (!segA.startsWith(":") && segB.startsWith(":")) {
      params[segB.slice(1)] = segA;
      isStatic = false;
      dynamicAt ??= i;
      continue;
    }

    return false;
  }

  return {
    isStatic,
    dynamicAt,
    params,
  };
};
