export type QueryPair = [string, string[]]; // [escaped query string, array of values themself]

export enum Method {
  Get = "GET",
  Post = "POST",
  Put = "PUT",
  Delete = "DELETE",
}

export type Endpoint = {
  methods: Method[];
};

export type Endpoints = Record<string, Endpoint>
