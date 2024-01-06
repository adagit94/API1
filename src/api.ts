import 'dotenv/config';
import http, { IncomingMessage, ServerResponse } from 'node:http';
import { del, get, post, put } from './queries.js';
import { parseEndpoints } from './utils.js';

const { PORT, ENDPOINTS } = process.env;

if (Number.isNaN(PORT)) throw new Error('PORT env. variable number must be defined.');

const endpoints = parseEndpoints(ENDPOINTS)

http
  .createServer(async (req, res) => {
    try {
      if (req.url === undefined) {
        res.writeHead(400, 'Url not found.');
        res.end();
        return;
      }

      const urlObject = new URL(req.url, `http://${req.headers.host}`);
      const endpoint = urlObject.pathname.slice(1);

      await handleEndpoint(endpoint, urlObject.searchParams, req, res);
    } catch (err) {
      if (!req.closed) {
        res.writeHead(500, String(err));
        res.end();
      }
    }
  })
  .listen(Number(PORT));

const handleEndpoint = async (endpoint: string, params: URLSearchParams, req: IncomingMessage, res: ServerResponse) => {
  if (req.method === undefined) {
    res.writeHead(400, "Method isnt present.")
    res.end()
    return
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'access-control-allow-origin': origin,
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': endpoints[endpoint].methods.join(),
    });
    res.end();
    return;
  }

  if (endpoints[endpoint] === undefined) {
    res.writeHead(403, `Endpoint ${endpoint} not supported.`, { 'access-control-allow-origin': origin });
    res.end();
    return;
  }

  if (!endpoints[endpoint].methods.some(method => method === req.method)) { 
    res.writeHead(405, `Method ${req.method} isnt supported for endpoint ${endpoint}.`, { 'access-control-allow-origin': origin });
    res.end();
    return;
  }

  switch (req.method.toUpperCase()) {
    case 'GET': {
      await get(endpoint, params, req, res);
      break;
    }

    case 'POST': {
      await post(endpoint, req, res);
      break;
    }

    case 'PUT': {
      await put(endpoint, params, req, res);
      break;
    }

    case 'DELETE': {
      await del(endpoint, params, req, res);
      break;
    }
  }
};
