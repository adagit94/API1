import { IncomingMessage, ServerResponse } from "http"
import { endpointsMap } from "../endpoints/endpoints-map.js"
import { unsupportedEndpointRes } from "../responses.js"

export const route = async (req: IncomingMessage, res: ServerResponse) => {
  if (req.url === undefined) {
    res.writeHead(400, "Url not found.")
    res.end()
    return
  }

  if (req.method === undefined) {
    res.writeHead(400, "Method isnt present.")
    res.end()
    return
  }

  const url = new URL(req.url, `http://${req.headers.host}`)
  const routeHandler = selectRoute(url)

  if (routeHandler) {
    await routeHandler(req, res, url)
  } else {
    unsupportedEndpointRes(req, res, url.pathname)
  }
}

const selectRoute = (url: URL) => {
  // exact static route
  if (endpointsMap[url.pathname]) {
    return endpointsMap[url.pathname]
  }

  const segments = url.pathname.split("/")

  for (const endpoint of Object.keys(endpointsMap)) {
    const endpointSegments = endpoint.split("/")
    let match = false

    // dynamic one
    if (segments.length === endpointSegments.length) {
      match = segments.every((segment, i) => {
        const endpointSegment = endpointSegments[i]

        return segment === endpointSegment || endpointSegment.startsWith(":")
      })
    }

    if (match) {
      return endpointsMap[endpoint]
    }
  }
}
