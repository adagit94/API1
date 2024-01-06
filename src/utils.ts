import http from 'node:http';
import { Endpoint, Endpoints, Method, QueryPair } from './types.js';
import { array, compose, map, object, record, runParser, shallowEnum, string } from './parsers.js';

export const isRecord = (x: unknown): x is Record<PropertyKey, unknown> => typeof x === 'object' && !Array.isArray(x) && x !== null;
export const isRecordArray = (x: unknown): x is Record<PropertyKey, unknown>[] => Array.isArray(x) && x.every(isRecord);

export const parseWhere = (value: string): QueryPair => {
  let where: QueryPair = ['', []];

  const conditions = value.split(':');

  for (let i = 0; i < conditions.length; i++) {
    if (i % 2 === 0) {
      const condition = conditions[i];
      const groups = condition.match(/(\w+)([<>=!]{1,2})(\w+)/);

      if (groups) {
        const [_whole, col, op, val] = groups;

        where[0] += `%I %s %L`;
        where[1].push(col, op, val);
      } else {
        throw new Error('WHERE condition format incorrect.');
      }
    } else {
      const operator = conditions[i].toUpperCase();

      if (operator === 'AND' || operator === 'OR') {
        where[0] += ` ${operator} `;
      } else {
        throw new Error('WHERE operator incorrect.');
      }
    }
  }

  return where;
};

export const parseJsonBody = async (req: http.IncomingMessage) => {
  if (req.headers['content-type'] !== 'application/json') throw new Error("Content-Type header isn't application/json.");

  const body = await new Promise((resolve, reject) => {
    let dataStr = '';

    req.setEncoding('utf8');
    req.on('data', chunk => {
      dataStr += chunk;
    });
    req.on('end', () => {
      try {
        const body = JSON.parse(dataStr);

        resolve(body);
      } catch (err) {
        reject(err);
      }
    });
  });

  return body;
};

export const parseEndpoints = (x: unknown) => {
  const str = runParser(string, x);
  const endpoints = runParser(
    map(record, rec => {
      let endpoints: Endpoints = {};

      for (const [k, v] of Object.entries(rec)) {
        endpoints[runParser(string, k)] = runParser(
          object<Endpoint>({
            methods: array(
              compose(
                map(string, str => str.toUpperCase()),
                shallowEnum(Method)
              )
            ),
          }),
          v
        );
      }

      return endpoints
    }),
    JSON.parse(str)
  );

  return endpoints
};
