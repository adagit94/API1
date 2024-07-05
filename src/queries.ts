import pg from 'pg';
import pgFormat from 'pg-format';
import http from 'node:http';
import { isRecord, isRecordArray } from './utils.js';
import { parseWhere, parseJsonBody } from './utils.js';
import { QueryPair } from './types.js';

const { DB_URL, POOL_SETTINGS } = process.env;

if (DB_URL === undefined) throw new Error('DB_URL env. variable must be defined.');

const pool = new pg.Pool({ connectionString: DB_URL, ...JSON.parse(POOL_SETTINGS ?? '{}') });

export const get = async (table: string, queryParams: URLSearchParams, req: http.IncomingMessage, res: http.ServerResponse) => {
  try {
    let select: QueryPair = ['*', []];
    let where: QueryPair = ['', []];
    let orderBy: QueryPair = ['', []];
    let limit: QueryPair = ['', []];
    let offset: QueryPair = ['', []];

    for (let [param, value] of queryParams.entries()) {
      param = param.toUpperCase();

      switch (param) {
        case 'SELECT': {
          const cols = value.split(',');

          select[0] = cols.map(() => `%I`).join();
          select[1].push(...cols);
          break;
        }

        case 'WHERE': {
          where = parseWhere(value);
          break;
        }

        case 'ORDERBY': {
          const cols = value.split(',').map(col => col.split(':'));

          for (let [col, method] of cols) {
            method = method?.toUpperCase();

            orderBy[0] += `${orderBy[0].length > 0 ? ',' : ''}%I${method === 'ASC' || method === 'DESC' ? ` ${method}` : ''}`;
            orderBy[1].push(col);
          }
          break;
        }

        case 'LIMIT': {
          limit[0] = '%L';
          limit[1].push(value);
          break;
        }

        case 'OFFSET': {
          offset[0] = '%L';
          offset[1].push(value);
          break;
        }
      }
    }

    const query = `SELECT ${select[0]} FROM %I${where[0] ? ` WHERE ${where[0]}` : ''}${orderBy[0] ? ` ORDER BY ${orderBy[0]}` : ''}${
      limit[0] ? ` LIMIT ${limit[0]}` : ''
    }${offset[0] ? ` OFFSET ${offset[0]}` : ''};`;
    const values = [...select[1], table, ...where[1], ...orderBy[1], ...limit[1], ...offset[1]];
    const data = await pool.query(pgFormat(query, ...values));

    res.writeHead(200, { 'content-type': 'json', 'access-control-allow-origin': req.headers.origin });
    res.end(JSON.stringify(data.rows));
  } catch (err) {
    res.writeHead(404, `GET Request failed: ${err}`, { 'access-control-allow-origin': req.headers.origin });
    res.end();
  }
};

export const post = async (table: string, req: http.IncomingMessage, res: http.ServerResponse) => {
  try {
    const body = await parseJsonBody(req);

    if (!(isRecord(body) || isRecordArray(body))) throw new Error("Body isn't object nor array of objects.");

    const rows = Array.isArray(body) ? body : [body];
    const client = await pool.connect();

    await client.query('BEGIN');

    try {
      const results = await Promise.all(
        rows.map(row => {
          const cols = Object.keys(row);
          const vals = Object.values(row);

          const query = `INSERT INTO %I (${cols.map(() => '%I')}) VALUES (${vals.map(() => '%L')}) RETURNING *;`;

          return client.query(pgFormat(query, table, ...cols, ...vals));
        })
      );

      await client.query('COMMIT');

      res.writeHead(200, { 'content-type': 'json', 'access-control-allow-origin': req.headers.origin });
      res.end(JSON.stringify(results.flatMap(result => result.rows)));
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.writeHead(400, `POST Request failed: ${err}`, { 'access-control-allow-origin': req.headers.origin });
    res.end();
  }
};

export const put = async (table: string, queryParams: URLSearchParams, req: http.IncomingMessage, res: http.ServerResponse) => {
  try {
    let where: QueryPair = ['', []];

    for (let [param, value] of queryParams.entries()) {
      param = param.toUpperCase();

      switch (param) {
        case 'WHERE': {
          where = parseWhere(value);
          break;
        }
      }
    }

    const body = await parseJsonBody(req);

    if (!isRecord(body)) throw new Error("Body isn't object.");

    const colsVals = Object.entries(body);

    const query = `UPDATE %I SET ${colsVals.map(() => `%I = %L`)}${where[0] ? ` WHERE ${where[0]}` : ''} RETURNING *;`;
    const values = [table, ...colsVals.flat(), ...where[1]];
    const data = await pool.query(pgFormat(query, ...values));

    res.writeHead(200, { 'content-type': 'json', 'access-control-allow-origin': req.headers.origin });
    res.end(JSON.stringify(data.rows));
  } catch (err) {
    res.writeHead(400, `PUT Request failed: ${err}`, { 'access-control-allow-origin': req.headers.origin });
    res.end();
  }
};

export const del = async (table: string, queryParams: URLSearchParams, req: http.IncomingMessage, res: http.ServerResponse) => {
  try {
    let where: QueryPair = ['', []];

    for (let [param, value] of queryParams.entries()) {
      param = param.toUpperCase();

      switch (param) {
        case 'WHERE': {
          where = parseWhere(value);
          break;
        }
      }
    }

    const query = `DELETE FROM %I${where[0] ? ` WHERE ${where[0]}` : ''};`;
    const values = [table, ...where[1]];

    await pool.query(pgFormat(query, ...values));

    res.writeHead(200, { 'access-control-allow-origin': req.headers.origin });
    res.end();
  } catch (err) {
    res.writeHead(400, `PUT Request failed: ${err}`, { 'access-control-allow-origin': req.headers.origin });
    res.end();
  }
};
