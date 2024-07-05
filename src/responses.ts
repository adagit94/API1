import { IncomingMessage, ServerResponse } from "http"

export const optionsRes = (
  req: IncomingMessage,
  res: ServerResponse,
  allowedMethods: string[]
) => {
  res.writeHead(200, {
    "access-control-allow-origin": req.headers.origin,
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": allowedMethods.join(),
  })
  res.end()
}

export const unsupportedEndpointRes = (
  req: IncomingMessage,
  res: ServerResponse,
  endpoint: string
) => {
    res.writeHead(403, `Endpoint ${endpoint} not supported.`, { 'access-control-allow-origin': req.headers.origin });
    res.end();
}

export const unsupportedEndpointMethodRes = (
  req: IncomingMessage,
  res: ServerResponse,
  endpoint: string
) => {
    res.writeHead(405, `Method ${req.method} isnt supported for endpoint ${endpoint}.`, { 'access-control-allow-origin': req.headers.origin });
    res.end();
}
