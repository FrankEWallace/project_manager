var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/vercel.ts
import { getRequestListener } from "@hono/node-server";

// src/app.ts
import { Hono as Hono13 } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// ../../packages/db/src/client.ts
import { drizzle } from "drizzle-orm/postgres-js";

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/index.js
import os from "os";
import fs from "fs";

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/query.js
var originCache = /* @__PURE__ */ new Map();
var originStackCache = /* @__PURE__ */ new Map();
var originError = Symbol("OriginError");
var CLOSE = {};
var Query = class extends Promise {
  constructor(strings, args, handler, canceller, options = {}) {
    let resolve, reject;
    super((a, b2) => {
      resolve = a;
      reject = b2;
    });
    this.tagged = Array.isArray(strings.raw);
    this.strings = strings;
    this.args = args;
    this.handler = handler;
    this.canceller = canceller;
    this.options = options;
    this.state = null;
    this.statement = null;
    this.resolve = (x) => (this.active = false, resolve(x));
    this.reject = (x) => (this.active = false, reject(x));
    this.active = false;
    this.cancelled = null;
    this.executed = false;
    this.signature = "";
    this[originError] = this.handler.debug ? new Error() : this.tagged && cachedError(this.strings);
  }
  get origin() {
    return (this.handler.debug ? this[originError].stack : this.tagged && originStackCache.has(this.strings) ? originStackCache.get(this.strings) : originStackCache.set(this.strings, this[originError].stack).get(this.strings)) || "";
  }
  static get [Symbol.species]() {
    return Promise;
  }
  cancel() {
    return this.canceller && (this.canceller(this), this.canceller = null);
  }
  simple() {
    this.options.simple = true;
    this.options.prepare = false;
    return this;
  }
  async readable() {
    this.simple();
    this.streaming = true;
    return this;
  }
  async writable() {
    this.simple();
    this.streaming = true;
    return this;
  }
  cursor(rows = 1, fn) {
    this.options.simple = false;
    if (typeof rows === "function") {
      fn = rows;
      rows = 1;
    }
    this.cursorRows = rows;
    if (typeof fn === "function")
      return this.cursorFn = fn, this;
    let prev;
    return {
      [Symbol.asyncIterator]: () => ({
        next: () => {
          if (this.executed && !this.active)
            return { done: true };
          prev && prev();
          const promise = new Promise((resolve, reject) => {
            this.cursorFn = (value) => {
              resolve({ value, done: false });
              return new Promise((r) => prev = r);
            };
            this.resolve = () => (this.active = false, resolve({ done: true }));
            this.reject = (x) => (this.active = false, reject(x));
          });
          this.execute();
          return promise;
        },
        return() {
          prev && prev(CLOSE);
          return { done: true };
        }
      })
    };
  }
  describe() {
    this.options.simple = false;
    this.onlyDescribe = this.options.prepare = true;
    return this;
  }
  stream() {
    throw new Error(".stream has been renamed to .forEach");
  }
  forEach(fn) {
    this.forEachFn = fn;
    this.handle();
    return this;
  }
  raw() {
    this.isRaw = true;
    return this;
  }
  values() {
    this.isRaw = "values";
    return this;
  }
  async handle() {
    !this.executed && (this.executed = true) && await 1 && this.handler(this);
  }
  execute() {
    this.handle();
    return this;
  }
  then() {
    this.handle();
    return super.then.apply(this, arguments);
  }
  catch() {
    this.handle();
    return super.catch.apply(this, arguments);
  }
  finally() {
    this.handle();
    return super.finally.apply(this, arguments);
  }
};
function cachedError(xs) {
  if (originCache.has(xs))
    return originCache.get(xs);
  const x = Error.stackTraceLimit;
  Error.stackTraceLimit = 4;
  originCache.set(xs, new Error());
  Error.stackTraceLimit = x;
  return originCache.get(xs);
}

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/errors.js
var PostgresError = class extends Error {
  constructor(x) {
    super(x.message);
    this.name = this.constructor.name;
    Object.assign(this, x);
  }
};
var Errors = {
  connection,
  postgres,
  generic,
  notSupported
};
function connection(x, options, socket) {
  const { host, port } = socket || options;
  const error = Object.assign(
    new Error("write " + x + " " + (options.path || host + ":" + port)),
    {
      code: x,
      errno: x,
      address: options.path || host
    },
    options.path ? {} : { port }
  );
  Error.captureStackTrace(error, connection);
  return error;
}
function postgres(x) {
  const error = new PostgresError(x);
  Error.captureStackTrace(error, postgres);
  return error;
}
function generic(code, message) {
  const error = Object.assign(new Error(code + ": " + message), { code });
  Error.captureStackTrace(error, generic);
  return error;
}
function notSupported(x) {
  const error = Object.assign(
    new Error(x + " (B) is not supported"),
    {
      code: "MESSAGE_NOT_SUPPORTED",
      name: x
    }
  );
  Error.captureStackTrace(error, notSupported);
  return error;
}

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/types.js
var types = {
  string: {
    to: 25,
    from: null,
    // defaults to string
    serialize: (x) => "" + x
  },
  number: {
    to: 0,
    from: [21, 23, 26, 700, 701],
    serialize: (x) => "" + x,
    parse: (x) => +x
  },
  json: {
    to: 114,
    from: [114, 3802],
    serialize: (x) => JSON.stringify(x),
    parse: (x) => JSON.parse(x)
  },
  boolean: {
    to: 16,
    from: 16,
    serialize: (x) => x === true ? "t" : "f",
    parse: (x) => x === "t"
  },
  date: {
    to: 1184,
    from: [1082, 1114, 1184],
    serialize: (x) => (x instanceof Date ? x : new Date(x)).toISOString(),
    parse: (x) => new Date(x)
  },
  bytea: {
    to: 17,
    from: 17,
    serialize: (x) => "\\x" + Buffer.from(x).toString("hex"),
    parse: (x) => Buffer.from(x.slice(2), "hex")
  }
};
var NotTagged = class {
  then() {
    notTagged();
  }
  catch() {
    notTagged();
  }
  finally() {
    notTagged();
  }
};
var Identifier = class extends NotTagged {
  constructor(value) {
    super();
    this.value = escapeIdentifier(value);
  }
};
var Parameter = class extends NotTagged {
  constructor(value, type, array) {
    super();
    this.value = value;
    this.type = type;
    this.array = array;
  }
};
var Builder = class extends NotTagged {
  constructor(first, rest) {
    super();
    this.first = first;
    this.rest = rest;
  }
  build(before, parameters, types2, options) {
    const keyword = builders.map(([x, fn]) => ({ fn, i: before.search(x) })).sort((a, b2) => a.i - b2.i).pop();
    return keyword.i === -1 ? escapeIdentifiers(this.first, options) : keyword.fn(this.first, this.rest, parameters, types2, options);
  }
};
function handleValue(x, parameters, types2, options) {
  let value = x instanceof Parameter ? x.value : x;
  if (value === void 0) {
    x instanceof Parameter ? x.value = options.transform.undefined : value = x = options.transform.undefined;
    if (value === void 0)
      throw Errors.generic("UNDEFINED_VALUE", "Undefined values are not allowed");
  }
  return "$" + types2.push(
    x instanceof Parameter ? (parameters.push(x.value), x.array ? x.array[x.type || inferType(x.value)] || x.type || firstIsString(x.value) : x.type) : (parameters.push(x), inferType(x))
  );
}
var defaultHandlers = typeHandlers(types);
function stringify(q, string, value, parameters, types2, options) {
  for (let i = 1; i < q.strings.length; i++) {
    string += stringifyValue(string, value, parameters, types2, options) + q.strings[i];
    value = q.args[i];
  }
  return string;
}
function stringifyValue(string, value, parameters, types2, o) {
  return value instanceof Builder ? value.build(string, parameters, types2, o) : value instanceof Query ? fragment(value, parameters, types2, o) : value instanceof Identifier ? value.value : value && value[0] instanceof Query ? value.reduce((acc, x) => acc + " " + fragment(x, parameters, types2, o), "") : handleValue(value, parameters, types2, o);
}
function fragment(q, parameters, types2, options) {
  q.fragment = true;
  return stringify(q, q.strings[0], q.args[0], parameters, types2, options);
}
function valuesBuilder(first, parameters, types2, columns, options) {
  return first.map(
    (row) => "(" + columns.map(
      (column) => stringifyValue("values", row[column], parameters, types2, options)
    ).join(",") + ")"
  ).join(",");
}
function values(first, rest, parameters, types2, options) {
  const multi = Array.isArray(first[0]);
  const columns = rest.length ? rest.flat() : Object.keys(multi ? first[0] : first);
  return valuesBuilder(multi ? first : [first], parameters, types2, columns, options);
}
function select(first, rest, parameters, types2, options) {
  typeof first === "string" && (first = [first].concat(rest));
  if (Array.isArray(first))
    return escapeIdentifiers(first, options);
  let value;
  const columns = rest.length ? rest.flat() : Object.keys(first);
  return columns.map((x) => {
    value = first[x];
    return (value instanceof Query ? fragment(value, parameters, types2, options) : value instanceof Identifier ? value.value : handleValue(value, parameters, types2, options)) + " as " + escapeIdentifier(options.transform.column.to ? options.transform.column.to(x) : x);
  }).join(",");
}
var builders = Object.entries({
  values,
  in: (...xs) => {
    const x = values(...xs);
    return x === "()" ? "(null)" : x;
  },
  select,
  as: select,
  returning: select,
  "\\(": select,
  update(first, rest, parameters, types2, options) {
    return (rest.length ? rest.flat() : Object.keys(first)).map(
      (x) => escapeIdentifier(options.transform.column.to ? options.transform.column.to(x) : x) + "=" + stringifyValue("values", first[x], parameters, types2, options)
    );
  },
  insert(first, rest, parameters, types2, options) {
    const columns = rest.length ? rest.flat() : Object.keys(Array.isArray(first) ? first[0] : first);
    return "(" + escapeIdentifiers(columns, options) + ")values" + valuesBuilder(Array.isArray(first) ? first : [first], parameters, types2, columns, options);
  }
}).map(([x, fn]) => [new RegExp("((?:^|[\\s(])" + x + "(?:$|[\\s(]))(?![\\s\\S]*\\1)", "i"), fn]);
function notTagged() {
  throw Errors.generic("NOT_TAGGED_CALL", "Query not called as a tagged template literal");
}
var serializers = defaultHandlers.serializers;
var parsers = defaultHandlers.parsers;
function firstIsString(x) {
  if (Array.isArray(x))
    return firstIsString(x[0]);
  return typeof x === "string" ? 1009 : 0;
}
var mergeUserTypes = function(types2) {
  const user = typeHandlers(types2 || {});
  return {
    serializers: Object.assign({}, serializers, user.serializers),
    parsers: Object.assign({}, parsers, user.parsers)
  };
};
function typeHandlers(types2) {
  return Object.keys(types2).reduce((acc, k) => {
    types2[k].from && [].concat(types2[k].from).forEach((x) => acc.parsers[x] = types2[k].parse);
    if (types2[k].serialize) {
      acc.serializers[types2[k].to] = types2[k].serialize;
      types2[k].from && [].concat(types2[k].from).forEach((x) => acc.serializers[x] = types2[k].serialize);
    }
    return acc;
  }, { parsers: {}, serializers: {} });
}
function escapeIdentifiers(xs, { transform: { column } }) {
  return xs.map((x) => escapeIdentifier(column.to ? column.to(x) : x)).join(",");
}
var escapeIdentifier = function escape(str) {
  return '"' + str.replace(/"/g, '""').replace(/\./g, '"."') + '"';
};
var inferType = function inferType2(x) {
  return x instanceof Parameter ? x.type : x instanceof Date ? 1184 : x instanceof Uint8Array ? 17 : x === true || x === false ? 16 : typeof x === "bigint" ? 20 : Array.isArray(x) ? inferType2(x[0]) : 0;
};
var escapeBackslash = /\\/g;
var escapeQuote = /"/g;
function arrayEscape(x) {
  return x.replace(escapeBackslash, "\\\\").replace(escapeQuote, '\\"');
}
var arraySerializer = function arraySerializer2(xs, serializer, options, typarray) {
  if (Array.isArray(xs) === false)
    return xs;
  if (!xs.length)
    return "{}";
  const first = xs[0];
  const delimiter = typarray === 1020 ? ";" : ",";
  if (Array.isArray(first) && !first.type)
    return "{" + xs.map((x) => arraySerializer2(x, serializer, options, typarray)).join(delimiter) + "}";
  return "{" + xs.map((x) => {
    if (x === void 0) {
      x = options.transform.undefined;
      if (x === void 0)
        throw Errors.generic("UNDEFINED_VALUE", "Undefined values are not allowed");
    }
    return x === null ? "null" : '"' + arrayEscape(serializer ? serializer(x.type ? x.value : x) : "" + x) + '"';
  }).join(delimiter) + "}";
};
var arrayParserState = {
  i: 0,
  char: null,
  str: "",
  quoted: false,
  last: 0
};
var arrayParser = function arrayParser2(x, parser, typarray) {
  arrayParserState.i = arrayParserState.last = 0;
  return arrayParserLoop(arrayParserState, x, parser, typarray);
};
function arrayParserLoop(s, x, parser, typarray) {
  const xs = [];
  const delimiter = typarray === 1020 ? ";" : ",";
  for (; s.i < x.length; s.i++) {
    s.char = x[s.i];
    if (s.quoted) {
      if (s.char === "\\") {
        s.str += x[++s.i];
      } else if (s.char === '"') {
        xs.push(parser ? parser(s.str) : s.str);
        s.str = "";
        s.quoted = x[s.i + 1] === '"';
        s.last = s.i + 2;
      } else {
        s.str += s.char;
      }
    } else if (s.char === '"') {
      s.quoted = true;
    } else if (s.char === "{") {
      s.last = ++s.i;
      xs.push(arrayParserLoop(s, x, parser, typarray));
    } else if (s.char === "}") {
      s.quoted = false;
      s.last < s.i && xs.push(parser ? parser(x.slice(s.last, s.i)) : x.slice(s.last, s.i));
      s.last = s.i + 1;
      break;
    } else if (s.char === delimiter && s.p !== "}" && s.p !== '"') {
      xs.push(parser ? parser(x.slice(s.last, s.i)) : x.slice(s.last, s.i));
      s.last = s.i + 1;
    }
    s.p = s.char;
  }
  s.last < s.i && xs.push(parser ? parser(x.slice(s.last, s.i + 1)) : x.slice(s.last, s.i + 1));
  return xs;
}
var toCamel = (x) => {
  let str = x[0];
  for (let i = 1; i < x.length; i++)
    str += x[i] === "_" ? x[++i].toUpperCase() : x[i];
  return str;
};
var toPascal = (x) => {
  let str = x[0].toUpperCase();
  for (let i = 1; i < x.length; i++)
    str += x[i] === "_" ? x[++i].toUpperCase() : x[i];
  return str;
};
var toKebab = (x) => x.replace(/_/g, "-");
var fromCamel = (x) => x.replace(/([A-Z])/g, "_$1").toLowerCase();
var fromPascal = (x) => (x.slice(0, 1) + x.slice(1).replace(/([A-Z])/g, "_$1")).toLowerCase();
var fromKebab = (x) => x.replace(/-/g, "_");
function createJsonTransform(fn) {
  return function jsonTransform(x, column) {
    return typeof x === "object" && x !== null && (column.type === 114 || column.type === 3802) ? Array.isArray(x) ? x.map((x2) => jsonTransform(x2, column)) : Object.entries(x).reduce((acc, [k, v]) => Object.assign(acc, { [fn(k)]: jsonTransform(v, column) }), {}) : x;
  };
}
toCamel.column = { from: toCamel };
toCamel.value = { from: createJsonTransform(toCamel) };
fromCamel.column = { to: fromCamel };
var camel = { ...toCamel };
camel.column.to = fromCamel;
toPascal.column = { from: toPascal };
toPascal.value = { from: createJsonTransform(toPascal) };
fromPascal.column = { to: fromPascal };
var pascal = { ...toPascal };
pascal.column.to = fromPascal;
toKebab.column = { from: toKebab };
toKebab.value = { from: createJsonTransform(toKebab) };
fromKebab.column = { to: fromKebab };
var kebab = { ...toKebab };
kebab.column.to = fromKebab;

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/connection.js
import net from "net";
import tls from "tls";
import crypto from "crypto";
import Stream from "stream";
import { performance } from "perf_hooks";

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/result.js
var Result = class extends Array {
  constructor() {
    super();
    Object.defineProperties(this, {
      count: { value: null, writable: true },
      state: { value: null, writable: true },
      command: { value: null, writable: true },
      columns: { value: null, writable: true },
      statement: { value: null, writable: true }
    });
  }
  static get [Symbol.species]() {
    return Array;
  }
};

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/queue.js
var queue_default = Queue;
function Queue(initial = []) {
  let xs = initial.slice();
  let index4 = 0;
  return {
    get length() {
      return xs.length - index4;
    },
    remove: (x) => {
      const index5 = xs.indexOf(x);
      return index5 === -1 ? null : (xs.splice(index5, 1), x);
    },
    push: (x) => (xs.push(x), x),
    shift: () => {
      const out = xs[index4++];
      if (index4 === xs.length) {
        index4 = 0;
        xs = [];
      } else {
        xs[index4 - 1] = void 0;
      }
      return out;
    }
  };
}

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/bytes.js
var size = 256;
var buffer = Buffer.allocUnsafe(size);
var messages = "BCcDdEFfHPpQSX".split("").reduce((acc, x) => {
  const v = x.charCodeAt(0);
  acc[x] = () => {
    buffer[0] = v;
    b.i = 5;
    return b;
  };
  return acc;
}, {});
var b = Object.assign(reset, messages, {
  N: String.fromCharCode(0),
  i: 0,
  inc(x) {
    b.i += x;
    return b;
  },
  str(x) {
    const length = Buffer.byteLength(x);
    fit(length);
    b.i += buffer.write(x, b.i, length, "utf8");
    return b;
  },
  i16(x) {
    fit(2);
    buffer.writeUInt16BE(x, b.i);
    b.i += 2;
    return b;
  },
  i32(x, i) {
    if (i || i === 0) {
      buffer.writeUInt32BE(x, i);
      return b;
    }
    fit(4);
    buffer.writeUInt32BE(x, b.i);
    b.i += 4;
    return b;
  },
  z(x) {
    fit(x);
    buffer.fill(0, b.i, b.i + x);
    b.i += x;
    return b;
  },
  raw(x) {
    buffer = Buffer.concat([buffer.subarray(0, b.i), x]);
    b.i = buffer.length;
    return b;
  },
  end(at = 1) {
    buffer.writeUInt32BE(b.i - at, at);
    const out = buffer.subarray(0, b.i);
    b.i = 0;
    buffer = Buffer.allocUnsafe(size);
    return out;
  }
});
var bytes_default = b;
function fit(x) {
  if (buffer.length - b.i < x) {
    const prev = buffer, length = prev.length;
    buffer = Buffer.allocUnsafe(length + (length >> 1) + x);
    prev.copy(buffer);
  }
}
function reset() {
  b.i = 0;
  return b;
}

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/connection.js
var connection_default = Connection;
var uid = 1;
var Sync = bytes_default().S().end();
var Flush = bytes_default().H().end();
var SSLRequest = bytes_default().i32(8).i32(80877103).end(8);
var ExecuteUnnamed = Buffer.concat([bytes_default().E().str(bytes_default.N).i32(0).end(), Sync]);
var DescribeUnnamed = bytes_default().D().str("S").str(bytes_default.N).end();
var noop = () => {
};
var retryRoutines = /* @__PURE__ */ new Set([
  "FetchPreparedStatement",
  "RevalidateCachedQuery",
  "transformAssignedExpr"
]);
var errorFields = {
  83: "severity_local",
  // S
  86: "severity",
  // V
  67: "code",
  // C
  77: "message",
  // M
  68: "detail",
  // D
  72: "hint",
  // H
  80: "position",
  // P
  112: "internal_position",
  // p
  113: "internal_query",
  // q
  87: "where",
  // W
  115: "schema_name",
  // s
  116: "table_name",
  // t
  99: "column_name",
  // c
  100: "data type_name",
  // d
  110: "constraint_name",
  // n
  70: "file",
  // F
  76: "line",
  // L
  82: "routine"
  // R
};
function Connection(options, queues = {}, { onopen = noop, onend = noop, onclose = noop } = {}) {
  const {
    sslnegotiation,
    ssl,
    max,
    user,
    host,
    port,
    database,
    parsers: parsers2,
    transform,
    onnotice,
    onnotify,
    onparameter,
    max_pipeline,
    keep_alive,
    backoff: backoff2,
    target_session_attrs
  } = options;
  const sent = queue_default(), id = uid++, backend = { pid: null, secret: null }, idleTimer = timer(end, options.idle_timeout), lifeTimer = timer(end, options.max_lifetime), connectTimer = timer(connectTimedOut, options.connect_timeout);
  let socket = null, cancelMessage, errorResponse = null, result = new Result(), incoming = Buffer.alloc(0), needsTypes = options.fetch_types, backendParameters = {}, statements = {}, statementId = Math.random().toString(36).slice(2), statementCount = 1, closedTime = 0, remaining = 0, hostIndex = 0, retries = 0, length = 0, delay = 0, rows = 0, serverSignature = null, nextWriteTimer = null, terminated = false, incomings = null, results = null, initial = null, ending = null, stream = null, chunk = null, ended = null, nonce = null, query = null, final = null;
  const connection2 = {
    queue: queues.closed,
    idleTimer,
    connect(query2) {
      initial = query2;
      reconnect();
    },
    terminate,
    execute,
    cancel,
    end,
    count: 0,
    id
  };
  queues.closed && queues.closed.push(connection2);
  return connection2;
  async function createSocket() {
    let x;
    try {
      x = options.socket ? await Promise.resolve(options.socket(options)) : new net.Socket();
    } catch (e) {
      error(e);
      return;
    }
    x.on("error", error);
    x.on("close", closed);
    x.on("drain", drain);
    return x;
  }
  async function cancel({ pid, secret }, resolve, reject) {
    try {
      cancelMessage = bytes_default().i32(16).i32(80877102).i32(pid).i32(secret).end(16);
      await connect();
      socket.once("error", reject);
      socket.once("close", resolve);
    } catch (error2) {
      reject(error2);
    }
  }
  function execute(q) {
    if (terminated)
      return queryError(q, Errors.connection("CONNECTION_DESTROYED", options));
    if (stream)
      return queryError(q, Errors.generic("COPY_IN_PROGRESS", "You cannot execute queries during copy"));
    if (q.cancelled)
      return;
    try {
      q.state = backend;
      query ? sent.push(q) : (query = q, query.active = true);
      build(q);
      return write(toBuffer(q)) && !q.describeFirst && !q.cursorFn && sent.length < max_pipeline && (!q.options.onexecute || q.options.onexecute(connection2));
    } catch (error2) {
      sent.length === 0 && write(Sync);
      errored(error2);
      return true;
    }
  }
  function toBuffer(q) {
    if (q.parameters.length >= 65534)
      throw Errors.generic("MAX_PARAMETERS_EXCEEDED", "Max number of parameters (65534) exceeded");
    return q.options.simple ? bytes_default().Q().str(q.statement.string + bytes_default.N).end() : q.describeFirst ? Buffer.concat([describe(q), Flush]) : q.prepare ? q.prepared ? prepared(q) : Buffer.concat([describe(q), prepared(q)]) : unnamed(q);
  }
  function describe(q) {
    return Buffer.concat([
      Parse(q.statement.string, q.parameters, q.statement.types, q.statement.name),
      Describe("S", q.statement.name)
    ]);
  }
  function prepared(q) {
    return Buffer.concat([
      Bind(q.parameters, q.statement.types, q.statement.name, q.cursorName),
      q.cursorFn ? Execute("", q.cursorRows) : ExecuteUnnamed
    ]);
  }
  function unnamed(q) {
    return Buffer.concat([
      Parse(q.statement.string, q.parameters, q.statement.types),
      DescribeUnnamed,
      prepared(q)
    ]);
  }
  function build(q) {
    const parameters = [], types2 = [];
    const string = stringify(q, q.strings[0], q.args[0], parameters, types2, options);
    !q.tagged && q.args.forEach((x) => handleValue(x, parameters, types2, options));
    q.prepare = options.prepare && ("prepare" in q.options ? q.options.prepare : true);
    q.string = string;
    q.signature = q.prepare && types2 + string;
    q.onlyDescribe && delete statements[q.signature];
    q.parameters = q.parameters || parameters;
    q.prepared = q.prepare && q.signature in statements;
    q.describeFirst = q.onlyDescribe || parameters.length && !q.prepared;
    q.statement = q.prepared ? statements[q.signature] : { string, types: types2, name: q.prepare ? statementId + statementCount++ : "" };
    typeof options.debug === "function" && options.debug(id, string, parameters, types2);
  }
  function write(x, fn) {
    chunk = chunk ? Buffer.concat([chunk, x]) : Buffer.from(x);
    if (fn || chunk.length >= 1024)
      return nextWrite(fn);
    nextWriteTimer === null && (nextWriteTimer = setImmediate(nextWrite));
    return true;
  }
  function nextWrite(fn) {
    const x = socket.write(chunk, fn);
    nextWriteTimer !== null && clearImmediate(nextWriteTimer);
    chunk = nextWriteTimer = null;
    return x;
  }
  function connectTimedOut() {
    errored(Errors.connection("CONNECT_TIMEOUT", options, socket));
    socket.destroy();
  }
  async function secure() {
    if (sslnegotiation !== "direct") {
      write(SSLRequest);
      const canSSL = await new Promise((r) => socket.once("data", (x) => r(x[0] === 83)));
      if (!canSSL && ssl === "prefer")
        return connected();
    }
    const options2 = {
      socket,
      servername: net.isIP(socket.host) ? void 0 : socket.host
    };
    if (sslnegotiation === "direct")
      options2.ALPNProtocols = ["postgresql"];
    if (ssl === "require" || ssl === "allow" || ssl === "prefer")
      options2.rejectUnauthorized = false;
    else if (typeof ssl === "object")
      Object.assign(options2, ssl);
    socket.removeAllListeners();
    socket = tls.connect(options2);
    socket.on("secureConnect", connected);
    socket.on("error", error);
    socket.on("close", closed);
    socket.on("drain", drain);
  }
  function drain() {
    !query && onopen(connection2);
  }
  function data(x) {
    if (incomings) {
      incomings.push(x);
      remaining -= x.length;
      if (remaining > 0)
        return;
    }
    incoming = incomings ? Buffer.concat(incomings, length - remaining) : incoming.length === 0 ? x : Buffer.concat([incoming, x], incoming.length + x.length);
    while (incoming.length > 4) {
      length = incoming.readUInt32BE(1);
      if (length >= incoming.length) {
        remaining = length - incoming.length;
        incomings = [incoming];
        break;
      }
      try {
        handle(incoming.subarray(0, length + 1));
      } catch (e) {
        query && (query.cursorFn || query.describeFirst) && write(Sync);
        errored(e);
      }
      incoming = incoming.subarray(length + 1);
      remaining = 0;
      incomings = null;
    }
  }
  async function connect() {
    terminated = false;
    backendParameters = {};
    socket || (socket = await createSocket());
    if (!socket)
      return;
    connectTimer.start();
    if (options.socket)
      return ssl ? secure() : connected();
    socket.on("connect", ssl ? secure : connected);
    if (options.path)
      return socket.connect(options.path);
    socket.ssl = ssl;
    socket.connect(port[hostIndex], host[hostIndex]);
    socket.host = host[hostIndex];
    socket.port = port[hostIndex];
    hostIndex = (hostIndex + 1) % port.length;
  }
  function reconnect() {
    setTimeout(connect, closedTime ? Math.max(0, closedTime + delay - performance.now()) : 0);
  }
  function connected() {
    try {
      statements = {};
      needsTypes = options.fetch_types;
      statementId = Math.random().toString(36).slice(2);
      statementCount = 1;
      lifeTimer.start();
      socket.on("data", data);
      keep_alive && socket.setKeepAlive && socket.setKeepAlive(true, 1e3 * keep_alive);
      const s = StartupMessage();
      write(s);
    } catch (err) {
      error(err);
    }
  }
  function error(err) {
    if (connection2.queue === queues.connecting && options.host[retries + 1])
      return;
    errored(err);
    while (sent.length)
      queryError(sent.shift(), err);
  }
  function errored(err) {
    stream && (stream.destroy(err), stream = null);
    query && queryError(query, err);
    initial && (queryError(initial, err), initial = null);
  }
  function queryError(query2, err) {
    if (query2.reserve)
      return query2.reject(err);
    if (!err || typeof err !== "object")
      err = new Error(err);
    "query" in err || "parameters" in err || Object.defineProperties(err, {
      stack: { value: err.stack + query2.origin.replace(/.*\n/, "\n"), enumerable: options.debug },
      query: { value: query2.string, enumerable: options.debug },
      parameters: { value: query2.parameters, enumerable: options.debug },
      args: { value: query2.args, enumerable: options.debug },
      types: { value: query2.statement && query2.statement.types, enumerable: options.debug }
    });
    query2.reject(err);
  }
  function end() {
    return ending || (!connection2.reserved && onend(connection2), !connection2.reserved && !initial && !query && sent.length === 0 ? (terminate(), new Promise((r) => socket && socket.readyState !== "closed" ? socket.once("close", r) : r())) : ending = new Promise((r) => ended = r));
  }
  function terminate() {
    terminated = true;
    if (stream || query || initial || sent.length)
      error(Errors.connection("CONNECTION_DESTROYED", options));
    clearImmediate(nextWriteTimer);
    if (socket) {
      socket.removeListener("data", data);
      socket.removeListener("connect", connected);
      socket.readyState === "open" && socket.end(bytes_default().X().end());
    }
    ended && (ended(), ending = ended = null);
  }
  async function closed(hadError) {
    incoming = Buffer.alloc(0);
    remaining = 0;
    incomings = null;
    clearImmediate(nextWriteTimer);
    socket.removeListener("data", data);
    socket.removeListener("connect", connected);
    idleTimer.cancel();
    lifeTimer.cancel();
    connectTimer.cancel();
    socket.removeAllListeners();
    socket = null;
    if (initial)
      return reconnect();
    !hadError && (query || sent.length) && error(Errors.connection("CONNECTION_CLOSED", options, socket));
    closedTime = performance.now();
    hadError && options.shared.retries++;
    delay = (typeof backoff2 === "function" ? backoff2(options.shared.retries) : backoff2) * 1e3;
    onclose(connection2, Errors.connection("CONNECTION_CLOSED", options, socket));
  }
  function handle(xs, x = xs[0]) {
    (x === 68 ? DataRow : (
      // D
      x === 100 ? CopyData : (
        // d
        x === 65 ? NotificationResponse : (
          // A
          x === 83 ? ParameterStatus : (
            // S
            x === 90 ? ReadyForQuery : (
              // Z
              x === 67 ? CommandComplete : (
                // C
                x === 50 ? BindComplete : (
                  // 2
                  x === 49 ? ParseComplete : (
                    // 1
                    x === 116 ? ParameterDescription : (
                      // t
                      x === 84 ? RowDescription : (
                        // T
                        x === 82 ? Authentication : (
                          // R
                          x === 110 ? NoData : (
                            // n
                            x === 75 ? BackendKeyData : (
                              // K
                              x === 69 ? ErrorResponse : (
                                // E
                                x === 115 ? PortalSuspended : (
                                  // s
                                  x === 51 ? CloseComplete : (
                                    // 3
                                    x === 71 ? CopyInResponse : (
                                      // G
                                      x === 78 ? NoticeResponse : (
                                        // N
                                        x === 72 ? CopyOutResponse : (
                                          // H
                                          x === 99 ? CopyDone : (
                                            // c
                                            x === 73 ? EmptyQueryResponse : (
                                              // I
                                              x === 86 ? FunctionCallResponse : (
                                                // V
                                                x === 118 ? NegotiateProtocolVersion : (
                                                  // v
                                                  x === 87 ? CopyBothResponse : (
                                                    // W
                                                    /* c8 ignore next */
                                                    UnknownMessage
                                                  )
                                                )
                                              )
                                            )
                                          )
                                        )
                                      )
                                    )
                                  )
                                )
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    ))(xs);
  }
  function DataRow(x) {
    let index4 = 7;
    let length2;
    let column;
    let value;
    const row = query.isRaw ? new Array(query.statement.columns.length) : {};
    for (let i = 0; i < query.statement.columns.length; i++) {
      column = query.statement.columns[i];
      length2 = x.readInt32BE(index4);
      index4 += 4;
      value = length2 === -1 ? null : query.isRaw === true ? x.subarray(index4, index4 += length2) : column.parser === void 0 ? x.toString("utf8", index4, index4 += length2) : column.parser.array === true ? column.parser(x.toString("utf8", index4 + 1, index4 += length2)) : column.parser(x.toString("utf8", index4, index4 += length2));
      query.isRaw ? row[i] = query.isRaw === true ? value : transform.value.from ? transform.value.from(value, column) : value : row[column.name] = transform.value.from ? transform.value.from(value, column) : value;
    }
    query.forEachFn ? query.forEachFn(transform.row.from ? transform.row.from(row) : row, result) : result[rows++] = transform.row.from ? transform.row.from(row) : row;
  }
  function ParameterStatus(x) {
    const [k, v] = x.toString("utf8", 5, x.length - 1).split(bytes_default.N);
    backendParameters[k] = v;
    if (options.parameters[k] !== v) {
      options.parameters[k] = v;
      onparameter && onparameter(k, v);
    }
  }
  function ReadyForQuery(x) {
    if (query) {
      if (errorResponse) {
        query.retried ? errored(query.retried) : query.prepared && retryRoutines.has(errorResponse.routine) ? retry(query, errorResponse) : errored(errorResponse);
      } else {
        query.resolve(results || result);
      }
    } else if (errorResponse) {
      errored(errorResponse);
    }
    query = results = errorResponse = null;
    result = new Result();
    connectTimer.cancel();
    if (initial) {
      if (target_session_attrs) {
        if (!backendParameters.in_hot_standby || !backendParameters.default_transaction_read_only)
          return fetchState();
        else if (tryNext(target_session_attrs, backendParameters))
          return terminate();
      }
      if (needsTypes) {
        initial.reserve && (initial = null);
        return fetchArrayTypes();
      }
      initial && !initial.reserve && execute(initial);
      options.shared.retries = retries = 0;
      initial = null;
      return;
    }
    while (sent.length && (query = sent.shift()) && (query.active = true, query.cancelled))
      Connection(options).cancel(query.state, query.cancelled.resolve, query.cancelled.reject);
    if (query)
      return;
    connection2.reserved ? !connection2.reserved.release && x[5] === 73 ? ending ? terminate() : (connection2.reserved = null, onopen(connection2)) : connection2.reserved() : ending ? terminate() : onopen(connection2);
  }
  function CommandComplete(x) {
    rows = 0;
    for (let i = x.length - 1; i > 0; i--) {
      if (x[i] === 32 && x[i + 1] < 58 && result.count === null)
        result.count = +x.toString("utf8", i + 1, x.length - 1);
      if (x[i - 1] >= 65) {
        result.command = x.toString("utf8", 5, i);
        result.state = backend;
        break;
      }
    }
    final && (final(), final = null);
    if (result.command === "BEGIN" && max !== 1 && !connection2.reserved)
      return errored(Errors.generic("UNSAFE_TRANSACTION", "Only use sql.begin, sql.reserved or max: 1"));
    if (query.options.simple)
      return BindComplete();
    if (query.cursorFn) {
      result.count && query.cursorFn(result);
      write(Sync);
    }
  }
  function ParseComplete() {
    query.parsing = false;
  }
  function BindComplete() {
    !result.statement && (result.statement = query.statement);
    result.columns = query.statement.columns;
  }
  function ParameterDescription(x) {
    const length2 = x.readUInt16BE(5);
    for (let i = 0; i < length2; ++i)
      !query.statement.types[i] && (query.statement.types[i] = x.readUInt32BE(7 + i * 4));
    query.prepare && (statements[query.signature] = query.statement);
    query.describeFirst && !query.onlyDescribe && (write(prepared(query)), query.describeFirst = false);
  }
  function RowDescription(x) {
    if (result.command) {
      results = results || [result];
      results.push(result = new Result());
      result.count = null;
      query.statement.columns = null;
    }
    const length2 = x.readUInt16BE(5);
    let index4 = 7;
    let start;
    query.statement.columns = Array(length2);
    for (let i = 0; i < length2; ++i) {
      start = index4;
      while (x[index4++] !== 0) ;
      const table = x.readUInt32BE(index4);
      const number = x.readUInt16BE(index4 + 4);
      const type = x.readUInt32BE(index4 + 6);
      query.statement.columns[i] = {
        name: transform.column.from ? transform.column.from(x.toString("utf8", start, index4 - 1)) : x.toString("utf8", start, index4 - 1),
        parser: parsers2[type],
        table,
        number,
        type
      };
      index4 += 18;
    }
    result.statement = query.statement;
    if (query.onlyDescribe)
      return query.resolve(query.statement), write(Sync);
  }
  async function Authentication(x, type = x.readUInt32BE(5)) {
    (type === 3 ? AuthenticationCleartextPassword : type === 5 ? AuthenticationMD5Password : type === 10 ? SASL : type === 11 ? SASLContinue : type === 12 ? SASLFinal : type !== 0 ? UnknownAuth : noop)(x, type);
  }
  async function AuthenticationCleartextPassword() {
    const payload = await Pass();
    write(
      bytes_default().p().str(payload).z(1).end()
    );
  }
  async function AuthenticationMD5Password(x) {
    const payload = "md5" + await md5(
      Buffer.concat([
        Buffer.from(await md5(await Pass() + user)),
        x.subarray(9)
      ])
    );
    write(
      bytes_default().p().str(payload).z(1).end()
    );
  }
  async function SASL() {
    nonce = (await crypto.randomBytes(18)).toString("base64");
    bytes_default().p().str("SCRAM-SHA-256" + bytes_default.N);
    const i = bytes_default.i;
    write(bytes_default.inc(4).str("n,,n=*,r=" + nonce).i32(bytes_default.i - i - 4, i).end());
  }
  async function SASLContinue(x) {
    const res = x.toString("utf8", 9).split(",").reduce((acc, x2) => (acc[x2[0]] = x2.slice(2), acc), {});
    const saltedPassword = await crypto.pbkdf2Sync(
      await Pass(),
      Buffer.from(res.s, "base64"),
      parseInt(res.i),
      32,
      "sha256"
    );
    const clientKey = await hmac(saltedPassword, "Client Key");
    const auth2 = "n=*,r=" + nonce + ",r=" + res.r + ",s=" + res.s + ",i=" + res.i + ",c=biws,r=" + res.r;
    serverSignature = (await hmac(await hmac(saltedPassword, "Server Key"), auth2)).toString("base64");
    const payload = "c=biws,r=" + res.r + ",p=" + xor(
      clientKey,
      Buffer.from(await hmac(await sha256(clientKey), auth2))
    ).toString("base64");
    write(
      bytes_default().p().str(payload).end()
    );
  }
  function SASLFinal(x) {
    if (x.toString("utf8", 9).split(bytes_default.N, 1)[0].slice(2) === serverSignature)
      return;
    errored(Errors.generic("SASL_SIGNATURE_MISMATCH", "The server did not return the correct signature"));
    socket.destroy();
  }
  function Pass() {
    return Promise.resolve(
      typeof options.pass === "function" ? options.pass() : options.pass
    );
  }
  function NoData() {
    result.statement = query.statement;
    result.statement.columns = [];
    if (query.onlyDescribe)
      return query.resolve(query.statement), write(Sync);
  }
  function BackendKeyData(x) {
    backend.pid = x.readUInt32BE(5);
    backend.secret = x.readUInt32BE(9);
  }
  async function fetchArrayTypes() {
    needsTypes = false;
    const types2 = await new Query([`
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b on b.oid = a.typelem
      where a.typcategory = 'A'
      group by b.oid, b.typarray
      order by b.oid
    `], [], execute);
    types2.forEach(({ oid, typarray }) => addArrayType(oid, typarray));
  }
  function addArrayType(oid, typarray) {
    if (!!options.parsers[typarray] && !!options.serializers[typarray]) return;
    const parser = options.parsers[oid];
    options.shared.typeArrayMap[oid] = typarray;
    options.parsers[typarray] = (xs) => arrayParser(xs, parser, typarray);
    options.parsers[typarray].array = true;
    options.serializers[typarray] = (xs) => arraySerializer(xs, options.serializers[oid], options, typarray);
  }
  function tryNext(x, xs) {
    return x === "read-write" && xs.default_transaction_read_only === "on" || x === "read-only" && xs.default_transaction_read_only === "off" || x === "primary" && xs.in_hot_standby === "on" || x === "standby" && xs.in_hot_standby === "off" || x === "prefer-standby" && xs.in_hot_standby === "off" && options.host[retries];
  }
  function fetchState() {
    const query2 = new Query([`
      show transaction_read_only;
      select pg_catalog.pg_is_in_recovery()
    `], [], execute, null, { simple: true });
    query2.resolve = ([[a], [b2]]) => {
      backendParameters.default_transaction_read_only = a.transaction_read_only;
      backendParameters.in_hot_standby = b2.pg_is_in_recovery ? "on" : "off";
    };
    query2.execute();
  }
  function ErrorResponse(x) {
    if (query) {
      (query.cursorFn || query.describeFirst) && write(Sync);
      errorResponse = Errors.postgres(parseError(x));
    } else {
      errored(Errors.postgres(parseError(x)));
    }
  }
  function retry(q, error2) {
    delete statements[q.signature];
    q.retried = error2;
    execute(q);
  }
  function NotificationResponse(x) {
    if (!onnotify)
      return;
    let index4 = 9;
    while (x[index4++] !== 0) ;
    onnotify(
      x.toString("utf8", 9, index4 - 1),
      x.toString("utf8", index4, x.length - 1)
    );
  }
  async function PortalSuspended() {
    try {
      const x = await Promise.resolve(query.cursorFn(result));
      rows = 0;
      x === CLOSE ? write(Close(query.portal)) : (result = new Result(), write(Execute("", query.cursorRows)));
    } catch (err) {
      write(Sync);
      query.reject(err);
    }
  }
  function CloseComplete() {
    result.count && query.cursorFn(result);
    query.resolve(result);
  }
  function CopyInResponse() {
    stream = new Stream.Writable({
      autoDestroy: true,
      write(chunk2, encoding, callback) {
        socket.write(bytes_default().d().raw(chunk2).end(), callback);
      },
      destroy(error2, callback) {
        callback(error2);
        socket.write(bytes_default().f().str(error2 + bytes_default.N).end());
        stream = null;
      },
      final(callback) {
        socket.write(bytes_default().c().end());
        final = callback;
        stream = null;
      }
    });
    query.resolve(stream);
  }
  function CopyOutResponse() {
    stream = new Stream.Readable({
      read() {
        socket.resume();
      }
    });
    query.resolve(stream);
  }
  function CopyBothResponse() {
    stream = new Stream.Duplex({
      autoDestroy: true,
      read() {
        socket.resume();
      },
      /* c8 ignore next 11 */
      write(chunk2, encoding, callback) {
        socket.write(bytes_default().d().raw(chunk2).end(), callback);
      },
      destroy(error2, callback) {
        callback(error2);
        socket.write(bytes_default().f().str(error2 + bytes_default.N).end());
        stream = null;
      },
      final(callback) {
        socket.write(bytes_default().c().end());
        final = callback;
      }
    });
    query.resolve(stream);
  }
  function CopyData(x) {
    stream && (stream.push(x.subarray(5)) || socket.pause());
  }
  function CopyDone() {
    stream && stream.push(null);
    stream = null;
  }
  function NoticeResponse(x) {
    onnotice ? onnotice(parseError(x)) : console.log(parseError(x));
  }
  function EmptyQueryResponse() {
  }
  function FunctionCallResponse() {
    errored(Errors.notSupported("FunctionCallResponse"));
  }
  function NegotiateProtocolVersion() {
    errored(Errors.notSupported("NegotiateProtocolVersion"));
  }
  function UnknownMessage(x) {
    console.error("Postgres.js : Unknown Message:", x[0]);
  }
  function UnknownAuth(x, type) {
    console.error("Postgres.js : Unknown Auth:", type);
  }
  function Bind(parameters, types2, statement = "", portal = "") {
    let prev, type;
    bytes_default().B().str(portal + bytes_default.N).str(statement + bytes_default.N).i16(0).i16(parameters.length);
    parameters.forEach((x, i) => {
      if (x === null)
        return bytes_default.i32(4294967295);
      type = types2[i];
      parameters[i] = x = type in options.serializers ? options.serializers[type](x) : "" + x;
      prev = bytes_default.i;
      bytes_default.inc(4).str(x).i32(bytes_default.i - prev - 4, prev);
    });
    bytes_default.i16(0);
    return bytes_default.end();
  }
  function Parse(str, parameters, types2, name = "") {
    bytes_default().P().str(name + bytes_default.N).str(str + bytes_default.N).i16(parameters.length);
    parameters.forEach((x, i) => bytes_default.i32(types2[i] || 0));
    return bytes_default.end();
  }
  function Describe(x, name = "") {
    return bytes_default().D().str(x).str(name + bytes_default.N).end();
  }
  function Execute(portal = "", rows2 = 0) {
    return Buffer.concat([
      bytes_default().E().str(portal + bytes_default.N).i32(rows2).end(),
      Flush
    ]);
  }
  function Close(portal = "") {
    return Buffer.concat([
      bytes_default().C().str("P").str(portal + bytes_default.N).end(),
      bytes_default().S().end()
    ]);
  }
  function StartupMessage() {
    return cancelMessage || bytes_default().inc(4).i16(3).z(2).str(
      Object.entries(Object.assign(
        {
          user,
          database,
          client_encoding: "UTF8"
        },
        options.connection
      )).filter(([, v]) => v).map(([k, v]) => k + bytes_default.N + v).join(bytes_default.N)
    ).z(2).end(0);
  }
}
function parseError(x) {
  const error = {};
  let start = 5;
  for (let i = 5; i < x.length - 1; i++) {
    if (x[i] === 0) {
      error[errorFields[x[start]]] = x.toString("utf8", start + 1, i);
      start = i + 1;
    }
  }
  return error;
}
function md5(x) {
  return crypto.createHash("md5").update(x).digest("hex");
}
function hmac(key, x) {
  return crypto.createHmac("sha256", key).update(x).digest();
}
function sha256(x) {
  return crypto.createHash("sha256").update(x).digest();
}
function xor(a, b2) {
  const length = Math.max(a.length, b2.length);
  const buffer2 = Buffer.allocUnsafe(length);
  for (let i = 0; i < length; i++)
    buffer2[i] = a[i] ^ b2[i];
  return buffer2;
}
function timer(fn, seconds) {
  seconds = typeof seconds === "function" ? seconds() : seconds;
  if (!seconds)
    return { cancel: noop, start: noop };
  let timer2;
  return {
    cancel() {
      timer2 && (clearTimeout(timer2), timer2 = null);
    },
    start() {
      timer2 && clearTimeout(timer2);
      timer2 = setTimeout(done, seconds * 1e3, arguments);
    }
  };
  function done(args) {
    fn.apply(null, args);
    timer2 = null;
  }
}

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/subscribe.js
var noop2 = () => {
};
function Subscribe(postgres2, options) {
  const subscribers = /* @__PURE__ */ new Map(), slot = "postgresjs_" + Math.random().toString(36).slice(2), state = {};
  let connection2, stream, ended = false;
  const sql6 = subscribe.sql = postgres2({
    ...options,
    transform: { column: {}, value: {}, row: {} },
    max: 1,
    fetch_types: false,
    idle_timeout: null,
    max_lifetime: null,
    connection: {
      ...options.connection,
      replication: "database"
    },
    onclose: async function() {
      if (ended)
        return;
      stream = null;
      state.pid = state.secret = void 0;
      connected(await init(sql6, slot, options.publications));
      subscribers.forEach((event) => event.forEach(({ onsubscribe }) => onsubscribe()));
    },
    no_subscribe: true
  });
  const end = sql6.end, close = sql6.close;
  sql6.end = async () => {
    ended = true;
    stream && await new Promise((r) => (stream.once("close", r), stream.end()));
    return end();
  };
  sql6.close = async () => {
    stream && await new Promise((r) => (stream.once("close", r), stream.end()));
    return close();
  };
  return subscribe;
  async function subscribe(event, fn, onsubscribe = noop2, onerror = noop2) {
    event = parseEvent(event);
    if (!connection2)
      connection2 = init(sql6, slot, options.publications);
    const subscriber = { fn, onsubscribe };
    const fns = subscribers.has(event) ? subscribers.get(event).add(subscriber) : subscribers.set(event, /* @__PURE__ */ new Set([subscriber])).get(event);
    const unsubscribe = () => {
      fns.delete(subscriber);
      fns.size === 0 && subscribers.delete(event);
    };
    return connection2.then((x) => {
      connected(x);
      onsubscribe();
      stream && stream.on("error", onerror);
      return { unsubscribe, state, sql: sql6 };
    });
  }
  function connected(x) {
    stream = x.stream;
    state.pid = x.state.pid;
    state.secret = x.state.secret;
  }
  async function init(sql7, slot2, publications) {
    if (!publications)
      throw new Error("Missing publication names");
    const xs = await sql7.unsafe(
      `CREATE_REPLICATION_SLOT ${slot2} TEMPORARY LOGICAL pgoutput NOEXPORT_SNAPSHOT`
    );
    const [x] = xs;
    const stream2 = await sql7.unsafe(
      `START_REPLICATION SLOT ${slot2} LOGICAL ${x.consistent_point} (proto_version '1', publication_names '${publications}')`
    ).writable();
    const state2 = {
      lsn: Buffer.concat(x.consistent_point.split("/").map((x2) => Buffer.from(("00000000" + x2).slice(-8), "hex")))
    };
    stream2.on("data", data);
    stream2.on("error", error);
    stream2.on("close", sql7.close);
    return { stream: stream2, state: xs.state };
    function error(e) {
      console.error("Unexpected error during logical streaming - reconnecting", e);
    }
    function data(x2) {
      if (x2[0] === 119) {
        parse(x2.subarray(25), state2, sql7.options.parsers, handle, options.transform);
      } else if (x2[0] === 107 && x2[17]) {
        state2.lsn = x2.subarray(1, 9);
        pong();
      }
    }
    function handle(a, b2) {
      const path = b2.relation.schema + "." + b2.relation.table;
      call("*", a, b2);
      call("*:" + path, a, b2);
      b2.relation.keys.length && call("*:" + path + "=" + b2.relation.keys.map((x2) => a[x2.name]), a, b2);
      call(b2.command, a, b2);
      call(b2.command + ":" + path, a, b2);
      b2.relation.keys.length && call(b2.command + ":" + path + "=" + b2.relation.keys.map((x2) => a[x2.name]), a, b2);
    }
    function pong() {
      const x2 = Buffer.alloc(34);
      x2[0] = "r".charCodeAt(0);
      x2.fill(state2.lsn, 1);
      x2.writeBigInt64BE(BigInt(Date.now() - Date.UTC(2e3, 0, 1)) * BigInt(1e3), 25);
      stream2.write(x2);
    }
  }
  function call(x, a, b2) {
    subscribers.has(x) && subscribers.get(x).forEach(({ fn }) => fn(a, b2, x));
  }
}
function Time(x) {
  return new Date(Date.UTC(2e3, 0, 1) + Number(x / BigInt(1e3)));
}
function parse(x, state, parsers2, handle, transform) {
  const char = (acc, [k, v]) => (acc[k.charCodeAt(0)] = v, acc);
  Object.entries({
    R: (x2) => {
      let i = 1;
      const r = state[x2.readUInt32BE(i)] = {
        schema: x2.toString("utf8", i += 4, i = x2.indexOf(0, i)) || "pg_catalog",
        table: x2.toString("utf8", i + 1, i = x2.indexOf(0, i + 1)),
        columns: Array(x2.readUInt16BE(i += 2)),
        keys: []
      };
      i += 2;
      let columnIndex = 0, column;
      while (i < x2.length) {
        column = r.columns[columnIndex++] = {
          key: x2[i++],
          name: transform.column.from ? transform.column.from(x2.toString("utf8", i, i = x2.indexOf(0, i))) : x2.toString("utf8", i, i = x2.indexOf(0, i)),
          type: x2.readUInt32BE(i += 1),
          parser: parsers2[x2.readUInt32BE(i)],
          atttypmod: x2.readUInt32BE(i += 4)
        };
        column.key && r.keys.push(column);
        i += 4;
      }
    },
    Y: () => {
    },
    // Type
    O: () => {
    },
    // Origin
    B: (x2) => {
      state.date = Time(x2.readBigInt64BE(9));
      state.lsn = x2.subarray(1, 9);
    },
    I: (x2) => {
      let i = 1;
      const relation = state[x2.readUInt32BE(i)];
      const { row } = tuples(x2, relation.columns, i += 7, transform);
      handle(row, {
        command: "insert",
        relation
      });
    },
    D: (x2) => {
      let i = 1;
      const relation = state[x2.readUInt32BE(i)];
      i += 4;
      const key = x2[i] === 75;
      handle(
        key || x2[i] === 79 ? tuples(x2, relation.columns, i += 3, transform).row : null,
        {
          command: "delete",
          relation,
          key
        }
      );
    },
    U: (x2) => {
      let i = 1;
      const relation = state[x2.readUInt32BE(i)];
      i += 4;
      const key = x2[i] === 75;
      const xs = key || x2[i] === 79 ? tuples(x2, relation.columns, i += 3, transform) : null;
      xs && (i = xs.i);
      const { row } = tuples(x2, relation.columns, i + 3, transform);
      handle(row, {
        command: "update",
        relation,
        key,
        old: xs && xs.row
      });
    },
    T: () => {
    },
    // Truncate,
    C: () => {
    }
    // Commit
  }).reduce(char, {})[x[0]](x);
}
function tuples(x, columns, xi, transform) {
  let type, column, value;
  const row = transform.raw ? new Array(columns.length) : {};
  for (let i = 0; i < columns.length; i++) {
    type = x[xi++];
    column = columns[i];
    value = type === 110 ? null : type === 117 ? void 0 : column.parser === void 0 ? x.toString("utf8", xi + 4, xi += 4 + x.readUInt32BE(xi)) : column.parser.array === true ? column.parser(x.toString("utf8", xi + 5, xi += 4 + x.readUInt32BE(xi))) : column.parser(x.toString("utf8", xi + 4, xi += 4 + x.readUInt32BE(xi)));
    transform.raw ? row[i] = transform.raw === true ? value : transform.value.from ? transform.value.from(value, column) : value : row[column.name] = transform.value.from ? transform.value.from(value, column) : value;
  }
  return { i: xi, row: transform.row.from ? transform.row.from(row) : row };
}
function parseEvent(x) {
  const xs = x.match(/^(\*|insert|update|delete)?:?([^.]+?\.?[^=]+)?=?(.+)?/i) || [];
  if (!xs)
    throw new Error("Malformed subscribe pattern: " + x);
  const [, command, path, key] = xs;
  return (command || "*") + (path ? ":" + (path.indexOf(".") === -1 ? "public." + path : path) : "") + (key ? "=" + key : "");
}

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/large.js
import Stream2 from "stream";
function largeObject(sql6, oid, mode = 131072 | 262144) {
  return new Promise(async (resolve, reject) => {
    await sql6.begin(async (sql7) => {
      let finish;
      !oid && ([{ oid }] = await sql7`select lo_creat(-1) as oid`);
      const [{ fd }] = await sql7`select lo_open(${oid}, ${mode}) as fd`;
      const lo = {
        writable,
        readable,
        close: () => sql7`select lo_close(${fd})`.then(finish),
        tell: () => sql7`select lo_tell64(${fd})`,
        read: (x) => sql7`select loread(${fd}, ${x}) as data`,
        write: (x) => sql7`select lowrite(${fd}, ${x})`,
        truncate: (x) => sql7`select lo_truncate64(${fd}, ${x})`,
        seek: (x, whence = 0) => sql7`select lo_lseek64(${fd}, ${x}, ${whence})`,
        size: () => sql7`
          select
            lo_lseek64(${fd}, location, 0) as position,
            seek.size
          from (
            select
              lo_lseek64($1, 0, 2) as size,
              tell.location
            from (select lo_tell64($1) as location) tell
          ) seek
        `
      };
      resolve(lo);
      return new Promise(async (r) => finish = r);
      async function readable({
        highWaterMark = 2048 * 8,
        start = 0,
        end = Infinity
      } = {}) {
        let max = end - start;
        start && await lo.seek(start);
        return new Stream2.Readable({
          highWaterMark,
          async read(size2) {
            const l = size2 > max ? size2 - max : size2;
            max -= size2;
            const [{ data }] = await lo.read(l);
            this.push(data);
            if (data.length < size2)
              this.push(null);
          }
        });
      }
      async function writable({
        highWaterMark = 2048 * 8,
        start = 0
      } = {}) {
        start && await lo.seek(start);
        return new Stream2.Writable({
          highWaterMark,
          write(chunk, encoding, callback) {
            lo.write(chunk).then(() => callback(), callback);
          }
        });
      }
    }).catch(reject);
  });
}

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/index.js
Object.assign(Postgres, {
  PostgresError,
  toPascal,
  pascal,
  toCamel,
  camel,
  toKebab,
  kebab,
  fromPascal,
  fromCamel,
  fromKebab,
  BigInt: {
    to: 20,
    from: [20],
    parse: (x) => BigInt(x),
    // eslint-disable-line
    serialize: (x) => x.toString()
  }
});
var src_default = Postgres;
function Postgres(a, b2) {
  const options = parseOptions(a, b2), subscribe = options.no_subscribe || Subscribe(Postgres, { ...options });
  let ending = false;
  const queries = queue_default(), connecting = queue_default(), reserved = queue_default(), closed = queue_default(), ended = queue_default(), open = queue_default(), busy = queue_default(), full = queue_default(), queues = { connecting, reserved, closed, ended, open, busy, full };
  const connections = [...Array(options.max)].map(() => connection_default(options, queues, { onopen, onend, onclose }));
  const sql6 = Sql(handler);
  Object.assign(sql6, {
    get parameters() {
      return options.parameters;
    },
    largeObject: largeObject.bind(null, sql6),
    subscribe,
    CLOSE,
    END: CLOSE,
    PostgresError,
    options,
    reserve,
    listen,
    begin,
    close,
    end
  });
  return sql6;
  function Sql(handler2) {
    handler2.debug = options.debug;
    Object.entries(options.types).reduce((acc, [name, type]) => {
      acc[name] = (x) => new Parameter(x, type.to);
      return acc;
    }, typed);
    Object.assign(sql7, {
      types: typed,
      typed,
      unsafe,
      notify,
      array,
      json,
      file
    });
    return sql7;
    function typed(value, type) {
      return new Parameter(value, type);
    }
    function sql7(strings, ...args) {
      const query = strings && Array.isArray(strings.raw) ? new Query(strings, args, handler2, cancel) : typeof strings === "string" && !args.length ? new Identifier(options.transform.column.to ? options.transform.column.to(strings) : strings) : new Builder(strings, args);
      return query;
    }
    function unsafe(string, args = [], options2 = {}) {
      arguments.length === 2 && !Array.isArray(args) && (options2 = args, args = []);
      const query = new Query([string], args, handler2, cancel, {
        prepare: false,
        ...options2,
        simple: "simple" in options2 ? options2.simple : args.length === 0
      });
      return query;
    }
    function file(path, args = [], options2 = {}) {
      arguments.length === 2 && !Array.isArray(args) && (options2 = args, args = []);
      const query = new Query([], args, (query2) => {
        fs.readFile(path, "utf8", (err, string) => {
          if (err)
            return query2.reject(err);
          query2.strings = [string];
          handler2(query2);
        });
      }, cancel, {
        ...options2,
        simple: "simple" in options2 ? options2.simple : args.length === 0
      });
      return query;
    }
  }
  async function listen(name, fn, onlisten) {
    const listener = { fn, onlisten };
    const sql7 = listen.sql || (listen.sql = Postgres({
      ...options,
      max: 1,
      idle_timeout: null,
      max_lifetime: null,
      fetch_types: false,
      onclose() {
        Object.entries(listen.channels).forEach(([name2, { listeners }]) => {
          delete listen.channels[name2];
          Promise.all(listeners.map((l) => listen(name2, l.fn, l.onlisten).catch(() => {
          })));
        });
      },
      onnotify(c, x) {
        c in listen.channels && listen.channels[c].listeners.forEach((l) => l.fn(x));
      }
    }));
    const channels = listen.channels || (listen.channels = {}), exists = name in channels;
    if (exists) {
      channels[name].listeners.push(listener);
      const result2 = await channels[name].result;
      listener.onlisten && listener.onlisten();
      return { state: result2.state, unlisten };
    }
    channels[name] = { result: sql7`listen ${sql7.unsafe('"' + name.replace(/"/g, '""') + '"')}`, listeners: [listener] };
    const result = await channels[name].result;
    listener.onlisten && listener.onlisten();
    return { state: result.state, unlisten };
    async function unlisten() {
      if (name in channels === false)
        return;
      channels[name].listeners = channels[name].listeners.filter((x) => x !== listener);
      if (channels[name].listeners.length)
        return;
      delete channels[name];
      return sql7`unlisten ${sql7.unsafe('"' + name.replace(/"/g, '""') + '"')}`;
    }
  }
  async function notify(channel, payload) {
    return await sql6`select pg_notify(${channel}, ${"" + payload})`;
  }
  async function reserve() {
    const queue = queue_default();
    const c = open.length ? open.shift() : await new Promise((resolve, reject) => {
      const query = { reserve: resolve, reject };
      queries.push(query);
      closed.length && connect(closed.shift(), query);
    });
    move(c, reserved);
    c.reserved = () => queue.length ? c.execute(queue.shift()) : move(c, reserved);
    c.reserved.release = true;
    const sql7 = Sql(handler2);
    sql7.release = () => {
      c.reserved = null;
      onopen(c);
    };
    return sql7;
    function handler2(q) {
      c.queue === full ? queue.push(q) : c.execute(q) || move(c, full);
    }
  }
  async function begin(options2, fn) {
    !fn && (fn = options2, options2 = "");
    const queries2 = queue_default();
    let savepoints = 0, connection2, prepare = null;
    try {
      await sql6.unsafe("begin " + options2.replace(/[^a-z ]/ig, ""), [], { onexecute }).execute();
      return await Promise.race([
        scope(connection2, fn),
        new Promise((_, reject) => connection2.onclose = reject)
      ]);
    } catch (error) {
      throw error;
    }
    async function scope(c, fn2, name) {
      const sql7 = Sql(handler2);
      sql7.savepoint = savepoint;
      sql7.prepare = (x) => prepare = x.replace(/[^a-z0-9$-_. ]/gi);
      let uncaughtError, result;
      name && await sql7`savepoint ${sql7(name)}`;
      try {
        result = await new Promise((resolve, reject) => {
          const x = fn2(sql7);
          Promise.resolve(Array.isArray(x) ? Promise.all(x) : x).then(resolve, reject);
        });
        if (uncaughtError)
          throw uncaughtError;
      } catch (e) {
        await (name ? sql7`rollback to ${sql7(name)}` : sql7`rollback`);
        throw e instanceof PostgresError && e.code === "25P02" && uncaughtError || e;
      }
      if (!name) {
        prepare ? await sql7`prepare transaction '${sql7.unsafe(prepare)}'` : await sql7`commit`;
      }
      return result;
      function savepoint(name2, fn3) {
        if (name2 && Array.isArray(name2.raw))
          return savepoint((sql8) => sql8.apply(sql8, arguments));
        arguments.length === 1 && (fn3 = name2, name2 = null);
        return scope(c, fn3, "s" + savepoints++ + (name2 ? "_" + name2 : ""));
      }
      function handler2(q) {
        q.catch((e) => uncaughtError || (uncaughtError = e));
        c.queue === full ? queries2.push(q) : c.execute(q) || move(c, full);
      }
    }
    function onexecute(c) {
      connection2 = c;
      move(c, reserved);
      c.reserved = () => queries2.length ? c.execute(queries2.shift()) : move(c, reserved);
    }
  }
  function move(c, queue) {
    c.queue.remove(c);
    queue.push(c);
    c.queue = queue;
    queue === open ? c.idleTimer.start() : c.idleTimer.cancel();
    return c;
  }
  function json(x) {
    return new Parameter(x, 3802);
  }
  function array(x, type) {
    if (!Array.isArray(x))
      return array(Array.from(arguments));
    return new Parameter(x, type || (x.length ? inferType(x) || 25 : 0), options.shared.typeArrayMap);
  }
  function handler(query) {
    if (ending)
      return query.reject(Errors.connection("CONNECTION_ENDED", options, options));
    if (open.length)
      return go(open.shift(), query);
    if (closed.length)
      return connect(closed.shift(), query);
    busy.length ? go(busy.shift(), query) : queries.push(query);
  }
  function go(c, query) {
    return c.execute(query) ? move(c, busy) : move(c, full);
  }
  function cancel(query) {
    return new Promise((resolve, reject) => {
      query.state ? query.active ? connection_default(options).cancel(query.state, resolve, reject) : query.cancelled = { resolve, reject } : (queries.remove(query), query.cancelled = true, query.reject(Errors.generic("57014", "canceling statement due to user request")), resolve());
    });
  }
  async function end({ timeout = null } = {}) {
    if (ending)
      return ending;
    await 1;
    let timer2;
    return ending = Promise.race([
      new Promise((r) => timeout !== null && (timer2 = setTimeout(destroy, timeout * 1e3, r))),
      Promise.all(connections.map((c) => c.end()).concat(
        listen.sql ? listen.sql.end({ timeout: 0 }) : [],
        subscribe.sql ? subscribe.sql.end({ timeout: 0 }) : []
      ))
    ]).then(() => clearTimeout(timer2));
  }
  async function close() {
    await Promise.all(connections.map((c) => c.end()));
  }
  async function destroy(resolve) {
    await Promise.all(connections.map((c) => c.terminate()));
    while (queries.length)
      queries.shift().reject(Errors.connection("CONNECTION_DESTROYED", options));
    resolve();
  }
  function connect(c, query) {
    move(c, connecting);
    c.connect(query);
    return c;
  }
  function onend(c) {
    move(c, ended);
  }
  function onopen(c) {
    if (queries.length === 0)
      return move(c, open);
    let max = Math.ceil(queries.length / (connecting.length + 1)), ready = true;
    while (ready && queries.length && max-- > 0) {
      const query = queries.shift();
      if (query.reserve)
        return query.reserve(c);
      ready = c.execute(query);
    }
    ready ? move(c, busy) : move(c, full);
  }
  function onclose(c, e) {
    move(c, closed);
    c.reserved = null;
    c.onclose && (c.onclose(e), c.onclose = null);
    options.onclose && options.onclose(c.id);
    queries.length && connect(c, queries.shift());
  }
}
function parseOptions(a, b2) {
  if (a && a.shared)
    return a;
  const env = process.env, o = (!a || typeof a === "string" ? b2 : a) || {}, { url, multihost } = parseUrl(a), query = [...url.searchParams].reduce((a2, [b3, c]) => (a2[b3] = c, a2), {}), host = o.hostname || o.host || multihost || url.hostname || env.PGHOST || "localhost", port = o.port || url.port || env.PGPORT || 5432, user = o.user || o.username || url.username || env.PGUSERNAME || env.PGUSER || osUsername();
  o.no_prepare && (o.prepare = false);
  query.sslmode && (query.ssl = query.sslmode, delete query.sslmode);
  "timeout" in o && (console.log("The timeout option is deprecated, use idle_timeout instead"), o.idle_timeout = o.timeout);
  query.sslrootcert === "system" && (query.ssl = "verify-full");
  const ints = ["idle_timeout", "connect_timeout", "max_lifetime", "max_pipeline", "backoff", "keep_alive"];
  const defaults = {
    max: globalThis.Cloudflare ? 3 : 10,
    ssl: false,
    sslnegotiation: null,
    idle_timeout: null,
    connect_timeout: 30,
    max_lifetime,
    max_pipeline: 100,
    backoff,
    keep_alive: 60,
    prepare: true,
    debug: false,
    fetch_types: true,
    publications: "alltables",
    target_session_attrs: null
  };
  return {
    host: Array.isArray(host) ? host : host.split(",").map((x) => x.split(":")[0]),
    port: Array.isArray(port) ? port : host.split(",").map((x) => parseInt(x.split(":")[1] || port)),
    path: o.path || host.indexOf("/") > -1 && host + "/.s.PGSQL." + port,
    database: o.database || o.db || (url.pathname || "").slice(1) || env.PGDATABASE || user,
    user,
    pass: o.pass || o.password || url.password || env.PGPASSWORD || "",
    ...Object.entries(defaults).reduce(
      (acc, [k, d]) => {
        const value = k in o ? o[k] : k in query ? query[k] === "disable" || query[k] === "false" ? false : query[k] : env["PG" + k.toUpperCase()] || d;
        acc[k] = typeof value === "string" && ints.includes(k) ? +value : value;
        return acc;
      },
      {}
    ),
    connection: {
      application_name: env.PGAPPNAME || "postgres.js",
      ...o.connection,
      ...Object.entries(query).reduce((acc, [k, v]) => (k in defaults || (acc[k] = v), acc), {})
    },
    types: o.types || {},
    target_session_attrs: tsa(o, url, env),
    onnotice: o.onnotice,
    onnotify: o.onnotify,
    onclose: o.onclose,
    onparameter: o.onparameter,
    socket: o.socket,
    transform: parseTransform(o.transform || { undefined: void 0 }),
    parameters: {},
    shared: { retries: 0, typeArrayMap: {} },
    ...mergeUserTypes(o.types)
  };
}
function tsa(o, url, env) {
  const x = o.target_session_attrs || url.searchParams.get("target_session_attrs") || env.PGTARGETSESSIONATTRS;
  if (!x || ["read-write", "read-only", "primary", "standby", "prefer-standby"].includes(x))
    return x;
  throw new Error("target_session_attrs " + x + " is not supported");
}
function backoff(retries) {
  return (0.5 + Math.random() / 2) * Math.min(3 ** retries / 100, 20);
}
function max_lifetime() {
  return 60 * (30 + Math.random() * 30);
}
function parseTransform(x) {
  return {
    undefined: x.undefined,
    column: {
      from: typeof x.column === "function" ? x.column : x.column && x.column.from,
      to: x.column && x.column.to
    },
    value: {
      from: typeof x.value === "function" ? x.value : x.value && x.value.from,
      to: x.value && x.value.to
    },
    row: {
      from: typeof x.row === "function" ? x.row : x.row && x.row.from,
      to: x.row && x.row.to
    }
  };
}
function parseUrl(url) {
  if (!url || typeof url !== "string")
    return { url: { searchParams: /* @__PURE__ */ new Map() } };
  let host = url;
  host = host.slice(host.indexOf("://") + 3).split(/[?/]/)[0];
  host = decodeURIComponent(host.slice(host.indexOf("@") + 1));
  const urlObj = new URL(url.replace(host, host.split(",")[0]));
  return {
    url: {
      username: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      host: urlObj.host,
      hostname: urlObj.hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      searchParams: urlObj.searchParams
    },
    multihost: host.indexOf(",") > -1 && host
  };
}
function osUsername() {
  try {
    return os.userInfo().username;
  } catch (_) {
    return process.env.USERNAME || process.env.USER || process.env.LOGNAME;
  }
}

// ../../packages/db/src/schema/index.ts
var schema_exports = {};
__export(schema_exports, {
  actorTypeEnum: () => actorTypeEnum,
  actors: () => actors,
  actorsRelations: () => actorsRelations,
  auditActionEnum: () => auditActionEnum,
  auditEntityEnum: () => auditEntityEnum,
  auditLogs: () => auditLogs,
  authAccount: () => authAccount,
  authSession: () => authSession,
  authUser: () => authUser,
  authVerification: () => authVerification,
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  currencyCodeEnum: () => currencyCodeEnum,
  invitations: () => invitations,
  invoiceItems: () => invoiceItems,
  invoiceItemsRelations: () => invoiceItemsRelations,
  invoiceSettings: () => invoiceSettings,
  invoiceSettingsRelations: () => invoiceSettingsRelations,
  invoiceStatusEnum: () => invoiceStatusEnum,
  invoices: () => invoices,
  invoicesRelations: () => invoicesRelations,
  milestoneStatusEnum: () => milestoneStatusEnum,
  milestones: () => milestones,
  milestonesRelations: () => milestonesRelations,
  phaseStatusEnum: () => phaseStatusEnum,
  phases: () => phases,
  phasesRelations: () => phasesRelations,
  projectActors: () => projectActors,
  projectActorsRelations: () => projectActorsRelations,
  projectHealthEnum: () => projectHealthEnum,
  projectMembers: () => projectMembers,
  projectMembersRelations: () => projectMembersRelations,
  projectPriorityEnum: () => projectPriorityEnum,
  projectStatusEnum: () => projectStatusEnum,
  projectVisibilityEnum: () => projectVisibilityEnum,
  projects: () => projects,
  projectsRelations: () => projectsRelations,
  taskStatusEnum: () => taskStatusEnum,
  tasks: () => tasks,
  tasksRelations: () => tasksRelations,
  transactionCategoryEnum: () => transactionCategoryEnum,
  transactionTypeEnum: () => transactionTypeEnum,
  transactions: () => transactions,
  transactionsRelations: () => transactionsRelations,
  workspaceMembers: () => workspaceMembers,
  workspaceRoleEnum: () => workspaceRoleEnum,
  workspaces: () => workspaces,
  workspacesRelations: () => workspacesRelations
});

// ../../packages/db/src/schema/workspace.ts
import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
var currencyCodeEnum = pgEnum("currency_code", [
  "USD",
  "EUR",
  "GBP",
  "MYR",
  "TZS",
  "NGN",
  "KES",
  "GHS",
  "ZAR",
  "INR",
  "AUD",
  "CAD",
  "SGD",
  "AED",
  "SAR",
  "JPY",
  "CNY",
  "BRL",
  "MXN",
  "PKR"
]);
var workspaces = pgTable("workspaces", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  baseCurrency: currencyCodeEnum("base_currency").notNull().default("USD"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var categories = pgTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  icon: text("icon"),
  description: text("description"),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// ../../packages/db/src/schema/users.ts
import { pgTable as pgTable2, text as text2, timestamp as timestamp2, pgEnum as pgEnum2, index } from "drizzle-orm/pg-core";
import { createId as createId2 } from "@paralleldrive/cuid2";
var workspaceRoleEnum = pgEnum2("workspace_role", ["owner", "admin", "member"]);
var workspaceMembers = pgTable2("workspace_members", {
  id: text2("id").primaryKey().$defaultFn(() => createId2()),
  workspaceId: text2("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text2("user_id").notNull(),
  // references Better Auth's user.id
  role: workspaceRoleEnum("role").notNull().default("member"),
  joinedAt: timestamp2("joined_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => [
  index("workspace_members_workspace_id_idx").on(t.workspaceId)
]);
var invitations = pgTable2("invitations", {
  id: text2("id").primaryKey().$defaultFn(() => createId2()),
  workspaceId: text2("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  email: text2("email").notNull(),
  role: workspaceRoleEnum("role").notNull().default("member"),
  token: text2("token").notNull().unique(),
  invitedBy: text2("invited_by").notNull(),
  // references Better Auth's user.id
  expiresAt: timestamp2("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp2("accepted_at", { withTimezone: true }),
  createdAt: timestamp2("created_at", { withTimezone: true }).notNull().defaultNow()
});

// ../../packages/db/src/schema/actors.ts
import { pgTable as pgTable3, text as text3, timestamp as timestamp3, pgEnum as pgEnum3 } from "drizzle-orm/pg-core";
import { createId as createId3 } from "@paralleldrive/cuid2";
var actorTypeEnum = pgEnum3("actor_type", [
  "client",
  "collaborator",
  "vendor",
  "advisor",
  "investor"
]);
var actors = pgTable3("actors", {
  id: text3("id").primaryKey().$defaultFn(() => createId3()),
  workspaceId: text3("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text3("name").notNull(),
  email: text3("email"),
  phone: text3("phone"),
  type: actorTypeEnum("type").notNull(),
  company: text3("company"),
  notes: text3("notes"),
  createdAt: timestamp3("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp3("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// ../../packages/db/src/schema/projects.ts
import {
  pgTable as pgTable4,
  text as text4,
  timestamp as timestamp4,
  boolean as boolean2,
  integer,
  pgEnum as pgEnum4,
  numeric,
  index as index2
} from "drizzle-orm/pg-core";
import { createId as createId4 } from "@paralleldrive/cuid2";
var projectStatusEnum = pgEnum4("project_status", [
  "draft",
  "active",
  "on_hold",
  "completed",
  "cancelled"
]);
var projectHealthEnum = pgEnum4("project_health", [
  "healthy",
  "at_risk",
  "delayed",
  "blocked"
]);
var projectPriorityEnum = pgEnum4("project_priority", [
  "low",
  "medium",
  "high",
  "critical"
]);
var projectVisibilityEnum = pgEnum4("project_visibility", [
  "private",
  "workspace"
]);
var projects = pgTable4("projects", {
  id: text4("id").primaryKey().$defaultFn(() => createId4()),
  workspaceId: text4("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  categoryId: text4("category_id").references(() => categories.id, { onDelete: "set null" }),
  name: text4("name").notNull(),
  slug: text4("slug").notNull(),
  description: text4("description"),
  status: projectStatusEnum("status").notNull().default("draft"),
  health: projectHealthEnum("health").notNull().default("healthy"),
  priority: projectPriorityEnum("priority").notNull().default("medium"),
  visibility: projectVisibilityEnum("visibility").notNull().default("workspace"),
  budget: numeric("budget", { precision: 14, scale: 2 }),
  currency: currencyCodeEnum("currency").notNull().default("USD"),
  tags: text4("tags").array().notNull().default([]),
  startDate: timestamp4("start_date", { withTimezone: true }),
  dueDate: timestamp4("due_date", { withTimezone: true }),
  completedAt: timestamp4("completed_at", { withTimezone: true }),
  archived: boolean2("archived").notNull().default(false),
  ownerId: text4("owner_id").notNull(),
  // Better Auth user.id
  createdBy: text4("created_by").notNull(),
  // Better Auth user.id
  createdAt: timestamp4("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp4("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => [
  index2("projects_workspace_id_idx").on(t.workspaceId),
  index2("projects_workspace_status_idx").on(t.workspaceId, t.status),
  index2("projects_workspace_archived_idx").on(t.workspaceId, t.archived)
]);
var projectActors = pgTable4("project_actors", {
  id: text4("id").primaryKey().$defaultFn(() => createId4()),
  projectId: text4("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  actorId: text4("actor_id").notNull().references(() => actors.id, { onDelete: "cascade" }),
  role: text4("role"),
  joinedAt: timestamp4("joined_at", { withTimezone: true }).notNull().defaultNow()
});
var projectMembers = pgTable4("project_members", {
  id: text4("id").primaryKey().$defaultFn(() => createId4()),
  projectId: text4("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: text4("user_id").notNull(),
  // Better Auth user.id
  role: text4("role"),
  joinedAt: timestamp4("joined_at", { withTimezone: true }).notNull().defaultNow()
});
var phaseStatusEnum = pgEnum4("phase_status", [
  "pending",
  "active",
  "completed",
  "skipped"
]);
var phases = pgTable4("phases", {
  id: text4("id").primaryKey().$defaultFn(() => createId4()),
  projectId: text4("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text4("name").notNull(),
  description: text4("description"),
  status: phaseStatusEnum("status").notNull().default("pending"),
  order: integer("order").notNull().default(0),
  startDate: timestamp4("start_date", { withTimezone: true }),
  dueDate: timestamp4("due_date", { withTimezone: true }),
  completedAt: timestamp4("completed_at", { withTimezone: true }),
  createdAt: timestamp4("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp4("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => [
  index2("phases_project_id_idx").on(t.projectId)
]);
var milestoneStatusEnum = pgEnum4("milestone_status", [
  "open",
  "completed"
]);
var milestones = pgTable4("milestones", {
  id: text4("id").primaryKey().$defaultFn(() => createId4()),
  phaseId: text4("phase_id").notNull().references(() => phases.id, { onDelete: "cascade" }),
  projectId: text4("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text4("name").notNull(),
  description: text4("description"),
  status: milestoneStatusEnum("status").notNull().default("open"),
  order: integer("order").notNull().default(0),
  dueDate: timestamp4("due_date", { withTimezone: true }),
  completedAt: timestamp4("completed_at", { withTimezone: true }),
  assignedTo: text4("assigned_to"),
  // Better Auth user.id
  createdAt: timestamp4("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp4("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => [
  index2("milestones_project_id_idx").on(t.projectId),
  index2("milestones_phase_id_idx").on(t.phaseId)
]);
var taskStatusEnum = pgEnum4("task_status", [
  "todo",
  "in_progress",
  "done",
  "cancelled"
]);
var tasks = pgTable4("tasks", {
  id: text4("id").primaryKey().$defaultFn(() => createId4()),
  milestoneId: text4("milestone_id").references(() => milestones.id, { onDelete: "cascade" }),
  phaseId: text4("phase_id").references(() => phases.id, { onDelete: "cascade" }),
  projectId: text4("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text4("title").notNull(),
  description: text4("description"),
  status: taskStatusEnum("status").notNull().default("todo"),
  order: integer("order").notNull().default(0),
  dueDate: timestamp4("due_date", { withTimezone: true }),
  completedAt: timestamp4("completed_at", { withTimezone: true }),
  assignedTo: text4("assigned_to"),
  // Better Auth user.id
  createdBy: text4("created_by").notNull(),
  // Better Auth user.id
  createdAt: timestamp4("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp4("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// ../../packages/db/src/schema/financials.ts
import { pgTable as pgTable5, text as text5, timestamp as timestamp5, pgEnum as pgEnum5, numeric as numeric2, index as index3 } from "drizzle-orm/pg-core";
import { createId as createId5 } from "@paralleldrive/cuid2";
var transactionTypeEnum = pgEnum5("transaction_type", [
  "income",
  "expense"
]);
var transactionCategoryEnum = pgEnum5("transaction_category", [
  "client_payment",
  "grant",
  "sponsorship",
  "investment",
  "refund",
  "other_income",
  "salary",
  "contractor",
  "software",
  "hosting",
  "hardware",
  "transport",
  "marketing",
  "legal",
  "office",
  "utilities",
  "other_expense"
]);
var transactions = pgTable5("transactions", {
  id: text5("id").primaryKey().$defaultFn(() => createId5()),
  projectId: text5("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  phaseId: text5("phase_id").references(() => phases.id, { onDelete: "set null" }),
  milestoneId: text5("milestone_id").references(() => milestones.id, { onDelete: "set null" }),
  taskId: text5("task_id").references(() => tasks.id, { onDelete: "set null" }),
  actorId: text5("actor_id").references(() => actors.id, { onDelete: "set null" }),
  type: transactionTypeEnum("type").notNull(),
  category: transactionCategoryEnum("category").notNull(),
  description: text5("description").notNull(),
  amount: numeric2("amount", { precision: 14, scale: 2 }).notNull(),
  currency: currencyCodeEnum("currency").notNull(),
  normalizedAmount: numeric2("normalized_amount", { precision: 14, scale: 2 }).notNull(),
  workspaceCurrency: currencyCodeEnum("workspace_currency").notNull(),
  date: timestamp5("date", { withTimezone: true }).notNull(),
  invoiceId: text5("invoice_id"),
  // set when transaction is auto-created from an invoice payment
  receiptUrl: text5("receipt_url"),
  notes: text5("notes"),
  createdBy: text5("created_by").notNull(),
  // Better Auth user.id
  createdAt: timestamp5("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp5("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => [
  index3("transactions_project_id_idx").on(t.projectId),
  index3("transactions_date_idx").on(t.date)
]);

// ../../packages/db/src/schema/invoices.ts
import { pgTable as pgTable6, text as text6, timestamp as timestamp6, pgEnum as pgEnum6, numeric as numeric3, integer as integer2 } from "drizzle-orm/pg-core";
import { createId as createId6 } from "@paralleldrive/cuid2";
var invoiceStatusEnum = pgEnum6("invoice_status", [
  "draft",
  "sent",
  "partially_paid",
  "paid",
  "void"
]);
var invoiceSettings = pgTable6("invoice_settings", {
  id: text6("id").primaryKey().$defaultFn(() => createId6()),
  workspaceId: text6("workspace_id").notNull().unique().references(() => workspaces.id, { onDelete: "cascade" }),
  invoicePrefix: text6("invoice_prefix").notNull().default("INV"),
  nextSequenceNumber: integer2("next_sequence_number").notNull().default(1),
  companyName: text6("company_name"),
  companyAddress: text6("company_address"),
  companyEmail: text6("company_email"),
  companyPhone: text6("company_phone"),
  paymentDetails: text6("payment_details"),
  defaultTaxRate: numeric3("default_tax_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  defaultPaymentTermsDays: integer2("default_payment_terms_days").notNull().default(30),
  createdAt: timestamp6("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp6("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var invoices = pgTable6("invoices", {
  id: text6("id").primaryKey().$defaultFn(() => createId6()),
  workspaceId: text6("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  projectId: text6("project_id").references(() => projects.id, { onDelete: "set null" }),
  actorId: text6("actor_id").notNull().references(() => actors.id, { onDelete: "restrict" }),
  invoiceNumber: text6("invoice_number").notNull(),
  sequenceNumber: integer2("sequence_number").notNull(),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  currency: currencyCodeEnum("currency").notNull(),
  subtotal: numeric3("subtotal", { precision: 14, scale: 2 }).notNull(),
  taxRate: numeric3("tax_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  taxAmount: numeric3("tax_amount", { precision: 14, scale: 2 }).notNull(),
  total: numeric3("total", { precision: 14, scale: 2 }).notNull(),
  paidAmount: numeric3("paid_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  normalizedTotal: numeric3("normalized_total", { precision: 14, scale: 2 }).notNull(),
  workspaceCurrency: currencyCodeEnum("workspace_currency").notNull(),
  issueDate: timestamp6("issue_date", { withTimezone: true }).notNull(),
  dueDate: timestamp6("due_date", { withTimezone: true }).notNull(),
  notes: text6("notes"),
  // snapshot of workspace payment details at creation time — survives settings changes
  paymentDetails: text6("payment_details"),
  createdBy: text6("created_by").notNull(),
  createdAt: timestamp6("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp6("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var invoiceItems = pgTable6("invoice_items", {
  id: text6("id").primaryKey().$defaultFn(() => createId6()),
  invoiceId: text6("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  description: text6("description").notNull(),
  details: text6("details"),
  quantity: numeric3("quantity", { precision: 10, scale: 2 }).notNull(),
  rate: numeric3("rate", { precision: 14, scale: 2 }).notNull(),
  amount: numeric3("amount", { precision: 14, scale: 2 }).notNull(),
  sortOrder: integer2("sort_order").notNull().default(0),
  createdAt: timestamp6("created_at", { withTimezone: true }).notNull().defaultNow()
});

// ../../packages/db/src/schema/audit.ts
import { pgTable as pgTable7, text as text7, timestamp as timestamp7, jsonb, pgEnum as pgEnum7 } from "drizzle-orm/pg-core";
import { createId as createId7 } from "@paralleldrive/cuid2";
var auditEntityEnum = pgEnum7("audit_entity", [
  "workspace",
  "project",
  "phase",
  "milestone",
  "task",
  "transaction",
  "actor",
  "user",
  "invitation",
  "invoice",
  "invoice_settings",
  "category"
]);
var auditActionEnum = pgEnum7("audit_action", [
  "created",
  "updated",
  "deleted",
  "status_changed",
  "member_added",
  "member_removed",
  "invited",
  "archived",
  "completed",
  "reopened",
  "payment_recorded"
]);
var auditLogs = pgTable7("audit_logs", {
  id: text7("id").primaryKey().$defaultFn(() => createId7()),
  workspaceId: text7("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text7("user_id"),
  // Better Auth user.id — nullable for system actions
  entity: auditEntityEnum("entity").notNull(),
  entityId: text7("entity_id").notNull(),
  action: auditActionEnum("action").notNull(),
  diff: jsonb("diff"),
  metadata: jsonb("metadata"),
  createdAt: timestamp7("created_at", { withTimezone: true }).notNull().defaultNow()
});

// ../../packages/db/src/schema/auth.ts
import { pgTable as pgTable8, text as text8, boolean as boolean3, timestamp as timestamp8 } from "drizzle-orm/pg-core";
var authUser = pgTable8("user", {
  id: text8("id").primaryKey(),
  name: text8("name").notNull(),
  email: text8("email").notNull().unique(),
  emailVerified: boolean3("email_verified").notNull().default(false),
  image: text8("image"),
  createdAt: timestamp8("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp8("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var authSession = pgTable8("session", {
  id: text8("id").primaryKey(),
  expiresAt: timestamp8("expires_at", { withTimezone: true }).notNull(),
  token: text8("token").notNull().unique(),
  createdAt: timestamp8("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp8("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text8("ip_address"),
  userAgent: text8("user_agent"),
  userId: text8("user_id").notNull().references(() => authUser.id, { onDelete: "cascade" })
});
var authAccount = pgTable8("account", {
  id: text8("id").primaryKey(),
  accountId: text8("account_id").notNull(),
  providerId: text8("provider_id").notNull(),
  userId: text8("user_id").notNull().references(() => authUser.id, { onDelete: "cascade" }),
  accessToken: text8("access_token"),
  refreshToken: text8("refresh_token"),
  idToken: text8("id_token"),
  accessTokenExpiresAt: timestamp8("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp8("refresh_token_expires_at", { withTimezone: true }),
  scope: text8("scope"),
  password: text8("password"),
  createdAt: timestamp8("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp8("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var authVerification = pgTable8("verification", {
  id: text8("id").primaryKey(),
  identifier: text8("identifier").notNull(),
  value: text8("value").notNull(),
  expiresAt: timestamp8("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp8("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp8("updated_at", { withTimezone: true }).defaultNow()
});

// ../../packages/db/src/schema/relations.ts
import { relations } from "drizzle-orm";
var workspacesRelations = relations(workspaces, ({ one, many }) => ({
  projects: many(projects),
  categories: many(categories),
  invoiceSettings: one(invoiceSettings, { fields: [workspaces.id], references: [invoiceSettings.workspaceId] }),
  invoices: many(invoices)
}));
var categoriesRelations = relations(categories, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [categories.workspaceId], references: [workspaces.id] }),
  projects: many(projects)
}));
var projectsRelations = relations(projects, ({ one, many }) => ({
  category: one(categories, { fields: [projects.categoryId], references: [categories.id] }),
  phases: many(phases),
  milestones: many(milestones),
  transactions: many(transactions),
  invoices: many(invoices),
  actors: many(projectActors),
  members: many(projectMembers)
}));
var phasesRelations = relations(phases, ({ one, many }) => ({
  project: one(projects, { fields: [phases.projectId], references: [projects.id] }),
  milestones: many(milestones),
  tasks: many(tasks)
}));
var milestonesRelations = relations(milestones, ({ one, many }) => ({
  phase: one(phases, { fields: [milestones.phaseId], references: [phases.id] }),
  project: one(projects, { fields: [milestones.projectId], references: [projects.id] }),
  tasks: many(tasks)
}));
var tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  phase: one(phases, { fields: [tasks.phaseId], references: [phases.id] }),
  milestone: one(milestones, { fields: [tasks.milestoneId], references: [milestones.id] })
}));
var projectActorsRelations = relations(projectActors, ({ one }) => ({
  project: one(projects, { fields: [projectActors.projectId], references: [projects.id] }),
  actor: one(actors, { fields: [projectActors.actorId], references: [actors.id] })
}));
var projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] })
}));
var transactionsRelations = relations(transactions, ({ one }) => ({
  project: one(projects, { fields: [transactions.projectId], references: [projects.id] }),
  actor: one(actors, { fields: [transactions.actorId], references: [actors.id] }),
  invoice: one(invoices, { fields: [transactions.invoiceId], references: [invoices.id] })
}));
var invoiceSettingsRelations = relations(invoiceSettings, ({ one }) => ({
  workspace: one(workspaces, { fields: [invoiceSettings.workspaceId], references: [workspaces.id] })
}));
var invoicesRelations = relations(invoices, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [invoices.workspaceId], references: [workspaces.id] }),
  project: one(projects, { fields: [invoices.projectId], references: [projects.id] }),
  actor: one(actors, { fields: [invoices.actorId], references: [actors.id] }),
  items: many(invoiceItems),
  transactions: many(transactions)
}));
var invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] })
}));
var actorsRelations = relations(actors, ({ many }) => ({
  projectActors: many(projectActors),
  transactions: many(transactions),
  invoices: many(invoices)
}));

// ../../packages/db/src/client.ts
if (!process.env["DATABASE_URL"]) {
  throw new Error("DATABASE_URL environment variable is required");
}
var queryClient = src_default(process.env["DATABASE_URL"], {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false
});
var db = drizzle(queryClient, { schema: schema_exports });

// src/app.ts
import { sql as sql5 } from "drizzle-orm";

// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
var auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: authUser,
      session: authSession,
      account: authAccount,
      verification: authVerification
    }
  }),
  baseURL: process.env["BETTER_AUTH_URL"] ?? "http://localhost:3001",
  secret: process.env["BETTER_AUTH_SECRET"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const name = `${user.name}'s Workspace`;
          const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 8)}`;
          const [workspace] = await db.insert(workspaces).values({ name, slug }).returning();
          await db.insert(workspaceMembers).values({
            workspaceId: workspace.id,
            userId: user.id,
            role: "owner"
          });
        }
      }
    }
  },
  trustedOrigins: [process.env["WEB_URL"] ?? "http://localhost:3000"],
  plugins: [bearer()]
});

// src/routes/projects.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

// ../../packages/validators/src/index.ts
import { z } from "zod";
var createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
  baseCurrency: z.string().length(3).default("USD")
});
var createCategorySchema = z.object({
  name: z.string().min(1).max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
  icon: z.string().optional(),
  description: z.string().optional()
});
var updateCategorySchema = createCategorySchema.partial().extend({
  archived: z.boolean().optional()
});
var projectStatuses = ["draft", "active", "on_hold", "completed", "cancelled"];
var projectHealthValues = ["healthy", "at_risk", "delayed", "blocked"];
var projectPriorityValues = ["low", "medium", "high", "critical"];
var projectVisibilityValues = ["private", "workspace"];
var createProjectSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(projectStatuses).default("draft"),
  health: z.enum(projectHealthValues).default("healthy"),
  priority: z.enum(projectPriorityValues).default("medium"),
  visibility: z.enum(projectVisibilityValues).default("workspace"),
  budget: z.number().positive().optional(),
  currency: z.string().length(3).default("USD"),
  tags: z.array(z.string().max(50)).default([]),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional()
});
var updateProjectSchema = createProjectSchema.partial();
var createPhaseSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  order: z.number().int().min(0).default(0),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional()
});
var updatePhaseSchema = createPhaseSchema.partial();
var createMilestoneSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().optional(),
  order: z.number().int().min(0).default(0),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().optional()
});
var updateMilestoneSchema = createMilestoneSchema.partial();
var actorTypes = ["client", "collaborator", "vendor", "advisor", "investor"];
var createActorSchema = z.object({
  name: z.string().min(1).max(150),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  type: z.enum(actorTypes),
  company: z.string().optional(),
  notes: z.string().optional()
});
var updateActorSchema = createActorSchema.partial();
var transactionTypes = ["income", "expense"];
var transactionCategories = [
  "client_payment",
  "grant",
  "sponsorship",
  "investment",
  "refund",
  "other_income",
  "salary",
  "contractor",
  "software",
  "hosting",
  "hardware",
  "transport",
  "marketing",
  "legal",
  "office",
  "utilities",
  "other_expense"
];
var createTransactionSchema = z.object({
  type: z.enum(transactionTypes),
  category: z.enum(transactionCategories),
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  currency: z.string().length(3),
  normalizedAmount: z.number().positive(),
  date: z.string().datetime(),
  phaseId: z.string().optional(),
  milestoneId: z.string().optional(),
  taskId: z.string().optional(),
  actorId: z.string().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().url().optional()
});
var updateTransactionSchema = createTransactionSchema.partial();
var updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  baseCurrency: z.string().length(3).optional()
});
var taskStatuses = ["todo", "in_progress", "done", "cancelled"];
var createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(taskStatuses).default("todo"),
  milestoneId: z.string().optional(),
  phaseId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  order: z.number().int().min(0).default(0)
});
var updateTaskSchema = createTaskSchema.partial();
var inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member")
});
var invoiceItemSchema = z.object({
  description: z.string().min(1).max(255),
  details: z.string().optional(),
  quantity: z.number().positive(),
  rate: z.number().min(0),
  sortOrder: z.number().int().min(0).default(0)
});
var createInvoiceSchema = z.object({
  projectId: z.string().optional(),
  actorId: z.string().min(1),
  currency: z.string().length(3),
  normalizedTotal: z.number().positive(),
  taxRate: z.number().min(0).max(100).default(0),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1)
});
var updateInvoiceSchema = z.object({
  projectId: z.string().optional().nullable(),
  actorId: z.string().optional(),
  currency: z.string().length(3).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  normalizedTotal: z.number().positive().optional(),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1).optional()
});
var recordPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  normalizedAmount: z.number().positive(),
  date: z.string().datetime(),
  notes: z.string().optional()
});
var upsertInvoiceSettingsSchema = z.object({
  invoicePrefix: z.string().min(1).max(10).optional(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companyEmail: z.string().email().optional(),
  companyPhone: z.string().optional(),
  paymentDetails: z.string().optional(),
  defaultTaxRate: z.number().min(0).max(100).optional(),
  defaultPaymentTermsDays: z.number().int().min(0).max(365).optional()
});

// src/routes/projects.ts
import { eq as eq3, and as and3, sql as sql2, count as count2, desc } from "drizzle-orm";

// src/middleware/auth.ts
import { eq, and } from "drizzle-orm";
async function requireAuth(c, next) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const workspaceId = c.req.header("X-Workspace-Id");
  if (!workspaceId) {
    return c.json({ error: "X-Workspace-Id header required" }, 400);
  }
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.userId, session.user.id),
      eq(workspaceMembers.workspaceId, workspaceId)
    )
  });
  if (!membership) {
    return c.json({ error: "Forbidden" }, 403);
  }
  c.set("auth", {
    userId: session.user.id,
    workspaceId,
    role: membership.role
  });
  await next();
}
function requireRole(...roles) {
  return async (c, next) => {
    const auth2 = c.get("auth");
    if (!roles.includes(auth2.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  };
}

// src/lib/audit.ts
function writeAuditLog(params) {
  db.insert(auditLogs).values({
    workspaceId: params.workspaceId,
    userId: params.userId ?? null,
    entity: params.entity,
    entityId: params.entityId,
    action: params.action,
    diff: params.diff ?? null,
    metadata: params.metadata ?? null
  });
}

// src/lib/progress.ts
import { eq as eq2, count, sql } from "drizzle-orm";
async function computeProjectProgress(projectId) {
  const [row] = await db.select({
    total: count(),
    completed: sql`count(*) filter (where ${milestones.status} = 'completed')`
  }).from(milestones).innerJoin(phases, eq2(milestones.phaseId, phases.id)).where(eq2(phases.projectId, projectId));
  const total = row?.total ?? 0;
  if (total === 0) return 0;
  return Math.round((row?.completed ?? 0) / total * 100);
}

// src/routes/projects.ts
function slugify2(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
var projectsRouter = new Hono().use(requireAuth).get("/", async (c) => {
  const { workspaceId } = c.get("auth");
  const { status, categoryId, archived } = c.req.query();
  const [rows, progressRows] = await Promise.all([
    db.query.projects.findMany({
      where: and3(
        eq3(projects.workspaceId, workspaceId),
        eq3(projects.archived, archived === "true"),
        status ? eq3(projects.status, status) : void 0,
        categoryId ? eq3(projects.categoryId, categoryId) : void 0
      ),
      with: { category: true },
      orderBy: [desc(projects.createdAt)]
    }),
    db.select({
      projectId: milestones.projectId,
      total: count2(),
      completed: sql2`count(*) filter (where ${milestones.status} = 'completed')`
    }).from(milestones).innerJoin(projects, eq3(milestones.projectId, projects.id)).where(eq3(projects.workspaceId, workspaceId)).groupBy(milestones.projectId)
  ]);
  const progressMap = new Map(
    progressRows.map((r) => [
      r.projectId,
      r.total === 0 ? 0 : Math.round(r.completed / r.total * 100)
    ])
  );
  return c.json({ data: rows.map((p) => ({ ...p, progress: progressMap.get(p.id) ?? 0 })) });
}).post("/", zValidator("json", createProjectSchema), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const body = c.req.valid("json");
  const [project] = await db.insert(projects).values({
    name: body.name,
    slug: slugify2(body.name),
    description: body.description,
    categoryId: body.categoryId,
    status: body.status,
    health: body.health,
    priority: body.priority,
    visibility: body.visibility,
    budget: body.budget != null ? String(body.budget) : null,
    currency: body.currency,
    tags: body.tags,
    startDate: body.startDate ? new Date(body.startDate) : null,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    workspaceId,
    ownerId: userId,
    createdBy: userId
  }).returning();
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "project",
    entityId: project.id,
    action: "created",
    metadata: { name: project.name }
  });
  return c.json({ data: project }, 201);
}).get("/:id", async (c) => {
  const { workspaceId } = c.get("auth");
  const { id } = c.req.param();
  const project = await db.query.projects.findFirst({
    where: and3(eq3(projects.id, id), eq3(projects.workspaceId, workspaceId)),
    with: { category: true }
  });
  if (!project) return c.json({ error: "Not found" }, 404);
  const [progress, [financials]] = await Promise.all([
    computeProjectProgress(id),
    db.select({
      totalIncome: sql2`coalesce(sum(case when type = 'income' then normalized_amount else 0 end), 0)`,
      totalExpenses: sql2`coalesce(sum(case when type = 'expense' then normalized_amount else 0 end), 0)`
    }).from(transactions).where(eq3(transactions.projectId, id))
  ]);
  return c.json({
    data: {
      ...project,
      progress,
      financials: {
        totalIncome: Number(financials?.totalIncome ?? 0),
        totalExpenses: Number(financials?.totalExpenses ?? 0),
        profit: Number(financials?.totalIncome ?? 0) - Number(financials?.totalExpenses ?? 0),
        budget: project.budget ? Number(project.budget) : null,
        budgetUsed: project.budget ? Math.round(Number(financials?.totalExpenses ?? 0) / Number(project.budget) * 100) : null
      }
    }
  });
}).patch("/:id", zValidator("json", updateProjectSchema), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { id } = c.req.param();
  const body = c.req.valid("json");
  const existing = await db.query.projects.findFirst({
    where: and3(eq3(projects.id, id), eq3(projects.workspaceId, workspaceId))
  });
  if (!existing) return c.json({ error: "Not found" }, 404);
  const [updated] = await db.update(projects).set({
    name: body.name,
    description: body.description,
    categoryId: body.categoryId,
    status: body.status,
    health: body.health,
    priority: body.priority,
    visibility: body.visibility,
    budget: body.budget != null ? String(body.budget) : void 0,
    currency: body.currency,
    tags: body.tags,
    startDate: body.startDate ? new Date(body.startDate) : void 0,
    dueDate: body.dueDate ? new Date(body.dueDate) : void 0,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq3(projects.id, existing.id)).returning();
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "project",
    entityId: id,
    action: body.status && body.status !== existing.status ? "status_changed" : "updated",
    diff: { before: existing, after: updated }
  });
  return c.json({ data: updated });
}).delete("/:id", requireRole("admin", "owner"), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const id = c.req.param("id");
  const existing = await db.query.projects.findFirst({
    where: and3(eq3(projects.id, id), eq3(projects.workspaceId, workspaceId))
  });
  if (!existing) return c.json({ error: "Not found" }, 404);
  await db.delete(projects).where(eq3(projects.id, id));
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "project",
    entityId: id,
    action: "deleted",
    diff: { before: existing }
  });
  return c.json({ success: true });
}).post("/:id/archive", requireRole("admin", "owner"), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { id } = c.req.param();
  const [updated] = await db.update(projects).set({ archived: true, updatedAt: /* @__PURE__ */ new Date() }).where(and3(eq3(projects.id, id), eq3(projects.workspaceId, workspaceId))).returning();
  if (!updated) return c.json({ error: "Not found" }, 404);
  await writeAuditLog({ workspaceId, userId, entity: "project", entityId: id, action: "archived" });
  return c.json({ data: updated });
});

// src/routes/phases.ts
import { Hono as Hono2 } from "hono";
import { zValidator as zValidator2 } from "@hono/zod-validator";
import { eq as eq4, and as and4, asc } from "drizzle-orm";
async function verifyProjectAccess(projectId, workspaceId) {
  return db.query.projects.findFirst({
    where: and4(eq4(projects.id, projectId), eq4(projects.workspaceId, workspaceId))
  });
}
var phasesRouter = new Hono2().use(requireAuth).get("/:projectId/phases", async (c) => {
  const { workspaceId } = c.get("auth");
  const { projectId } = c.req.param();
  const project = await verifyProjectAccess(projectId, workspaceId);
  if (!project) return c.json({ error: "Not found" }, 404);
  const phaseList = await db.query.phases.findMany({
    where: eq4(phases.projectId, projectId),
    with: { milestones: true },
    orderBy: [asc(phases.order), asc(phases.createdAt)]
  });
  const data = phaseList.map((phase) => {
    const total = phase.milestones.length;
    const completed = phase.milestones.filter((m) => m.status === "completed").length;
    return {
      ...phase,
      progress: total === 0 ? 0 : Math.round(completed / total * 100),
      milestoneCount: total,
      completedMilestones: completed
    };
  });
  return c.json({ data });
}).post("/:projectId/phases", zValidator2("json", createPhaseSchema), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { projectId } = c.req.param();
  const body = c.req.valid("json");
  const project = await verifyProjectAccess(projectId, workspaceId);
  if (!project) return c.json({ error: "Not found" }, 404);
  const [phase] = await db.insert(phases).values({
    projectId,
    name: body.name,
    description: body.description,
    order: body.order,
    startDate: body.startDate ? new Date(body.startDate) : null,
    dueDate: body.dueDate ? new Date(body.dueDate) : null
  }).returning();
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "phase",
    entityId: phase.id,
    action: "created",
    metadata: { name: phase.name, projectId }
  });
  return c.json({ data: phase }, 201);
}).patch("/:projectId/phases/:phaseId", zValidator2("json", updatePhaseSchema), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { projectId, phaseId } = c.req.param();
  const body = c.req.valid("json");
  const project = await verifyProjectAccess(projectId, workspaceId);
  if (!project) return c.json({ error: "Not found" }, 404);
  const existing = await db.query.phases.findFirst({
    where: and4(eq4(phases.id, phaseId), eq4(phases.projectId, projectId))
  });
  if (!existing) return c.json({ error: "Not found" }, 404);
  const [updated] = await db.update(phases).set({
    name: body.name,
    description: body.description,
    order: body.order,
    startDate: body.startDate ? new Date(body.startDate) : void 0,
    dueDate: body.dueDate ? new Date(body.dueDate) : void 0,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq4(phases.id, phaseId)).returning();
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "phase",
    entityId: phaseId,
    action: "updated",
    diff: { before: existing, after: updated }
  });
  return c.json({ data: updated });
}).patch("/:projectId/phases/:phaseId/complete", async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { projectId, phaseId } = c.req.param();
  const project = await verifyProjectAccess(projectId, workspaceId);
  if (!project) return c.json({ error: "Not found" }, 404);
  const [updated] = await db.update(phases).set({ status: "completed", completedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(and4(eq4(phases.id, phaseId), eq4(phases.projectId, projectId))).returning();
  if (!updated) return c.json({ error: "Not found" }, 404);
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "phase",
    entityId: phaseId,
    action: "completed",
    metadata: { projectId }
  });
  return c.json({ data: updated });
}).patch("/:projectId/phases/:phaseId/reopen", async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { projectId, phaseId } = c.req.param();
  const project = await verifyProjectAccess(projectId, workspaceId);
  if (!project) return c.json({ error: "Not found" }, 404);
  const [updated] = await db.update(phases).set({ status: "active", completedAt: null, updatedAt: /* @__PURE__ */ new Date() }).where(and4(eq4(phases.id, phaseId), eq4(phases.projectId, projectId))).returning();
  if (!updated) return c.json({ error: "Not found" }, 404);
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "phase",
    entityId: phaseId,
    action: "reopened",
    metadata: { projectId }
  });
  return c.json({ data: updated });
}).delete("/:projectId/phases/:phaseId", async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { projectId, phaseId } = c.req.param();
  const project = await verifyProjectAccess(projectId, workspaceId);
  if (!project) return c.json({ error: "Not found" }, 404);
  await db.delete(phases).where(
    and4(eq4(phases.id, phaseId), eq4(phases.projectId, projectId))
  );
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "phase",
    entityId: phaseId,
    action: "deleted",
    metadata: { projectId }
  });
  return c.json({ data: { id: phaseId } });
});

// src/routes/milestones.ts
import { Hono as Hono3 } from "hono";
import { zValidator as zValidator3 } from "@hono/zod-validator";
import { eq as eq5, and as and5 } from "drizzle-orm";
async function verifyProjectAccess2(projectId, workspaceId) {
  return db.query.projects.findFirst({
    where: and5(eq5(projects.id, projectId), eq5(projects.workspaceId, workspaceId))
  });
}
var milestonesRouter = new Hono3().use(requireAuth).post("/:projectId/phases/:phaseId/milestones", zValidator3("json", createMilestoneSchema), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { projectId, phaseId } = c.req.param();
  const body = c.req.valid("json");
  const project = await verifyProjectAccess2(projectId, workspaceId);
  if (!project) return c.json({ error: "Not found" }, 404);
  const phase = await db.query.phases.findFirst({
    where: and5(eq5(phases.id, phaseId), eq5(phases.projectId, projectId))
  });
  if (!phase) return c.json({ error: "Not found" }, 404);
  const [milestone] = await db.insert(milestones).values({
    phaseId,
    projectId,
    name: body.name,
    description: body.description,
    order: body.order,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    assignedTo: body.assignedTo
  }).returning();
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "milestone",
    entityId: milestone.id,
    action: "created",
    metadata: { name: milestone.name, projectId, phaseId }
  });
  return c.json({ data: milestone }, 201);
}).patch("/:projectId/phases/:phaseId/milestones/:milestoneId", zValidator3("json", updateMilestoneSchema), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { projectId, phaseId, milestoneId } = c.req.param();
  const body = c.req.valid("json");
  const project = await verifyProjectAccess2(projectId, workspaceId);
  if (!project) return c.json({ error: "Not found" }, 404);
  const existing = await db.query.milestones.findFirst({
    where: and5(eq5(milestones.id, milestoneId), eq5(milestones.phaseId, phaseId))
  });
  if (!existing) return c.json({ error: "Not found" }, 404);
  const [updated] = await db.update(milestones).set({
    name: body.name,
    description: body.description,
    order: body.order,
    dueDate: body.dueDate ? new Date(body.dueDate) : void 0,
    assignedTo: body.assignedTo,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq5(milestones.id, milestoneId)).returning();
  return c.json({ data: updated });
}).patch("/:projectId/phases/:phaseId/milestones/:milestoneId/toggle", async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { projectId, phaseId, milestoneId } = c.req.param();
  const project = await verifyProjectAccess2(projectId, workspaceId);
  if (!project) return c.json({ error: "Not found" }, 404);
  const existing = await db.query.milestones.findFirst({
    where: and5(eq5(milestones.id, milestoneId), eq5(milestones.phaseId, phaseId))
  });
  if (!existing) return c.json({ error: "Not found" }, 404);
  const newStatus = existing.status === "completed" ? "open" : "completed";
  const [updated] = await db.update(milestones).set({
    status: newStatus,
    completedAt: newStatus === "completed" ? /* @__PURE__ */ new Date() : null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq5(milestones.id, milestoneId)).returning();
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "milestone",
    entityId: milestoneId,
    action: newStatus === "completed" ? "completed" : "reopened",
    metadata: { projectId, phaseId }
  });
  return c.json({ data: updated });
}).delete("/:projectId/phases/:phaseId/milestones/:milestoneId", async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { projectId, phaseId, milestoneId } = c.req.param();
  const project = await verifyProjectAccess2(projectId, workspaceId);
  if (!project) return c.json({ error: "Not found" }, 404);
  await db.delete(milestones).where(
    and5(eq5(milestones.id, milestoneId), eq5(milestones.phaseId, phaseId))
  );
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "milestone",
    entityId: milestoneId,
    action: "deleted",
    metadata: { projectId, phaseId }
  });
  return c.json({ data: { id: milestoneId } });
});

// src/routes/transactions.ts
import { Hono as Hono4 } from "hono";
import { zValidator as zValidator4 } from "@hono/zod-validator";
import { eq as eq6, and as and6, desc as desc2 } from "drizzle-orm";
var transactionsRouter = new Hono4().use("/projects/*", requireAuth).get("/projects/:projectId/transactions", async (c) => {
  const { workspaceId } = c.get("auth");
  const { projectId } = c.req.param();
  const project = await db.query.projects.findFirst({
    where: and6(eq6(projects.id, projectId), eq6(projects.workspaceId, workspaceId))
  });
  if (!project) return c.json({ error: "Not found" }, 404);
  const rows = await db.query.transactions.findMany({
    where: eq6(transactions.projectId, projectId),
    with: { actor: true },
    orderBy: [desc2(transactions.date)]
  });
  return c.json({ data: rows });
}).post("/projects/:projectId/transactions", zValidator4("json", createTransactionSchema), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { projectId } = c.req.param();
  const body = c.req.valid("json");
  const project = await db.query.projects.findFirst({
    where: and6(eq6(projects.id, projectId), eq6(projects.workspaceId, workspaceId))
  });
  if (!project) return c.json({ error: "Not found" }, 404);
  const [tx] = await db.insert(transactions).values({
    projectId,
    phaseId: body.phaseId,
    milestoneId: body.milestoneId,
    taskId: body.taskId,
    actorId: body.actorId,
    type: body.type,
    category: body.category,
    description: body.description,
    amount: String(body.amount),
    currency: body.currency,
    normalizedAmount: String(body.normalizedAmount),
    workspaceCurrency: project.currency,
    date: new Date(body.date),
    receiptUrl: body.receiptUrl,
    notes: body.notes,
    createdBy: userId
  }).returning();
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "transaction",
    entityId: tx.id,
    action: "created",
    metadata: { projectId, type: body.type, amount: body.amount }
  });
  return c.json({ data: tx }, 201);
}).delete("/projects/:projectId/transactions/:id", async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { projectId, id } = c.req.param();
  const existing = await db.query.transactions.findFirst({
    where: and6(eq6(transactions.id, id), eq6(transactions.projectId, projectId))
  });
  if (!existing) return c.json({ error: "Not found" }, 404);
  await db.delete(transactions).where(eq6(transactions.id, id));
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "transaction",
    entityId: id,
    action: "deleted",
    diff: { before: existing }
  });
  return c.json({ success: true });
});

// src/routes/analytics.ts
import { Hono as Hono5 } from "hono";
import { eq as eq7, sql as sql3, count as count3, and as and7, gte, lt, gt, desc as desc3, asc as asc2 } from "drizzle-orm";
var analyticsRouter = new Hono5().use(requireAuth).get("/dashboard", async (c) => {
  const { workspaceId } = c.get("auth");
  const now = /* @__PURE__ */ new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const pct = (cur, prv) => prv === 0 ? null : Math.round((cur - prv) / prv * 100);
  const monthFinancials = (start, end) => db.select({
    income: sql3`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.normalizedAmount} else 0 end), 0)`,
    expenses: sql3`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.normalizedAmount} else 0 end), 0)`
  }).from(transactions).innerJoin(projects, eq7(transactions.projectId, projects.id)).where(
    and7(
      eq7(projects.workspaceId, workspaceId),
      gte(transactions.date, start),
      lt(transactions.date, end)
    )
  );
  const [
    statusCounts,
    allTimeFinancials,
    projectList,
    curMonthFinancials,
    prvMonthFinancials,
    activeNow,
    activeLast,
    milestoneStats,
    upcomingPayments,
    actorCount,
    memberCount,
    progressByProject
  ] = await Promise.all([
    db.select({ status: projects.status, count: count3() }).from(projects).where(and7(eq7(projects.workspaceId, workspaceId), eq7(projects.archived, false))).groupBy(projects.status),
    db.select({
      totalIncome: sql3`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.normalizedAmount} else 0 end), 0)`,
      totalExpenses: sql3`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.normalizedAmount} else 0 end), 0)`
    }).from(transactions).innerJoin(projects, eq7(transactions.projectId, projects.id)).where(eq7(projects.workspaceId, workspaceId)),
    db.select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      health: projects.health,
      priority: projects.priority,
      budget: projects.budget,
      dueDate: projects.dueDate,
      createdAt: projects.createdAt
    }).from(projects).where(and7(eq7(projects.workspaceId, workspaceId), eq7(projects.archived, false))).orderBy(
      // Active first, then on_hold, draft, completed, cancelled
      sql3`case ${projects.status}
            when 'active' then 0
            when 'on_hold' then 1
            when 'draft' then 2
            when 'completed' then 3
            else 4 end`,
      // Within active: most urgent health first
      sql3`case ${projects.health}
            when 'blocked' then 0
            when 'delayed' then 1
            when 'at_risk' then 2
            else 3 end`,
      // Then earliest due date
      asc2(projects.dueDate)
    ),
    monthFinancials(thisMonthStart, nextMonthStart),
    monthFinancials(lastMonthStart, thisMonthStart),
    db.select({ count: count3() }).from(projects).where(and7(eq7(projects.workspaceId, workspaceId), eq7(projects.status, "active"), eq7(projects.archived, false))),
    db.select({ count: count3() }).from(projects).where(
      and7(
        eq7(projects.workspaceId, workspaceId),
        eq7(projects.status, "active"),
        eq7(projects.archived, false),
        lt(projects.createdAt, thisMonthStart)
      )
    ),
    db.select({
      total: count3(),
      completed: sql3`count(*) filter (where ${milestones.status} = 'completed')`
    }).from(milestones).innerJoin(projects, eq7(milestones.projectId, projects.id)).where(and7(eq7(projects.workspaceId, workspaceId), eq7(projects.archived, false))),
    db.select({
      id: transactions.id,
      description: transactions.description,
      type: transactions.type,
      amount: transactions.normalizedAmount,
      currency: transactions.workspaceCurrency,
      date: transactions.date,
      projectId: transactions.projectId,
      projectName: projects.name,
      category: transactions.category
    }).from(transactions).innerJoin(projects, eq7(transactions.projectId, projects.id)).where(and7(eq7(projects.workspaceId, workspaceId), gt(transactions.date, now))).orderBy(transactions.date).limit(5),
    db.select({ count: count3() }).from(actors).where(eq7(actors.workspaceId, workspaceId)),
    db.select({ count: count3() }).from(workspaceMembers).where(eq7(workspaceMembers.workspaceId, workspaceId)),
    db.select({
      projectId: milestones.projectId,
      total: count3(),
      completed: sql3`count(*) filter (where ${milestones.status} = 'completed')`
    }).from(milestones).innerJoin(projects, eq7(milestones.projectId, projects.id)).where(and7(eq7(projects.workspaceId, workspaceId), eq7(projects.archived, false))).groupBy(milestones.projectId)
  ]);
  const totalIncome = Number(allTimeFinancials[0]?.totalIncome ?? 0);
  const totalExpenses = Number(allTimeFinancials[0]?.totalExpenses ?? 0);
  const curIncome = Number(curMonthFinancials[0]?.income ?? 0);
  const prvIncome = Number(prvMonthFinancials[0]?.income ?? 0);
  const curExpenses = Number(curMonthFinancials[0]?.expenses ?? 0);
  const prvExpenses = Number(prvMonthFinancials[0]?.expenses ?? 0);
  const curActive = activeNow[0]?.count ?? 0;
  const prvActive = activeLast[0]?.count ?? 0;
  const milestoneTotal = milestoneStats[0]?.total ?? 0;
  const milestoneCompleted = milestoneStats[0]?.completed ?? 0;
  const overdue = projectList.filter(
    (p) => p.status === "active" && p.dueDate && p.dueDate < now
  ).length;
  const progressMap = new Map(
    progressByProject.map((r) => [
      r.projectId,
      r.total === 0 ? 0 : Math.round(r.completed / r.total * 100)
    ])
  );
  return c.json({
    data: {
      portfolio: {
        statusBreakdown: statusCounts,
        overdue,
        totalProjects: projectList.length,
        financials: {
          totalIncome,
          totalExpenses,
          profit: totalIncome - totalExpenses
        }
      },
      trends: {
        income: { current: curIncome, previous: prvIncome, pct: pct(curIncome, prvIncome) },
        expenses: { current: curExpenses, previous: prvExpenses, pct: pct(curExpenses, prvExpenses) },
        profit: {
          current: curIncome - curExpenses,
          previous: prvIncome - prvExpenses,
          pct: pct(curIncome - curExpenses, prvIncome - prvExpenses)
        },
        activeProjects: { current: curActive, previous: prvActive, pct: pct(curActive, prvActive) }
      },
      projects: projectList.map((p) => ({ ...p, progress: progressMap.get(p.id) ?? 0 })),
      milestones: {
        total: milestoneTotal,
        completed: milestoneCompleted,
        completionRate: milestoneTotal === 0 ? 0 : Math.round(milestoneCompleted / milestoneTotal * 100)
      },
      upcomingPayments,
      onboarding: {
        hasProject: projectList.length > 0,
        hasActor: (actorCount[0]?.count ?? 0) > 0,
        hasMember: (memberCount[0]?.count ?? 0) > 1
      }
    }
  });
}).get("/portfolio", async (c) => {
  const { workspaceId } = c.get("auth");
  const [statusCounts, financials, projectList] = await Promise.all([
    db.select({ status: projects.status, count: count3() }).from(projects).where(and7(eq7(projects.workspaceId, workspaceId), eq7(projects.archived, false))).groupBy(projects.status),
    db.select({
      totalIncome: sql3`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.normalizedAmount} else 0 end), 0)`,
      totalExpenses: sql3`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.normalizedAmount} else 0 end), 0)`
    }).from(transactions).innerJoin(projects, eq7(transactions.projectId, projects.id)).where(eq7(projects.workspaceId, workspaceId)),
    db.select({ id: projects.id, name: projects.name, status: projects.status, dueDate: projects.dueDate }).from(projects).where(and7(eq7(projects.workspaceId, workspaceId), eq7(projects.archived, false)))
  ]);
  const now = /* @__PURE__ */ new Date();
  const overdue = projectList.filter(
    (p) => p.status === "active" && p.dueDate && p.dueDate < now
  ).length;
  const totalIncome = Number(financials[0]?.totalIncome ?? 0);
  const totalExpenses = Number(financials[0]?.totalExpenses ?? 0);
  return c.json({
    data: {
      statusBreakdown: statusCounts,
      overdue,
      totalProjects: projectList.length,
      financials: {
        totalIncome,
        totalExpenses,
        profit: totalIncome - totalExpenses
      }
    }
  });
}).get("/by-category", async (c) => {
  const { workspaceId } = c.get("auth");
  const rows = await db.select({
    categoryId: projects.categoryId,
    categoryName: categories.name,
    categoryColor: categories.color,
    categoryIcon: categories.icon,
    count: count3(),
    totalIncome: sql3`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.normalizedAmount} else 0 end), 0)`,
    totalExpenses: sql3`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.normalizedAmount} else 0 end), 0)`
  }).from(projects).leftJoin(transactions, eq7(transactions.projectId, projects.id)).leftJoin(categories, eq7(projects.categoryId, categories.id)).where(and7(eq7(projects.workspaceId, workspaceId), eq7(projects.archived, false))).groupBy(projects.categoryId, categories.name, categories.color, categories.icon);
  return c.json({ data: rows });
}).get("/milestones-summary", async (c) => {
  const { workspaceId } = c.get("auth");
  const [row] = await db.select({
    total: count3(),
    completed: sql3`count(*) filter (where ${milestones.status} = 'completed')`
  }).from(milestones).innerJoin(projects, eq7(milestones.projectId, projects.id)).where(and7(eq7(projects.workspaceId, workspaceId), eq7(projects.archived, false)));
  const totalCount = row?.total ?? 0;
  const completedCount = row?.completed ?? 0;
  return c.json({
    data: {
      total: totalCount,
      completed: completedCount,
      completionRate: totalCount === 0 ? 0 : Math.round(completedCount / totalCount * 100)
    }
  });
}).get("/top-spending", async (c) => {
  const { workspaceId } = c.get("auth");
  const limit = Number(c.req.query("limit") ?? 5);
  const expenseExpr = sql3`sum(case when ${transactions.type} = 'expense' then ${transactions.normalizedAmount} else 0 end)`;
  const rows = await db.select({
    projectId: transactions.projectId,
    projectName: projects.name,
    totalExpenses: expenseExpr
  }).from(transactions).innerJoin(projects, eq7(transactions.projectId, projects.id)).where(eq7(projects.workspaceId, workspaceId)).groupBy(transactions.projectId, projects.name).orderBy(sql3`sum(case when ${transactions.type} = 'expense' then ${transactions.normalizedAmount} else 0 end) desc`).limit(limit);
  return c.json({ data: rows });
}).get("/trends", async (c) => {
  const { workspaceId } = c.get("auth");
  const now = /* @__PURE__ */ new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = thisMonthStart;
  const financials = (start, end) => db.select({
    income: sql3`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.normalizedAmount} else 0 end), 0)`,
    expenses: sql3`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.normalizedAmount} else 0 end), 0)`
  }).from(transactions).innerJoin(projects, eq7(transactions.projectId, projects.id)).where(
    and7(
      eq7(projects.workspaceId, workspaceId),
      gte(transactions.date, start),
      lt(transactions.date, end)
    )
  );
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [current, last, activeNow, activeLast] = await Promise.all([
    financials(thisMonthStart, nextMonthStart),
    financials(lastMonthStart, lastMonthEnd),
    db.select({ count: count3() }).from(projects).where(
      and7(eq7(projects.workspaceId, workspaceId), eq7(projects.status, "active"), eq7(projects.archived, false))
    ),
    db.select({ count: count3() }).from(projects).where(
      and7(
        eq7(projects.workspaceId, workspaceId),
        eq7(projects.status, "active"),
        eq7(projects.archived, false),
        lt(projects.createdAt, thisMonthStart)
      )
    )
  ]);
  const cur = current[0];
  const prv = last[0];
  const curIncome = Number(cur.income);
  const prvIncome = Number(prv.income);
  const curExpenses = Number(cur.expenses);
  const prvExpenses = Number(prv.expenses);
  const curProfit = curIncome - curExpenses;
  const prvProfit = prvIncome - prvExpenses;
  const curActive = activeNow[0]?.count ?? 0;
  const prvActive = activeLast[0]?.count ?? 0;
  const pct = (cur2, prv2) => prv2 === 0 ? null : Math.round((cur2 - prv2) / prv2 * 100);
  return c.json({
    data: {
      income: { current: curIncome, previous: prvIncome, pct: pct(curIncome, prvIncome) },
      expenses: { current: curExpenses, previous: prvExpenses, pct: pct(curExpenses, prvExpenses) },
      profit: { current: curProfit, previous: prvProfit, pct: pct(curProfit, prvProfit) },
      activeProjects: { current: curActive, previous: prvActive, pct: pct(curActive, prvActive) }
    }
  });
}).get("/revenue-by-project", async (c) => {
  const { workspaceId } = c.get("auth");
  const limit = Number(c.req.query("limit") ?? 5);
  const rows = await db.select({
    projectId: transactions.projectId,
    projectName: projects.name,
    totalIncome: sql3`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.normalizedAmount} else 0 end), 0)`
  }).from(transactions).innerJoin(projects, eq7(transactions.projectId, projects.id)).where(and7(eq7(projects.workspaceId, workspaceId), eq7(projects.archived, false))).groupBy(transactions.projectId, projects.name).orderBy(sql3`sum(case when ${transactions.type} = 'income' then ${transactions.normalizedAmount} else 0 end) desc`).limit(limit);
  const total = rows.reduce((sum, r) => sum + Number(r.totalIncome), 0);
  return c.json({
    data: rows.map((r) => ({
      ...r,
      totalIncome: Number(r.totalIncome),
      share: total > 0 ? Math.round(Number(r.totalIncome) / total * 100) : 0
    }))
  });
}).get("/upcoming-payments", async (c) => {
  const { workspaceId } = c.get("auth");
  const now = /* @__PURE__ */ new Date();
  const limit = Number(c.req.query("limit") ?? 5);
  const rows = await db.select({
    id: transactions.id,
    description: transactions.description,
    type: transactions.type,
    amount: transactions.normalizedAmount,
    currency: transactions.workspaceCurrency,
    date: transactions.date,
    projectId: transactions.projectId,
    projectName: projects.name,
    category: transactions.category
  }).from(transactions).innerJoin(projects, eq7(transactions.projectId, projects.id)).where(and7(eq7(projects.workspaceId, workspaceId), gt(transactions.date, now))).orderBy(transactions.date).limit(limit);
  return c.json({ data: rows });
}).get("/income-expense-over-time", async (c) => {
  const { workspaceId } = c.get("auth");
  const period = c.req.query("period") ?? "monthly";
  let truncFn;
  let limit;
  if (period === "yearly") {
    truncFn = "year";
    limit = 5;
  } else if (period === "quarterly") {
    truncFn = "quarter";
    limit = 8;
  } else {
    truncFn = "month";
    limit = 12;
  }
  const truncExpr = sql3`date_trunc(${truncFn}, ${transactions.date})::date`;
  const rows = await db.select({
    period: sql3`date_trunc(${truncFn}, ${transactions.date})::date`,
    income: sql3`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.normalizedAmount} else 0 end), 0)`,
    expenses: sql3`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.normalizedAmount} else 0 end), 0)`
  }).from(transactions).innerJoin(projects, eq7(transactions.projectId, projects.id)).where(eq7(projects.workspaceId, workspaceId)).groupBy(truncExpr).orderBy(sql3`${truncExpr} desc`).limit(limit);
  return c.json({
    data: rows.reverse().map((r) => ({
      period: r.period,
      income: Number(r.income),
      expenses: Number(r.expenses)
    }))
  });
}).get("/transactions", async (c) => {
  const { workspaceId } = c.get("auth");
  const limit = Number(c.req.query("limit") ?? 50);
  const offset = Number(c.req.query("offset") ?? 0);
  const rows = await db.select({
    id: transactions.id,
    description: transactions.description,
    type: transactions.type,
    category: transactions.category,
    amount: transactions.normalizedAmount,
    currency: transactions.workspaceCurrency,
    date: transactions.date,
    projectId: transactions.projectId,
    projectName: projects.name,
    notes: transactions.notes
  }).from(transactions).innerJoin(projects, eq7(transactions.projectId, projects.id)).where(eq7(projects.workspaceId, workspaceId)).orderBy(desc3(transactions.date)).limit(limit).offset(offset);
  return c.json({ data: rows });
});

// src/routes/workspaces.ts
import { Hono as Hono6 } from "hono";
import { zValidator as zValidator5 } from "@hono/zod-validator";
import { eq as eq8 } from "drizzle-orm";
var workspacesRouter = new Hono6().get("/me", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);
  const memberships = await db.query.workspaceMembers.findMany({
    where: eq8(workspaceMembers.userId, session.user.id)
  });
  return c.json({ data: memberships });
}).get("/current", requireAuth, async (c) => {
  const { workspaceId } = c.get("auth");
  const workspace = await db.query.workspaces.findFirst({
    where: eq8(workspaces.id, workspaceId)
  });
  if (!workspace) return c.json({ error: "Not found" }, 404);
  return c.json({ data: workspace });
}).patch("/current", requireAuth, zValidator5("json", updateWorkspaceSchema), async (c) => {
  const { workspaceId } = c.get("auth");
  const body = c.req.valid("json");
  const [updated] = await db.update(workspaces).set({
    ...body.name ? { name: body.name } : {},
    ...body.baseCurrency ? { baseCurrency: body.baseCurrency } : {},
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq8(workspaces.id, workspaceId)).returning();
  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json({ data: updated });
});

// src/routes/actors.ts
import { Hono as Hono7 } from "hono";
import { zValidator as zValidator6 } from "@hono/zod-validator";
import { eq as eq9, and as and8 } from "drizzle-orm";
var actorsRouter = new Hono7().use(requireAuth).get("/", async (c) => {
  const { workspaceId } = c.get("auth");
  const rows = await db.query.actors.findMany({
    where: eq9(actors.workspaceId, workspaceId),
    orderBy: (a, { asc: asc4 }) => [asc4(a.name)]
  });
  return c.json({ data: rows });
}).post("/", zValidator6("json", createActorSchema), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const body = c.req.valid("json");
  const [actor] = await db.insert(actors).values({
    workspaceId,
    name: body.name,
    email: body.email,
    phone: body.phone,
    type: body.type,
    company: body.company,
    notes: body.notes
  }).returning();
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "actor",
    entityId: actor.id,
    action: "created",
    metadata: { name: body.name, type: body.type }
  });
  return c.json({ data: actor }, 201);
}).get("/:id", async (c) => {
  const { workspaceId } = c.get("auth");
  const { id } = c.req.param();
  const actor = await db.query.actors.findFirst({
    where: and8(eq9(actors.id, id), eq9(actors.workspaceId, workspaceId))
  });
  if (!actor) return c.json({ error: "Not found" }, 404);
  return c.json({ data: actor });
}).patch("/:id", zValidator6("json", updateActorSchema), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { id } = c.req.param();
  const body = c.req.valid("json");
  const existing = await db.query.actors.findFirst({
    where: and8(eq9(actors.id, id), eq9(actors.workspaceId, workspaceId))
  });
  if (!existing) return c.json({ error: "Not found" }, 404);
  const [updated] = await db.update(actors).set({ ...body, updatedAt: /* @__PURE__ */ new Date() }).where(eq9(actors.id, id)).returning();
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "actor",
    entityId: id,
    action: "updated",
    diff: { before: existing, after: updated }
  });
  return c.json({ data: updated });
}).delete("/:id", async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { id } = c.req.param();
  const existing = await db.query.actors.findFirst({
    where: and8(eq9(actors.id, id), eq9(actors.workspaceId, workspaceId))
  });
  if (!existing) return c.json({ error: "Not found" }, 404);
  await db.delete(actors).where(eq9(actors.id, id));
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "actor",
    entityId: id,
    action: "deleted",
    diff: { before: existing }
  });
  return c.json({ success: true });
});

// src/routes/projectActors.ts
import { Hono as Hono8 } from "hono";
import { eq as eq10, and as and9 } from "drizzle-orm";
async function verifyProjectAccess3(projectId, workspaceId) {
  return db.query.projects.findFirst({
    where: and9(eq10(projects.id, projectId), eq10(projects.workspaceId, workspaceId))
  });
}
var projectActorsRouter = new Hono8().use(requireAuth).get("/:projectId/actors", async (c) => {
  const { workspaceId } = c.get("auth");
  const { projectId } = c.req.param();
  const project = await verifyProjectAccess3(projectId, workspaceId);
  if (!project) return c.json({ error: "Not found" }, 404);
  const rows = await db.query.projectActors.findMany({
    where: eq10(projectActors.projectId, projectId),
    with: { actor: true }
  });
  return c.json({ data: rows });
}).post("/:projectId/actors", async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { projectId } = c.req.param();
  const body = await c.req.json();
  const project = await verifyProjectAccess3(projectId, workspaceId);
  if (!project) return c.json({ error: "Not found" }, 404);
  const actor = await db.query.actors.findFirst({
    where: and9(eq10(actors.id, body.actorId), eq10(actors.workspaceId, workspaceId))
  });
  if (!actor) return c.json({ error: "Actor not found" }, 404);
  const existing = await db.query.projectActors.findFirst({
    where: and9(eq10(projectActors.projectId, projectId), eq10(projectActors.actorId, body.actorId))
  });
  if (existing) return c.json({ error: "Already linked" }, 409);
  const [row] = await db.insert(projectActors).values({
    projectId,
    actorId: body.actorId,
    role: body.role ?? null
  }).returning();
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "project",
    entityId: projectId,
    action: "member_added",
    metadata: { actorId: body.actorId, role: body.role }
  });
  return c.json({ data: { ...row, actor } }, 201);
}).delete("/:projectId/actors/:actorId", async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { projectId, actorId } = c.req.param();
  const project = await verifyProjectAccess3(projectId, workspaceId);
  if (!project) return c.json({ error: "Not found" }, 404);
  await db.delete(projectActors).where(
    and9(eq10(projectActors.projectId, projectId), eq10(projectActors.actorId, actorId))
  );
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "project",
    entityId: projectId,
    action: "member_removed",
    metadata: { actorId }
  });
  return c.json({ success: true });
});

// src/routes/invitations.ts
import { Hono as Hono9 } from "hono";
import { zValidator as zValidator7 } from "@hono/zod-validator";
import { Resend } from "resend";
import { randomBytes } from "crypto";
import { eq as eq11, and as and10, isNull, gt as gt2 } from "drizzle-orm";
import { createId as createId8 } from "@paralleldrive/cuid2";
var resend = process.env["RESEND_API_KEY"] ? new Resend(process.env["RESEND_API_KEY"]) : null;
var invitationsRouter = new Hono9().get("/", requireAuth, async (c) => {
  const { workspaceId } = c.get("auth");
  const pending = await db.select().from(invitations).where(
    and10(
      eq11(invitations.workspaceId, workspaceId),
      isNull(invitations.acceptedAt),
      gt2(invitations.expiresAt, /* @__PURE__ */ new Date())
    )
  );
  return c.json({ data: pending });
}).get("/members", requireAuth, async (c) => {
  const { workspaceId } = c.get("auth");
  const members = await db.select({
    id: workspaceMembers.id,
    userId: workspaceMembers.userId,
    role: workspaceMembers.role,
    joinedAt: workspaceMembers.joinedAt,
    name: authUser.name,
    email: authUser.email
  }).from(workspaceMembers).leftJoin(authUser, eq11(workspaceMembers.userId, authUser.id)).where(eq11(workspaceMembers.workspaceId, workspaceId));
  return c.json({ data: members });
}).post("/", requireAuth, requireRole("owner", "admin"), zValidator7("json", inviteUserSchema), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { email, role } = c.req.valid("json");
  const existing = await db.query.invitations.findFirst({
    where: and10(
      eq11(invitations.workspaceId, workspaceId),
      eq11(invitations.email, email),
      isNull(invitations.acceptedAt),
      gt2(invitations.expiresAt, /* @__PURE__ */ new Date())
    )
  });
  if (existing) return c.json({ error: "Invite already pending for this email" }, 409);
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
  const [invite] = await db.insert(invitations).values({ id: createId8(), workspaceId, email, role, token, invitedBy: userId, expiresAt }).returning();
  const workspace = await db.query.workspaces.findFirst({
    where: eq11(workspaces.id, workspaceId)
  });
  const inviteUrl = `${process.env["WEB_URL"] ?? "http://localhost:3000"}/invite?token=${token}`;
  if (resend && workspace) {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: `You've been invited to join ${workspace.name}`,
      html: `
          <p>You've been invited to join <strong>${workspace.name}</strong> as a <strong>${role}</strong>.</p>
          <p><a href="${inviteUrl}">Accept invitation</a></p>
          <p>This link expires in 7 days. If you did not expect this invitation, you can ignore this email.</p>
        `
    });
  } else {
    console.log(`[invite] ${email} \u2192 ${inviteUrl}`);
  }
  return c.json({ data: invite }, 201);
}).delete("/:id", requireAuth, requireRole("owner", "admin"), async (c) => {
  const { workspaceId } = c.get("auth");
  const id = c.req.param("id");
  if (!id) return c.json({ error: "ID required" }, 400);
  const [deleted] = await db.delete(invitations).where(and10(eq11(invitations.id, id), eq11(invitations.workspaceId, workspaceId))).returning();
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ data: deleted });
}).get("/accept", async (c) => {
  const token = c.req.query("token");
  if (!token) return c.json({ error: "Token required" }, 400);
  const invite = await db.query.invitations.findFirst({
    where: eq11(invitations.token, token)
  });
  if (!invite) return c.json({ error: "Invalid token" }, 404);
  if (invite.acceptedAt) return c.json({ error: "Invite already accepted" }, 410);
  if (invite.expiresAt < /* @__PURE__ */ new Date()) return c.json({ error: "Invite expired" }, 410);
  const workspace = await db.query.workspaces.findFirst({
    where: eq11(workspaces.id, invite.workspaceId)
  });
  return c.json({
    data: {
      email: invite.email,
      role: invite.role,
      workspaceName: workspace?.name ?? "Unknown workspace",
      expiresAt: invite.expiresAt
    }
  });
}).post("/accept", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  if (!body.token) return c.json({ error: "Token required" }, 400);
  const invite = await db.query.invitations.findFirst({
    where: eq11(invitations.token, body.token)
  });
  if (!invite) return c.json({ error: "Invalid token" }, 404);
  if (invite.acceptedAt) return c.json({ error: "Already accepted" }, 410);
  if (invite.expiresAt < /* @__PURE__ */ new Date()) return c.json({ error: "Invite expired" }, 410);
  if (invite.email !== session.user.email) {
    return c.json({ error: "This invite is for a different email address" }, 403);
  }
  const alreadyMember = await db.query.workspaceMembers.findFirst({
    where: and10(
      eq11(workspaceMembers.workspaceId, invite.workspaceId),
      eq11(workspaceMembers.userId, session.user.id)
    )
  });
  if (alreadyMember) return c.json({ error: "Already a member of this workspace" }, 409);
  const [member] = await db.insert(workspaceMembers).values({
    id: createId8(),
    workspaceId: invite.workspaceId,
    userId: session.user.id,
    role: invite.role
  }).returning();
  await db.update(invitations).set({ acceptedAt: /* @__PURE__ */ new Date() }).where(eq11(invitations.id, invite.id));
  return c.json({ data: { workspaceId: invite.workspaceId, member } });
});

// src/routes/tasks.ts
import { Hono as Hono10 } from "hono";
import { zValidator as zValidator8 } from "@hono/zod-validator";
import { eq as eq12, and as and11, asc as asc3 } from "drizzle-orm";
import { createId as createId9 } from "@paralleldrive/cuid2";
async function verifyProjectAccess4(projectId, workspaceId) {
  return db.query.projects.findFirst({
    where: and11(eq12(projects.id, projectId), eq12(projects.workspaceId, workspaceId))
  });
}
var tasksRouter = new Hono10().use(requireAuth).get("/:projectId/tasks", async (c) => {
  const { workspaceId } = c.get("auth");
  const { projectId } = c.req.param();
  const project = await verifyProjectAccess4(projectId, workspaceId);
  if (!project) return c.json({ error: "Not found" }, 404);
  const rows = await db.select({
    id: tasks.id,
    title: tasks.title,
    description: tasks.description,
    status: tasks.status,
    order: tasks.order,
    dueDate: tasks.dueDate,
    completedAt: tasks.completedAt,
    milestoneId: tasks.milestoneId,
    phaseId: tasks.phaseId,
    createdAt: tasks.createdAt,
    milestoneName: milestones.name,
    phaseName: phases.name
  }).from(tasks).leftJoin(milestones, eq12(tasks.milestoneId, milestones.id)).leftJoin(phases, eq12(tasks.phaseId, phases.id)).where(eq12(tasks.projectId, projectId)).orderBy(asc3(tasks.order), asc3(tasks.createdAt));
  return c.json({ data: rows });
}).post("/:projectId/tasks", zValidator8("json", createTaskSchema), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { projectId } = c.req.param();
  const body = c.req.valid("json");
  const project = await verifyProjectAccess4(projectId, workspaceId);
  if (!project) return c.json({ error: "Not found" }, 404);
  const [task] = await db.insert(tasks).values({
    id: createId9(),
    projectId,
    title: body.title,
    description: body.description,
    status: body.status,
    order: body.order,
    milestoneId: body.milestoneId ?? null,
    phaseId: body.phaseId ?? null,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    createdBy: userId
  }).returning();
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "task",
    entityId: task.id,
    action: "created",
    metadata: { title: task.title, projectId }
  });
  return c.json({ data: task }, 201);
}).patch("/:projectId/tasks/:taskId", zValidator8("json", updateTaskSchema), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { projectId, taskId } = c.req.param();
  const body = c.req.valid("json");
  const project = await verifyProjectAccess4(projectId, workspaceId);
  if (!project) return c.json({ error: "Not found" }, 404);
  const existing = await db.query.tasks.findFirst({
    where: and11(eq12(tasks.id, taskId), eq12(tasks.projectId, projectId))
  });
  if (!existing) return c.json({ error: "Not found" }, 404);
  const isDone = body.status === "done";
  const wasDone = existing.status === "done";
  const [updated] = await db.update(tasks).set({
    ...body.title !== void 0 && { title: body.title },
    ...body.description !== void 0 && { description: body.description },
    ...body.status !== void 0 && { status: body.status },
    ...body.milestoneId !== void 0 && { milestoneId: body.milestoneId },
    ...body.phaseId !== void 0 && { phaseId: body.phaseId },
    ...body.dueDate !== void 0 && { dueDate: body.dueDate ? new Date(body.dueDate) : null },
    ...body.status !== void 0 && { completedAt: isDone && !wasDone ? /* @__PURE__ */ new Date() : wasDone && !isDone ? null : void 0 },
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq12(tasks.id, taskId)).returning();
  if (body.status && body.status !== existing.status) {
    await writeAuditLog({
      workspaceId,
      userId,
      entity: "task",
      entityId: taskId,
      action: body.status === "done" ? "completed" : "updated",
      metadata: { projectId }
    });
  }
  return c.json({ data: updated });
}).delete("/:projectId/tasks/:taskId", async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { projectId, taskId } = c.req.param();
  const project = await verifyProjectAccess4(projectId, workspaceId);
  if (!project) return c.json({ error: "Not found" }, 404);
  await db.delete(tasks).where(and11(eq12(tasks.id, taskId), eq12(tasks.projectId, projectId)));
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "task",
    entityId: taskId,
    action: "deleted",
    metadata: { projectId }
  });
  return c.json({ data: { id: taskId } });
});

// src/routes/invoices.ts
import { Hono as Hono11 } from "hono";
import { zValidator as zValidator9 } from "@hono/zod-validator";
import { eq as eq13, and as and12, desc as desc4, sql as sql4 } from "drizzle-orm";
var invoicesRouter = new Hono11().use(requireAuth).get("/settings", async (c) => {
  const { workspaceId } = c.get("auth");
  const settings = await db.query.invoiceSettings.findFirst({
    where: eq13(invoiceSettings.workspaceId, workspaceId)
  });
  return c.json({ data: settings ?? null });
}).put("/settings", zValidator9("json", upsertInvoiceSettingsSchema), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const body = c.req.valid("json");
  const [result] = await db.insert(invoiceSettings).values({
    workspaceId,
    invoicePrefix: body.invoicePrefix ?? "INV",
    companyName: body.companyName,
    companyAddress: body.companyAddress,
    companyEmail: body.companyEmail,
    companyPhone: body.companyPhone,
    paymentDetails: body.paymentDetails,
    defaultTaxRate: body.defaultTaxRate != null ? String(body.defaultTaxRate) : "0",
    defaultPaymentTermsDays: body.defaultPaymentTermsDays ?? 30
  }).onConflictDoUpdate({
    target: invoiceSettings.workspaceId,
    set: {
      ...body.invoicePrefix && { invoicePrefix: body.invoicePrefix },
      ...body.companyName !== void 0 && { companyName: body.companyName },
      ...body.companyAddress !== void 0 && { companyAddress: body.companyAddress },
      ...body.companyEmail !== void 0 && { companyEmail: body.companyEmail },
      ...body.companyPhone !== void 0 && { companyPhone: body.companyPhone },
      ...body.paymentDetails !== void 0 && { paymentDetails: body.paymentDetails },
      ...body.defaultTaxRate != null && { defaultTaxRate: String(body.defaultTaxRate) },
      ...body.defaultPaymentTermsDays != null && { defaultPaymentTermsDays: body.defaultPaymentTermsDays },
      updatedAt: /* @__PURE__ */ new Date()
    }
  }).returning();
  await writeAuditLog({ workspaceId, userId, entity: "invoice_settings", entityId: workspaceId, action: "updated" });
  return c.json({ data: result });
}).get("/", async (c) => {
  const { workspaceId } = c.get("auth");
  const { status, actorId, projectId } = c.req.query();
  const rows = await db.query.invoices.findMany({
    where: and12(
      eq13(invoices.workspaceId, workspaceId),
      status ? eq13(invoices.status, status) : void 0,
      actorId ? eq13(invoices.actorId, actorId) : void 0,
      projectId ? eq13(invoices.projectId, projectId) : void 0
    ),
    with: { actor: true, project: true },
    orderBy: [desc4(invoices.createdAt)]
  });
  return c.json({ data: rows });
}).post("/", zValidator9("json", createInvoiceSchema), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const body = c.req.valid("json");
  const workspace = await db.query.workspaces.findFirst({
    where: eq13(workspaces.id, workspaceId)
  });
  if (!workspace) return c.json({ error: "Workspace not found" }, 404);
  await db.insert(invoiceSettings).values({ workspaceId, nextSequenceNumber: 1 }).onConflictDoNothing();
  const [settings] = await db.update(invoiceSettings).set({ nextSequenceNumber: sql4`${invoiceSettings.nextSequenceNumber} + 1`, updatedAt: /* @__PURE__ */ new Date() }).where(eq13(invoiceSettings.workspaceId, workspaceId)).returning();
  const sequenceNumber = settings.nextSequenceNumber - 1;
  const invoiceNumber = `${settings.invoicePrefix}-${String(sequenceNumber).padStart(3, "0")}`;
  const subtotal = body.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const taxAmount = subtotal * (body.taxRate / 100);
  const total = subtotal + taxAmount;
  const [invoice] = await db.insert(invoices).values({
    workspaceId,
    projectId: body.projectId ?? null,
    actorId: body.actorId,
    invoiceNumber,
    sequenceNumber,
    status: "draft",
    currency: body.currency,
    subtotal: subtotal.toFixed(2),
    taxRate: String(body.taxRate),
    taxAmount: taxAmount.toFixed(2),
    total: total.toFixed(2),
    paidAmount: "0",
    normalizedTotal: body.normalizedTotal.toFixed(2),
    workspaceCurrency: workspace.baseCurrency,
    issueDate: new Date(body.issueDate),
    dueDate: new Date(body.dueDate),
    notes: body.notes ?? null,
    paymentDetails: settings.paymentDetails ?? null,
    createdBy: userId
  }).returning();
  await db.insert(invoiceItems).values(
    body.items.map((item, i) => ({
      invoiceId: invoice.id,
      description: item.description,
      details: item.details ?? null,
      quantity: String(item.quantity),
      rate: item.rate.toFixed(2),
      amount: (item.quantity * item.rate).toFixed(2),
      sortOrder: item.sortOrder ?? i
    }))
  );
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "invoice",
    entityId: invoice.id,
    action: "created",
    metadata: { invoiceNumber, actorId: body.actorId, total }
  });
  const result = await db.query.invoices.findFirst({
    where: eq13(invoices.id, invoice.id),
    with: { items: true, actor: true }
  });
  return c.json({ data: result }, 201);
}).get("/import-items/:projectId", async (c) => {
  const { workspaceId } = c.get("auth");
  const { projectId } = c.req.param();
  const project = await db.query.projects.findFirst({
    where: and12(eq13(projects.id, projectId), eq13(projects.workspaceId, workspaceId))
  });
  if (!project) return c.json({ error: "Not found" }, 404);
  const [projectTasks, projectMilestones] = await Promise.all([
    db.query.tasks.findMany({
      where: and12(eq13(tasks.projectId, projectId), eq13(tasks.status, "done"))
    }),
    db.query.milestones.findMany({
      where: eq13(milestones.projectId, projectId)
    })
  ]);
  return c.json({
    data: {
      tasks: projectTasks.map((t) => ({
        sourceId: t.id,
        sourceType: "task",
        description: t.title,
        details: t.description ?? null,
        quantity: 1,
        rate: 0
      })),
      milestones: projectMilestones.map((m) => ({
        sourceId: m.id,
        sourceType: "milestone",
        description: m.name,
        details: m.description ?? null,
        quantity: 1,
        rate: 0
      }))
    }
  });
}).get("/:id", async (c) => {
  const { workspaceId } = c.get("auth");
  const { id } = c.req.param();
  const invoice = await db.query.invoices.findFirst({
    where: and12(eq13(invoices.id, id), eq13(invoices.workspaceId, workspaceId)),
    with: { items: true, actor: true, project: true, transactions: true }
  });
  if (!invoice) return c.json({ error: "Not found" }, 404);
  return c.json({ data: invoice });
}).patch("/:id", zValidator9("json", updateInvoiceSchema), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { id } = c.req.param();
  const body = c.req.valid("json");
  const existing = await db.query.invoices.findFirst({
    where: and12(eq13(invoices.id, id), eq13(invoices.workspaceId, workspaceId))
  });
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (existing.status !== "draft") return c.json({ error: "Only draft invoices can be edited" }, 422);
  const updates = { updatedAt: /* @__PURE__ */ new Date() };
  if (body.projectId !== void 0) updates.projectId = body.projectId;
  if (body.actorId) updates.actorId = body.actorId;
  if (body.currency) updates.currency = body.currency;
  if (body.issueDate) updates.issueDate = new Date(body.issueDate);
  if (body.dueDate) updates.dueDate = new Date(body.dueDate);
  if (body.notes !== void 0) updates.notes = body.notes;
  if (body.normalizedTotal != null) updates.normalizedTotal = body.normalizedTotal.toFixed(2);
  if (body.items) {
    const taxRate = body.taxRate ?? Number(existing.taxRate);
    const subtotal = body.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    updates.taxRate = String(taxRate);
    updates.subtotal = subtotal.toFixed(2);
    updates.taxAmount = taxAmount.toFixed(2);
    updates.total = total.toFixed(2);
    await db.delete(invoiceItems).where(eq13(invoiceItems.invoiceId, id));
    await db.insert(invoiceItems).values(
      body.items.map((item, i) => ({
        invoiceId: id,
        description: item.description,
        details: item.details ?? null,
        quantity: String(item.quantity),
        rate: item.rate.toFixed(2),
        amount: (item.quantity * item.rate).toFixed(2),
        sortOrder: item.sortOrder ?? i
      }))
    );
  } else if (body.taxRate !== void 0) {
    const subtotal = Number(existing.subtotal);
    const taxAmount = subtotal * (body.taxRate / 100);
    updates.taxRate = String(body.taxRate);
    updates.taxAmount = taxAmount.toFixed(2);
    updates.total = (subtotal + taxAmount).toFixed(2);
  }
  const [updated] = await db.update(invoices).set(updates).where(eq13(invoices.id, id)).returning();
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "invoice",
    entityId: id,
    action: "updated",
    diff: { before: existing, after: updated }
  });
  const result = await db.query.invoices.findFirst({
    where: eq13(invoices.id, id),
    with: { items: true, actor: true }
  });
  return c.json({ data: result });
}).delete("/:id", async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { id } = c.req.param();
  const existing = await db.query.invoices.findFirst({
    where: and12(eq13(invoices.id, id), eq13(invoices.workspaceId, workspaceId))
  });
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (existing.status !== "draft") return c.json({ error: "Only draft invoices can be deleted" }, 422);
  await db.delete(invoices).where(eq13(invoices.id, id));
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "invoice",
    entityId: id,
    action: "deleted",
    diff: { before: existing }
  });
  return c.json({ success: true });
}).post("/:id/send", async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { id } = c.req.param();
  const existing = await db.query.invoices.findFirst({
    where: and12(eq13(invoices.id, id), eq13(invoices.workspaceId, workspaceId))
  });
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (existing.status !== "draft") return c.json({ error: "Only draft invoices can be sent" }, 422);
  const [updated] = await db.update(invoices).set({ status: "sent", updatedAt: /* @__PURE__ */ new Date() }).where(eq13(invoices.id, id)).returning();
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "invoice",
    entityId: id,
    action: "status_changed",
    metadata: { from: "draft", to: "sent" }
  });
  return c.json({ data: updated });
}).post("/:id/payment", zValidator9("json", recordPaymentSchema), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { id } = c.req.param();
  const body = c.req.valid("json");
  const existing = await db.query.invoices.findFirst({
    where: and12(eq13(invoices.id, id), eq13(invoices.workspaceId, workspaceId))
  });
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (!["sent", "partially_paid"].includes(existing.status)) {
    return c.json({ error: "Payment can only be recorded on sent or partially paid invoices" }, 422);
  }
  const newPaidAmount = Number(existing.paidAmount) + body.amount;
  const newStatus = newPaidAmount >= Number(existing.total) ? "paid" : "partially_paid";
  const [updated] = await db.update(invoices).set({ paidAmount: newPaidAmount.toFixed(2), status: newStatus, updatedAt: /* @__PURE__ */ new Date() }).where(eq13(invoices.id, id)).returning();
  const [tx] = await db.insert(transactions).values({
    projectId: existing.projectId ?? null,
    actorId: existing.actorId,
    invoiceId: id,
    type: "income",
    category: "client_payment",
    description: `Payment for invoice ${existing.invoiceNumber}`,
    amount: body.amount.toFixed(2),
    currency: body.currency,
    normalizedAmount: body.normalizedAmount.toFixed(2),
    workspaceCurrency: existing.workspaceCurrency,
    date: new Date(body.date),
    notes: body.notes ?? null,
    createdBy: userId
  }).returning();
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "invoice",
    entityId: id,
    action: "payment_recorded",
    metadata: { amount: body.amount, newStatus, transactionId: tx.id }
  });
  return c.json({ data: { invoice: updated, transaction: tx } });
}).post("/:id/void", async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { id } = c.req.param();
  const existing = await db.query.invoices.findFirst({
    where: and12(eq13(invoices.id, id), eq13(invoices.workspaceId, workspaceId))
  });
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (existing.status === "void") return c.json({ error: "Invoice is already void" }, 422);
  if (existing.status === "paid") return c.json({ error: "Paid invoices cannot be voided" }, 422);
  const [updated] = await db.update(invoices).set({ status: "void", updatedAt: /* @__PURE__ */ new Date() }).where(eq13(invoices.id, id)).returning();
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "invoice",
    entityId: id,
    action: "status_changed",
    metadata: { from: existing.status, to: "void" }
  });
  return c.json({ data: updated });
});

// src/routes/categories.ts
import { Hono as Hono12 } from "hono";
import { zValidator as zValidator10 } from "@hono/zod-validator";
import { eq as eq14, and as and13, count as count4 } from "drizzle-orm";
var categoriesRouter = new Hono12().use(requireAuth).get("/", async (c) => {
  const { workspaceId } = c.get("auth");
  const { archived } = c.req.query();
  const rows = await db.query.categories.findMany({
    where: and13(
      eq14(categories.workspaceId, workspaceId),
      archived === void 0 ? void 0 : eq14(categories.archived, archived === "true")
    ),
    orderBy: (cat, { asc: asc4 }) => [asc4(cat.name)]
  });
  const counts = await db.select({ categoryId: projects.categoryId, total: count4() }).from(projects).where(eq14(projects.workspaceId, workspaceId)).groupBy(projects.categoryId);
  const countMap = new Map(counts.map((r) => [r.categoryId, r.total]));
  return c.json({
    data: rows.map((cat) => ({ ...cat, projectCount: countMap.get(cat.id) ?? 0 }))
  });
}).post("/", zValidator10("json", createCategorySchema), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const body = c.req.valid("json");
  const [category] = await db.insert(categories).values({
    workspaceId,
    name: body.name,
    color: body.color,
    icon: body.icon,
    description: body.description
  }).returning();
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "category",
    entityId: category.id,
    action: "created",
    metadata: { name: body.name }
  });
  return c.json({ data: category }, 201);
}).get("/:id", async (c) => {
  const { workspaceId } = c.get("auth");
  const { id } = c.req.param();
  const category = await db.query.categories.findFirst({
    where: and13(eq14(categories.id, id), eq14(categories.workspaceId, workspaceId))
  });
  if (!category) return c.json({ error: "Not found" }, 404);
  return c.json({ data: category });
}).patch("/:id", zValidator10("json", updateCategorySchema), async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { id } = c.req.param();
  const body = c.req.valid("json");
  const existing = await db.query.categories.findFirst({
    where: and13(eq14(categories.id, id), eq14(categories.workspaceId, workspaceId))
  });
  if (!existing) return c.json({ error: "Not found" }, 404);
  const [updated] = await db.update(categories).set({ ...body, updatedAt: /* @__PURE__ */ new Date() }).where(eq14(categories.id, id)).returning();
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "category",
    entityId: id,
    action: body.archived !== void 0 && body.archived !== existing.archived ? "archived" : "updated",
    diff: { before: existing, after: updated }
  });
  return c.json({ data: updated });
}).delete("/:id", async (c) => {
  const { workspaceId, userId } = c.get("auth");
  const { id } = c.req.param();
  const existing = await db.query.categories.findFirst({
    where: and13(eq14(categories.id, id), eq14(categories.workspaceId, workspaceId))
  });
  if (!existing) return c.json({ error: "Not found" }, 404);
  await db.delete(categories).where(eq14(categories.id, id));
  await writeAuditLog({
    workspaceId,
    userId,
    entity: "category",
    entityId: id,
    action: "deleted",
    diff: { before: existing }
  });
  return c.json({ success: true });
});

// src/app.ts
var app = new Hono13();
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env["WEB_URL"] ?? "http://localhost:3000",
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "X-Workspace-Id"]
  })
);
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.get("/health", (c) => c.json({ status: "ok" }));
app.get("/api/cron/warm", async (c) => {
  try {
    await db.execute(sql5`select 1`);
    return c.json({ status: "warm" });
  } catch {
    return c.json({ status: "error" }, 500);
  }
});
app.route("/api/projects", projectsRouter);
app.route("/api/projects", phasesRouter);
app.route("/api/projects", milestonesRouter);
app.route("/api/analytics", analyticsRouter);
app.route("/api/workspaces", workspacesRouter);
app.route("/api/actors", actorsRouter);
app.route("/api/projects", projectActorsRouter);
app.route("/api", transactionsRouter);
app.route("/api/invitations", invitationsRouter);
app.route("/api/projects", tasksRouter);
app.route("/api/invoices", invoicesRouter);
app.route("/api/categories", categoriesRouter);
var app_default = app;

// src/vercel.ts
var config = { runtime: "nodejs" };
var vercel_default = getRequestListener(app_default.fetch);
export {
  config,
  vercel_default as default
};
