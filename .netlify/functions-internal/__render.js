var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    if (isBlob(value)) {
      length += value.size;
    } else {
      length += Buffer.byteLength(String(value));
    }
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body } = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const err = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error3) {
    if (error3 instanceof FetchBaseError) {
      throw error3;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error3.message}`, "system", error3);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error3) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error3.message}`, "system", error3);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = src(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send2 = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error3 = new AbortError("The operation was aborted.");
      reject(error3);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error3);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error3);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send2(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (err) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              try {
                headers.set("Location", locationURL);
              } catch (error3) {
                reject(error3);
              }
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
        reject(error3);
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
          reject(error3);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), (error3) => {
              reject(error3);
            });
          } else {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), (error3) => {
              reject(error3);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, src, Readable, wm, Blob, fetchBlob, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    src = dataUriToBuffer;
    ({ Readable } = import_stream.default);
    wm = new WeakMap();
    Blob = class {
      constructor(blobParts = [], options2 = {}) {
        let size = 0;
        const parts = blobParts.map((element) => {
          let buffer;
          if (element instanceof Buffer) {
            buffer = element;
          } else if (ArrayBuffer.isView(element)) {
            buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
          } else if (element instanceof ArrayBuffer) {
            buffer = Buffer.from(element);
          } else if (element instanceof Blob) {
            buffer = element;
          } else {
            buffer = Buffer.from(typeof element === "string" ? element : String(element));
          }
          size += buffer.length || buffer.size || 0;
          return buffer;
        });
        const type = options2.type === void 0 ? "" : String(options2.type).toLowerCase();
        wm.set(this, {
          type: /[^\u0020-\u007E]/.test(type) ? "" : type,
          size,
          parts
        });
      }
      get size() {
        return wm.get(this).size;
      }
      get type() {
        return wm.get(this).type;
      }
      async text() {
        return Buffer.from(await this.arrayBuffer()).toString();
      }
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of this.stream()) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        return Readable.from(read(wm.get(this).parts));
      }
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = wm.get(this).parts.values();
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            const chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
            blobParts.push(chunk);
            added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
            relativeStart = 0;
            if (added >= span) {
              break;
            }
          }
        }
        const blob = new Blob([], { type: String(type).toLowerCase() });
        Object.assign(wm.get(blob), { size: span, parts: blobParts });
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    fetchBlob = Blob;
    FetchBaseError = class extends Error {
      constructor(message, type) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message, type, systemError) {
        super(message, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && object[NAME] === "AbortSignal";
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body, {
        size = 0
      } = {}) {
        let boundary = null;
        if (body === null) {
          body = null;
        } else if (isURLSearchParameters(body)) {
          body = Buffer.from(body.toString());
        } else if (isBlob(body))
          ;
        else if (Buffer.isBuffer(body))
          ;
        else if (import_util.types.isAnyArrayBuffer(body)) {
          body = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else if (body instanceof import_stream.default)
          ;
        else if (isFormData(body)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body = import_stream.default.Readable.from(formDataIterator(body, boundary));
        } else {
          body = Buffer.from(String(body));
        }
        this[INTERNALS$2] = {
          body,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size;
        if (body instanceof import_stream.default) {
          body.on("error", (err) => {
            const error3 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
            this[INTERNALS$2].error = error3;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new fetchBlob([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body = p2;
      }
      return body;
    };
    extractContentType = (body, request) => {
      if (body === null) {
        return null;
      }
      if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body)) {
        return body.type || null;
      }
      if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
        return null;
      }
      if (body && typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      }
      if (isFormData(body)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body } = request;
      if (body === null) {
        return 0;
      }
      if (isBlob(body)) {
        return body.size;
      }
      if (Buffer.isBuffer(body)) {
        return body.length;
      }
      if (body && typeof body.getLengthSync === "function") {
        return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
      }
      if (isFormData(body)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body }) => {
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        body.stream().pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
        const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw err;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const err = new TypeError(`Invalid character in header content ["${name}"]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_CHAR" });
        throw err;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name, value]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [String(name).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p, receiver) {
            switch (p) {
              case "append":
              case "set":
                return (name, value) => {
                  validateHeaderName(name);
                  validateHeaderValue(name, String(value));
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name) => {
                  validateHeaderName(name);
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name) {
        const values = this.getAll(name);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback) {
        for (const name of this.keys()) {
          callback(this.get(name), name);
        }
      }
      *values() {
        for (const name of this.keys()) {
          yield this.get(name);
        }
      }
      *entries() {
        for (const name of this.keys()) {
          yield [name, this.get(name)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body = null, options2 = {}) {
        super(body, options2);
        const status = options2.status || 200;
        const headers = new Headers(options2.headers);
        if (body !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url).toString()
          },
          status
        });
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal !== null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message, type = "aborted") {
        super(message, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
  }
});

// node_modules/@sveltejs/adapter-netlify/files/shims.js
var init_shims = __esm({
  "node_modules/@sveltejs/adapter-netlify/files/shims.js"() {
    init_install_fetch();
  }
});

// node_modules/cookie/index.js
var require_cookie = __commonJS({
  "node_modules/cookie/index.js"(exports) {
    init_shims();
    "use strict";
    exports.parse = parse;
    exports.serialize = serialize;
    var decode = decodeURIComponent;
    var encode = encodeURIComponent;
    var pairSplitRegExp = /; */;
    var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
    function parse(str, options2) {
      if (typeof str !== "string") {
        throw new TypeError("argument str must be a string");
      }
      var obj = {};
      var opt = options2 || {};
      var pairs = str.split(pairSplitRegExp);
      var dec = opt.decode || decode;
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var eq_idx = pair.indexOf("=");
        if (eq_idx < 0) {
          continue;
        }
        var key = pair.substr(0, eq_idx).trim();
        var val = pair.substr(++eq_idx, pair.length).trim();
        if (val[0] == '"') {
          val = val.slice(1, -1);
        }
        if (obj[key] == void 0) {
          obj[key] = tryDecode(val, dec);
        }
      }
      return obj;
    }
    function serialize(name, val, options2) {
      var opt = options2 || {};
      var enc = opt.encode || encode;
      if (typeof enc !== "function") {
        throw new TypeError("option encode is invalid");
      }
      if (!fieldContentRegExp.test(name)) {
        throw new TypeError("argument name is invalid");
      }
      var value = enc(val);
      if (value && !fieldContentRegExp.test(value)) {
        throw new TypeError("argument val is invalid");
      }
      var str = name + "=" + value;
      if (opt.maxAge != null) {
        var maxAge = opt.maxAge - 0;
        if (isNaN(maxAge) || !isFinite(maxAge)) {
          throw new TypeError("option maxAge is invalid");
        }
        str += "; Max-Age=" + Math.floor(maxAge);
      }
      if (opt.domain) {
        if (!fieldContentRegExp.test(opt.domain)) {
          throw new TypeError("option domain is invalid");
        }
        str += "; Domain=" + opt.domain;
      }
      if (opt.path) {
        if (!fieldContentRegExp.test(opt.path)) {
          throw new TypeError("option path is invalid");
        }
        str += "; Path=" + opt.path;
      }
      if (opt.expires) {
        if (typeof opt.expires.toUTCString !== "function") {
          throw new TypeError("option expires is invalid");
        }
        str += "; Expires=" + opt.expires.toUTCString();
      }
      if (opt.httpOnly) {
        str += "; HttpOnly";
      }
      if (opt.secure) {
        str += "; Secure";
      }
      if (opt.sameSite) {
        var sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
        switch (sameSite) {
          case true:
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError("option sameSite is invalid");
        }
      }
      return str;
    }
    function tryDecode(str, decode2) {
      try {
        return decode2(str);
      } catch (e) {
        return str;
      }
    }
  }
});

// node_modules/universal-cookie/cjs/utils.js
var require_utils = __commonJS({
  "node_modules/universal-cookie/cjs/utils.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.hasDocumentCookie = hasDocumentCookie;
    exports.cleanCookies = cleanCookies;
    exports.parseCookies = parseCookies;
    exports.isParsingCookie = isParsingCookie;
    exports.readCookie = readCookie;
    var cookie2 = _interopRequireWildcard(require_cookie());
    function _getRequireWildcardCache() {
      if (typeof WeakMap !== "function")
        return null;
      var cache = new WeakMap();
      _getRequireWildcardCache = function _getRequireWildcardCache2() {
        return cache;
      };
      return cache;
    }
    function _interopRequireWildcard(obj) {
      if (obj && obj.__esModule) {
        return obj;
      }
      if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") {
        return { "default": obj };
      }
      var cache = _getRequireWildcardCache();
      if (cache && cache.has(obj)) {
        return cache.get(obj);
      }
      var newObj = {};
      var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
          if (desc && (desc.get || desc.set)) {
            Object.defineProperty(newObj, key, desc);
          } else {
            newObj[key] = obj[key];
          }
        }
      }
      newObj["default"] = obj;
      if (cache) {
        cache.set(obj, newObj);
      }
      return newObj;
    }
    function _typeof(obj) {
      if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
        _typeof = function _typeof2(obj2) {
          return typeof obj2;
        };
      } else {
        _typeof = function _typeof2(obj2) {
          return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
        };
      }
      return _typeof(obj);
    }
    function hasDocumentCookie() {
      return (typeof document === "undefined" ? "undefined" : _typeof(document)) === "object" && typeof document.cookie === "string";
    }
    function cleanCookies() {
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    }
    function parseCookies(cookies, options2) {
      if (typeof cookies === "string") {
        return cookie2.parse(cookies, options2);
      } else if (_typeof(cookies) === "object" && cookies !== null) {
        return cookies;
      } else {
        return {};
      }
    }
    function isParsingCookie(value, doNotParse) {
      if (typeof doNotParse === "undefined") {
        doNotParse = !value || value[0] !== "{" && value[0] !== "[" && value[0] !== '"';
      }
      return !doNotParse;
    }
    function readCookie(value, options2) {
      if (options2 === void 0) {
        options2 = {};
      }
      var cleanValue = cleanupCookieValue(value);
      if (isParsingCookie(cleanValue, options2.doNotParse)) {
        try {
          return JSON.parse(cleanValue);
        } catch (e) {
        }
      }
      return value;
    }
    function cleanupCookieValue(value) {
      if (value && value[0] === "j" && value[1] === ":") {
        return value.substr(2);
      }
      return value;
    }
  }
});

// node_modules/universal-cookie/cjs/Cookies.js
var require_Cookies = __commonJS({
  "node_modules/universal-cookie/cjs/Cookies.js"(exports, module2) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = void 0;
    var cookie2 = _interopRequireWildcard(require_cookie());
    var _utils = require_utils();
    function _getRequireWildcardCache() {
      if (typeof WeakMap !== "function")
        return null;
      var cache = new WeakMap();
      _getRequireWildcardCache = function _getRequireWildcardCache2() {
        return cache;
      };
      return cache;
    }
    function _interopRequireWildcard(obj) {
      if (obj && obj.__esModule) {
        return obj;
      }
      if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") {
        return { "default": obj };
      }
      var cache = _getRequireWildcardCache();
      if (cache && cache.has(obj)) {
        return cache.get(obj);
      }
      var newObj = {};
      var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
          if (desc && (desc.get || desc.set)) {
            Object.defineProperty(newObj, key, desc);
          } else {
            newObj[key] = obj[key];
          }
        }
      }
      newObj["default"] = obj;
      if (cache) {
        cache.set(obj, newObj);
      }
      return newObj;
    }
    function _typeof(obj) {
      if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
        _typeof = function _typeof2(obj2) {
          return typeof obj2;
        };
      } else {
        _typeof = function _typeof2(obj2) {
          return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
        };
      }
      return _typeof(obj);
    }
    var __assign = function() {
      __assign = Object.assign || function(t) {
        for (var s2, i = 1, n = arguments.length; i < n; i++) {
          s2 = arguments[i];
          for (var p in s2) {
            if (Object.prototype.hasOwnProperty.call(s2, p))
              t[p] = s2[p];
          }
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    var Cookies = function() {
      function Cookies2(cookies, options2) {
        var _this = this;
        this.changeListeners = [];
        this.HAS_DOCUMENT_COOKIE = false;
        this.cookies = (0, _utils.parseCookies)(cookies, options2);
        new Promise(function() {
          _this.HAS_DOCUMENT_COOKIE = (0, _utils.hasDocumentCookie)();
        })["catch"](function() {
        });
      }
      Cookies2.prototype._updateBrowserValues = function(parseOptions) {
        if (!this.HAS_DOCUMENT_COOKIE) {
          return;
        }
        this.cookies = cookie2.parse(document.cookie, parseOptions);
      };
      Cookies2.prototype._emitChange = function(params) {
        for (var i = 0; i < this.changeListeners.length; ++i) {
          this.changeListeners[i](params);
        }
      };
      Cookies2.prototype.get = function(name, options2, parseOptions) {
        if (options2 === void 0) {
          options2 = {};
        }
        this._updateBrowserValues(parseOptions);
        return (0, _utils.readCookie)(this.cookies[name], options2);
      };
      Cookies2.prototype.getAll = function(options2, parseOptions) {
        if (options2 === void 0) {
          options2 = {};
        }
        this._updateBrowserValues(parseOptions);
        var result = {};
        for (var name_1 in this.cookies) {
          result[name_1] = (0, _utils.readCookie)(this.cookies[name_1], options2);
        }
        return result;
      };
      Cookies2.prototype.set = function(name, value, options2) {
        var _a;
        if (_typeof(value) === "object") {
          value = JSON.stringify(value);
        }
        this.cookies = __assign(__assign({}, this.cookies), (_a = {}, _a[name] = value, _a));
        if (this.HAS_DOCUMENT_COOKIE) {
          document.cookie = cookie2.serialize(name, value, options2);
        }
        this._emitChange({
          name,
          value,
          options: options2
        });
      };
      Cookies2.prototype.remove = function(name, options2) {
        var finalOptions = options2 = __assign(__assign({}, options2), {
          expires: new Date(1970, 1, 1, 0, 0, 1),
          maxAge: 0
        });
        this.cookies = __assign({}, this.cookies);
        delete this.cookies[name];
        if (this.HAS_DOCUMENT_COOKIE) {
          document.cookie = cookie2.serialize(name, "", finalOptions);
        }
        this._emitChange({
          name,
          value: void 0,
          options: options2
        });
      };
      Cookies2.prototype.addChangeListener = function(callback) {
        this.changeListeners.push(callback);
      };
      Cookies2.prototype.removeChangeListener = function(callback) {
        var idx = this.changeListeners.indexOf(callback);
        if (idx >= 0) {
          this.changeListeners.splice(idx, 1);
        }
      };
      return Cookies2;
    }();
    var _default = Cookies;
    exports["default"] = _default;
    module2.exports = exports.default;
  }
});

// node_modules/universal-cookie/cjs/index.js
var require_cjs = __commonJS({
  "node_modules/universal-cookie/cjs/index.js"(exports, module2) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = void 0;
    var _Cookies = _interopRequireDefault(require_Cookies());
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var _default = _Cookies["default"];
    exports["default"] = _default;
    module2.exports = exports.default;
  }
});

// .svelte-kit/netlify/entry.js
__export(exports, {
  handler: () => handler
});
init_shims();

// .svelte-kit/output/server/app.js
init_shims();

// node_modules/@sveltejs/kit/dist/ssr.js
init_shims();

// node_modules/@sveltejs/kit/dist/adapter-utils.js
init_shims();
function isContentTypeTextual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}

// node_modules/@sveltejs/kit/dist/ssr.js
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto2 = Object.getPrototypeOf(thing);
          if (proto2 !== Object.prototype && proto2 !== null && Object.getOwnPropertyNames(proto2).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto2 = Object.getPrototypeOf(thing);
        if (proto2 === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
var subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = [];
  function set2(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set2(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set2) || noop;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set: set2, update, subscribe: subscribe2 };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
var s$1 = JSON.stringify;
async function render_response({
  options: options2,
  $session,
  page_config,
  status,
  error: error3,
  branch,
  page: page2
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error3) {
    error3.stack = options2.get_stack(error3);
  }
  if (branch) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session2 = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session: session2
      },
      page: page2,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session2.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error4) => {
      throw new Error(`Failed to serialize session data: ${error4.message}`);
    })},
				host: ${page2 && page2.host ? s$1(page2.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error3)},
					nodes: [
						${branch.map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page2.host ? s$1(page2.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page2.path)},
						query: new URLSearchParams(${s$1(page2.query.toString())}),
						params: ${s$1(page2.params)}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url="${url}"`;
    if (body2)
      attributes += ` data-body="${hash(body2)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error3) {
  if (!error3)
    return null;
  let serialized = try_serialize(error3);
  if (!serialized) {
    const { name, message, stack } = error3;
    serialized = try_serialize({ ...error3, name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  if (loaded.error) {
    const error3 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    const status = loaded.status;
    if (!(error3 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error3}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error3 };
    }
    return { status, error: error3 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
function resolve(base, path) {
  const baseparts = path[0] === "/" ? [] : base.slice(1).split("/");
  const pathparts = path[0] === "/" ? path.slice(1).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  return `/${baseparts.join("/")}`;
}
var s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page: page2,
  node,
  $session,
  context,
  is_leaf,
  is_error,
  status,
  error: error3
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let loaded;
  if (module2.load) {
    const load_input = {
      page: page2,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        if (options2.read && url.startsWith(options2.paths.assets)) {
          url = url.replace(options2.paths.assets, "");
        }
        if (url.startsWith("//")) {
          throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
        }
        let response;
        if (/^[a-zA-Z]+:/.test(url)) {
          const request2 = new Request(url, opts);
          response = await options2.hooks.serverFetch.call(null, request2);
        } else {
          const [path, search] = url.split("?");
          const resolved = resolve(request.path, path);
          const filename = resolved.slice(1);
          const filename_html = `${filename}/index.html`;
          const asset = options2.manifest.assets.find((d2) => d2.file === filename || d2.file === filename_html);
          if (asset) {
            if (options2.read) {
              response = new Response(options2.read(asset.file), {
                headers: {
                  "content-type": asset.type
                }
              });
            } else {
              response = await fetch(`http://${page2.host}/${asset.file}`, opts);
            }
          }
          if (!response) {
            const headers = { ...opts.headers };
            if (opts.credentials !== "omit") {
              uses_credentials = true;
              headers.cookie = request.headers.cookie;
              if (!headers.authorization) {
                headers.authorization = request.headers.authorization;
              }
            }
            if (opts.body && typeof opts.body !== "string") {
              throw new Error("Request body must be a string");
            }
            const rendered = await respond({
              host: request.host,
              method: opts.method || "GET",
              headers,
              path: resolved,
              rawBody: opts.body,
              query: new URLSearchParams(search)
            }, options2, {
              fetched: url,
              initiator: route
            });
            if (rendered) {
              if (state.prerender) {
                state.prerender.dependencies.set(resolved, rendered);
              }
              response = new Response(rendered.body, {
                status: rendered.status,
                headers: rendered.headers
              });
            }
          }
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 !== "etag" && key2 !== "set-cookie")
                    headers[key2] = value;
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape(body)}}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      context: { ...context }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error3;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    uses_credentials
  };
}
var escaped = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped) {
      result += escaped[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error3 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page2 = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page: page2,
    node: default_layout,
    $session,
    context: {},
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page: page2,
      node: default_error,
      $session,
      context: loaded.context,
      is_leaf: false,
      is_error: true,
      status,
      error: error3
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error3,
      branch,
      page: page2
    });
  } catch (error4) {
    options2.handle_error(error4);
    return {
      status: 500,
      headers: {},
      body: error4.stack
    };
  }
}
async function respond$1({ request, options: options2, state, $session, route }) {
  const match = route.pattern.exec(request.path);
  const params = route.params(match);
  const page2 = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id && options2.load_component(id)));
  } catch (error4) {
    options2.handle_error(error4);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error4
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  const page_config = {
    ssr: "ssr" in leaf ? leaf.ssr : options2.ssr,
    router: "router" in leaf ? leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? leaf.hydrate : options2.hydrate
  };
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {},
      body: null
    };
  }
  let branch;
  let status = 200;
  let error3;
  ssr:
    if (page_config.ssr) {
      let context = {};
      branch = [];
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              request,
              options: options2,
              state,
              route,
              page: page2,
              node,
              $session,
              context,
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            if (loaded.loaded.redirect) {
              return {
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              };
            }
            if (loaded.loaded.error) {
              ({ status, error: error3 } = loaded.loaded);
            }
          } catch (e) {
            options2.handle_error(e);
            status = 500;
            error3 = e;
          }
          if (error3) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let error_loaded;
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  error_loaded = await load_node({
                    request,
                    options: options2,
                    state,
                    route,
                    page: page2,
                    node: error_node,
                    $session,
                    context: node_loaded.context,
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error3
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (e) {
                  options2.handle_error(e);
                  continue;
                }
              }
            }
            return await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error3
            });
          }
        }
        branch.push(loaded);
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return await render_response({
      options: options2,
      $session,
      page_config,
      status,
      error: error3,
      branch: branch && branch.filter(Boolean),
      page: page2
    });
  } catch (error4) {
    options2.handle_error(error4);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error4
    });
  }
}
async function render_page(request, route, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const $session = await options2.hooks.getSession(request);
  if (route) {
    const response = await respond$1({
      request,
      options: options2,
      state,
      $session,
      route
    });
    if (response) {
      return response;
    }
    if (state.fetched) {
      return {
        status: 500,
        headers: {},
        body: `Bad request in load function: failed to fetch ${state.fetched}`
      };
    }
  } else {
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 404,
      error: new Error(`Not found: ${request.path}`)
    });
  }
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function error(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
function is_string(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}
async function render_route(request, route) {
  const mod = await route.load();
  const handler2 = mod[request.method.toLowerCase().replace("delete", "del")];
  if (handler2) {
    const match = route.pattern.exec(request.path);
    const params = route.params(match);
    const response = await handler2({ ...request, params });
    const preface = `Invalid response from route ${request.path}`;
    if (response) {
      if (typeof response !== "object") {
        return error(`${preface}: expected an object, got ${typeof response}`);
      }
      let { status = 200, body, headers = {} } = response;
      headers = lowercase_keys(headers);
      const type = headers["content-type"];
      const is_type_textual = isContentTypeTextual(type);
      if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
        return error(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
      }
      let normalized_body;
      if ((typeof body === "object" || typeof body === "undefined") && !(body instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
        headers = { ...headers, "content-type": "application/json; charset=utf-8" };
        normalized_body = JSON.stringify(typeof body === "undefined" ? {} : body);
      } else {
        normalized_body = body;
      }
      return { status, body: normalized_body, headers };
    }
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        map.get(key).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
var ReadOnlyFormData = class {
  #map;
  constructor(map) {
    this.#map = map;
  }
  get(key) {
    const value = this.#map.get(key);
    return value && value[0];
  }
  getAll(key) {
    return this.#map.get(key);
  }
  has(key) {
    return this.#map.has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *entries() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *keys() {
    for (const [key] of this.#map)
      yield key;
  }
  *values() {
    for (const [, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield value[i];
      }
    }
  }
};
function parse_body(raw, headers) {
  if (!raw)
    return raw;
  const [type, ...directives] = headers["content-type"].split(/;\s*/);
  if (typeof raw === "string") {
    switch (type) {
      case "text/plain":
        return raw;
      case "application/json":
        return JSON.parse(raw);
      case "application/x-www-form-urlencoded":
        return get_urlencoded(raw);
      case "multipart/form-data": {
        const boundary = directives.find((directive) => directive.startsWith("boundary="));
        if (!boundary)
          throw new Error("Missing boundary");
        return get_multipart(raw, boundary.slice("boundary=".length));
      }
      default:
        throw new Error(`Invalid Content-Type ${type}`);
    }
  }
  return raw;
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  const nope = () => {
    throw new Error("Malformed form data");
  };
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    nope();
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          nope();
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      nope();
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !incoming.path.split("/").pop().includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: encodeURI(path + (q ? `?${q}` : ""))
        }
      };
    }
  }
  try {
    const headers = lowercase_keys(incoming.headers);
    return await options2.hooks.handle({
      request: {
        ...incoming,
        headers,
        body: parse_body(incoming.rawBody, headers),
        params: null,
        locals: {}
      },
      resolve: async (request) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            error: null,
            branch: [],
            page: null
          });
        }
        for (const route of options2.manifest.routes) {
          if (!route.pattern.test(request.path))
            continue;
          const response = route.type === "endpoint" ? await render_route(request, route) : await render_page(request, route, options2, state);
          if (response) {
            if (response.status === 200) {
              if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
                const etag = `"${hash(response.body)}"`;
                if (request.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: null
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        return await render_page(request, null, options2, state);
      }
    });
  } catch (e) {
    options2.handle_error(e);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}

// .svelte-kit/output/server/app.js
var import_cookie = __toModule(require_cookie());
var import_universal_cookie = __toModule(require_cjs());
function noop2() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function safe_not_equal2(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop2;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function custom_event(type, detail) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, false, false, detail);
  return e;
}
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
  get_current_component().$$.after_update.push(fn);
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      const event = custom_event(type, detail);
      callbacks.slice().forEach((fn) => {
        fn.call(component, event);
      });
    }
  };
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
function getContext(key) {
  return get_current_component().$$.context.get(key);
}
Promise.resolve();
var escaped2 = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape2(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped2[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
var missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
var on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape2(value)) : `"${value}"`}`}`;
}
var css$o = {
  code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n<\/script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>\\n\\t#svelte-announcer {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 0;\\n\\t\\tclip: rect(0 0 0 0);\\n\\t\\tclip-path: inset(50%);\\n\\t\\toverflow: hidden;\\n\\t\\twhite-space: nowrap;\\n\\t\\twidth: 1px;\\n\\t\\theight: 1px;\\n\\t}\\n</style>"],"names":[],"mappings":"AAsDC,iBAAiB,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,SAAS,CAAE,MAAM,GAAG,CAAC,CACrB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,AACZ,CAAC"}`
};
var Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { stores } = $$props;
  let { page: page2 } = $$props;
  let { components } = $$props;
  let { props_0 = null } = $$props;
  let { props_1 = null } = $$props;
  let { props_2 = null } = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  let mounted = false;
  let navigated = false;
  let title = null;
  onMount(() => {
    const unsubscribe = stores.page.subscribe(() => {
      if (mounted) {
        navigated = true;
        title = document.title || "untitled page";
      }
    });
    mounted = true;
    return unsubscribe;
  });
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page2 !== void 0)
    $$bindings.page(page2);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  $$result.css.add(css$o);
  {
    stores.page.set(page2);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
    })}` : ``}`
  })}

${mounted ? `<div id="${"svelte-announcer"}" aria-live="${"assertive"}" aria-atomic="${"true"}" class="${"svelte-1j55zn5"}">${navigated ? `${escape2(title)}` : ``}</div>` : ``}`;
});
function set_paths(paths) {
}
function set_prerendering(value) {
}
var COOKIE_AUTH_KEY_NAME = "kennel_app_access_token_cookie";
var API_URL = "http://localhost:3001";
var subscriber_queue2 = [];
function writable2(value, start = noop2) {
  let stop;
  const subscribers = [];
  function set2(new_value) {
    if (safe_not_equal2(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue2.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue2.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue2.length; i += 2) {
            subscriber_queue2[i][0](subscriber_queue2[i + 1]);
          }
          subscriber_queue2.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set2(fn(value));
  }
  function subscribe2(run2, invalidate = noop2) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set2) || noop2;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set: set2, update, subscribe: subscribe2 };
}
var cookie = new import_universal_cookie.default();
var cookieToken = cookie.get(COOKIE_AUTH_KEY_NAME);
var send = async ({ method, path, data, token }) => {
  const opts = { method, headers: {} };
  opts.mode = "cors";
  console.log("fetching", method, path);
  if (data) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(data);
  }
  if (token) {
    opts.headers["Authorization"] = `Bearer ${token}`;
  } else if (cookieToken) {
    opts.headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}/${path}`, opts);
  if (res.ok) {
    console.log("OK", method, path);
    return await res.json();
  } else {
    try {
      console.log("trying to parse error json");
      let json = await res.json();
      console.log(json);
      throw new Error(JSON.stringify(json));
    } catch (err) {
      console.log("NOT OK", method, path);
      console.log(err);
      throw new Error(err);
    }
  }
};
var post$1 = async ({ path, data, token }) => {
  return await send({ method: "POST", path, data, token });
};
var patch = async ({ path, data, token }) => {
  return await send({ method: "PATCH", path, data, token });
};
var get = async ({ path, token }) => {
  return await send({ method: "GET", path, token });
};
var { set } = writable2({});
var me = async (token) => {
  try {
    const user = await get({ path: "api/v1/users/me", token });
    set(user.data);
    return user.data;
  } catch (err) {
    set({});
  }
};
var handle = async ({ request, resolve: resolve2 }) => {
  const cookies = import_cookie.default.parse(request.headers.cookie || "");
  request.locals.token = cookies[COOKIE_AUTH_KEY_NAME];
  if (request.query.has("_method")) {
    request.method = request.query.get("_method").toUpperCase();
  }
  try {
    const user = await me(request.locals.token);
    request.locals.user = user;
  } catch (err) {
    request.locals.user = null;
  }
  const response = await resolve2(request);
  if (!cookies.userid) {
    response.headers["set-cookie"] = `userid=${request.locals.userid}; Path=/; HttpOnly`;
  }
  return response;
};
var getSession = async ({ locals }) => {
  return {
    user: locals.user,
    token: locals.token
  };
};
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  handle,
  getSession
});
var template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <link rel="icon" href="/favicon.png" />\n    <link rel="stylesheet" href="/app.css" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n\n    ' + head + '\n  </head>\n  <body>\n    <div id="svelte">' + body + "</div>\n  </body>\n</html>\n";
var options = null;
var default_settings = { paths: { "base": "", "assets": "/." } };
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: "/./_app/start-0d5d0935.js",
      css: ["/./_app/assets/start-a8cd1609.css"],
      js: ["/./_app/start-0d5d0935.js", "/./_app/chunks/vendor-243478b0.js", "/./_app/chunks/singletons-bb9012b7.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => "/./_app/" + entry_lookup[id],
    get_stack: (error22) => String(error22),
    handle_error: (error22) => {
      if (error22.frame) {
        console.error(error22.frame);
      }
      console.error(error22.stack);
      error22.stack = options.get_stack(error22);
    },
    hooks: get_hooks(user_hooks),
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    read: settings.read,
    root: Root,
    service_worker: null,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
var d = decodeURIComponent;
var empty = () => ({});
var manifest = {
  assets: [{ "file": "app.css", "size": 713, "type": "text/css" }, { "file": "favicon.png", "size": 1571, "type": "image/png" }, { "file": "robots.txt", "size": 67, "type": "text/plain" }, { "file": "svelte-welcome.png", "size": 360807, "type": "image/png" }, { "file": "svelte-welcome.webp", "size": 115470, "type": "image/webp" }, { "file": "theme/dark.css", "size": 618, "type": "text/css" }, { "file": "theme/light.css", "size": 2272, "type": "text/css" }],
  layout: "src/routes/__layout.svelte",
  error: ".svelte-kit/build/components/error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/signup\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/signup.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/login\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/login.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "endpoint",
      pattern: /^\/auth\/logout\/?$/,
      params: empty,
      load: () => Promise.resolve().then(function() {
        return logout$1;
      })
    },
    {
      type: "page",
      pattern: /^\/app\/?$/,
      params: empty,
      a: ["src/routes/app/__layout.reset.svelte", "src/routes/app/index.svelte"],
      b: []
    },
    {
      type: "page",
      pattern: /^\/app\/createBooking\/?$/,
      params: empty,
      a: ["src/routes/app/__layout.reset.svelte", "src/routes/app/createBooking.svelte"],
      b: []
    },
    {
      type: "page",
      pattern: /^\/app\/createPet\/?$/,
      params: empty,
      a: ["src/routes/app/__layout.reset.svelte", "src/routes/app/createPet.svelte"],
      b: []
    },
    {
      type: "page",
      pattern: /^\/app\/bookings\/?$/,
      params: empty,
      a: ["src/routes/app/__layout.reset.svelte", "src/routes/app/bookings/index.svelte"],
      b: []
    },
    {
      type: "page",
      pattern: /^\/app\/bookings\/([^/]+?)\/?$/,
      params: (m) => ({ id: d(m[1]) }),
      a: ["src/routes/app/__layout.reset.svelte", "src/routes/app/bookings/[id].svelte"],
      b: []
    },
    {
      type: "page",
      pattern: /^\/app\/profile\/?$/,
      params: empty,
      a: ["src/routes/app/__layout.reset.svelte", "src/routes/app/profile.svelte"],
      b: []
    },
    {
      type: "page",
      pattern: /^\/app\/logout\/?$/,
      params: empty,
      a: ["src/routes/app/__layout.reset.svelte", "src/routes/app/logout.svelte"],
      b: []
    },
    {
      type: "page",
      pattern: /^\/app\/pets\/?$/,
      params: empty,
      a: ["src/routes/app/__layout.reset.svelte", "src/routes/app/pets/index.svelte"],
      b: []
    },
    {
      type: "page",
      pattern: /^\/app\/pets\/([^/]+?)\/?$/,
      params: (m) => ({ id: d(m[1]) }),
      a: ["src/routes/app/__layout.reset.svelte", "src/routes/app/pets/[id].svelte"],
      b: []
    },
    {
      type: "page",
      pattern: /^\/app\/o\/?$/,
      params: empty,
      a: ["src/routes/app/__layout.reset.svelte", "src/routes/app/o/index.svelte"],
      b: []
    },
    {
      type: "page",
      pattern: /^\/app\/o\/createOrganization\/?$/,
      params: empty,
      a: ["src/routes/app/__layout.reset.svelte", "src/routes/app/o/createOrganization.svelte"],
      b: []
    },
    {
      type: "page",
      pattern: /^\/app\/o\/([^/]+?)\/?$/,
      params: (m) => ({ orgId: d(m[1]) }),
      a: ["src/routes/app/__layout.reset.svelte", "src/routes/app/o/[orgId]/index.svelte"],
      b: []
    },
    {
      type: "page",
      pattern: /^\/app\/o\/([^/]+?)\/createLocation\/?$/,
      params: (m) => ({ orgId: d(m[1]) }),
      a: ["src/routes/app/__layout.reset.svelte", "src/routes/app/o/[orgId]/createLocation.svelte"],
      b: []
    },
    {
      type: "page",
      pattern: /^\/app\/o\/([^/]+?)\/l\/([^/]+?)\/?$/,
      params: (m) => ({ orgId: d(m[1]), locId: d(m[2]) }),
      a: ["src/routes/app/__layout.reset.svelte", "src/routes/app/o/[orgId]/l/[locId]/index.svelte"],
      b: []
    }
  ]
};
var get_hooks = (hooks) => ({
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
  serverFetch: hooks.serverFetch || fetch
});
var module_lookup = {
  "src/routes/__layout.svelte": () => Promise.resolve().then(function() {
    return __layout;
  }),
  ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(function() {
    return error2;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index$6;
  }),
  "src/routes/signup.svelte": () => Promise.resolve().then(function() {
    return signup;
  }),
  "src/routes/login.svelte": () => Promise.resolve().then(function() {
    return login;
  }),
  "src/routes/app/__layout.reset.svelte": () => Promise.resolve().then(function() {
    return __layout_reset;
  }),
  "src/routes/app/index.svelte": () => Promise.resolve().then(function() {
    return index$5;
  }),
  "src/routes/app/createBooking.svelte": () => Promise.resolve().then(function() {
    return createBooking;
  }),
  "src/routes/app/createPet.svelte": () => Promise.resolve().then(function() {
    return createPet;
  }),
  "src/routes/app/bookings/index.svelte": () => Promise.resolve().then(function() {
    return index$4;
  }),
  "src/routes/app/bookings/[id].svelte": () => Promise.resolve().then(function() {
    return _id_$1;
  }),
  "src/routes/app/profile.svelte": () => Promise.resolve().then(function() {
    return profile;
  }),
  "src/routes/app/logout.svelte": () => Promise.resolve().then(function() {
    return logout;
  }),
  "src/routes/app/pets/index.svelte": () => Promise.resolve().then(function() {
    return index$3;
  }),
  "src/routes/app/pets/[id].svelte": () => Promise.resolve().then(function() {
    return _id_;
  }),
  "src/routes/app/o/index.svelte": () => Promise.resolve().then(function() {
    return index$2;
  }),
  "src/routes/app/o/createOrganization.svelte": () => Promise.resolve().then(function() {
    return createOrganization;
  }),
  "src/routes/app/o/[orgId]/index.svelte": () => Promise.resolve().then(function() {
    return index$1;
  }),
  "src/routes/app/o/[orgId]/createLocation.svelte": () => Promise.resolve().then(function() {
    return createLocation;
  }),
  "src/routes/app/o/[orgId]/l/[locId]/index.svelte": () => Promise.resolve().then(function() {
    return index;
  })
};
var metadata_lookup = { "src/routes/__layout.svelte": { "entry": "/./_app/pages/__layout.svelte-9dea6649.js", "css": ["/./_app/assets/pages/__layout.svelte-0bdb8a02.css"], "js": ["/./_app/pages/__layout.svelte-9dea6649.js", "/./_app/chunks/vendor-243478b0.js", "/./_app/chunks/stores-bf8575d7.js", "/./_app/chunks/theme-3fe4046e.js"], "styles": null }, ".svelte-kit/build/components/error.svelte": { "entry": "/./_app/error.svelte-9968ea4f.js", "css": [], "js": ["/./_app/error.svelte-9968ea4f.js", "/./_app/chunks/vendor-243478b0.js"], "styles": null }, "src/routes/index.svelte": { "entry": "/./_app/pages/index.svelte-5844a93f.js", "css": ["/./_app/assets/pages/index.svelte-bb0596c8.css"], "js": ["/./_app/pages/index.svelte-5844a93f.js", "/./_app/chunks/vendor-243478b0.js"], "styles": null }, "src/routes/signup.svelte": { "entry": "/./_app/pages/signup.svelte-d02ce172.js", "css": ["/./_app/assets/pages/signup.svelte-b8d7955b.css"], "js": ["/./_app/pages/signup.svelte-d02ce172.js", "/./_app/chunks/vendor-243478b0.js", "/./_app/chunks/navigation-20968cc5.js", "/./_app/chunks/singletons-bb9012b7.js", "/./_app/chunks/api-c5039ca7.js", "/./_app/chunks/stores-bf8575d7.js"], "styles": null }, "src/routes/login.svelte": { "entry": "/./_app/pages/login.svelte-18222fc0.js", "css": ["/./_app/assets/pages/login.svelte-c35f7ff3.css"], "js": ["/./_app/pages/login.svelte-18222fc0.js", "/./_app/chunks/vendor-243478b0.js", "/./_app/chunks/auth-d573fecf.js", "/./_app/chunks/api-c5039ca7.js", "/./_app/chunks/navigation-20968cc5.js", "/./_app/chunks/singletons-bb9012b7.js", "/./_app/chunks/stores-bf8575d7.js"], "styles": null }, "src/routes/app/__layout.reset.svelte": { "entry": "/./_app/pages/app/__layout.reset.svelte-74b26182.js", "css": ["/./_app/assets/pages/app/__layout.reset.svelte-3f2c7dd2.css"], "js": ["/./_app/pages/app/__layout.reset.svelte-74b26182.js", "/./_app/chunks/vendor-243478b0.js", "/./_app/chunks/auth-d573fecf.js", "/./_app/chunks/api-c5039ca7.js", "/./_app/chunks/stores-bf8575d7.js", "/./_app/chunks/theme-3fe4046e.js"], "styles": null }, "src/routes/app/index.svelte": { "entry": "/./_app/pages/app/index.svelte-f7bfb543.js", "css": ["/./_app/assets/pages/app/index.svelte-c11c252f.css", "/./_app/assets/BookingsList-f6decf47.css"], "js": ["/./_app/pages/app/index.svelte-f7bfb543.js", "/./_app/chunks/vendor-243478b0.js", "/./_app/chunks/BookingsList-90179803.js", "/./_app/chunks/api-c5039ca7.js", "/./_app/chunks/stores-bf8575d7.js"], "styles": null }, "src/routes/app/createBooking.svelte": { "entry": "/./_app/pages/app/createBooking.svelte-f8f56c18.js", "css": ["/./_app/assets/pages/app/createBooking.svelte-8513b1f9.css", "/./_app/assets/InputText-6c487cf7.css"], "js": ["/./_app/pages/app/createBooking.svelte-f8f56c18.js", "/./_app/chunks/vendor-243478b0.js", "/./_app/chunks/api-c5039ca7.js", "/./_app/chunks/stores-bf8575d7.js", "/./_app/chunks/InputText-2eba10cc.js"], "styles": null }, "src/routes/app/createPet.svelte": { "entry": "/./_app/pages/app/createPet.svelte-535db484.js", "css": [], "js": ["/./_app/pages/app/createPet.svelte-535db484.js", "/./_app/chunks/vendor-243478b0.js", "/./_app/chunks/navigation-20968cc5.js", "/./_app/chunks/singletons-bb9012b7.js", "/./_app/chunks/stores-bf8575d7.js", "/./_app/chunks/api-c5039ca7.js"], "styles": null }, "src/routes/app/bookings/index.svelte": { "entry": "/./_app/pages/app/bookings/index.svelte-c8aee838.js", "css": [], "js": ["/./_app/pages/app/bookings/index.svelte-c8aee838.js", "/./_app/chunks/vendor-243478b0.js"], "styles": null }, "src/routes/app/bookings/[id].svelte": { "entry": "/./_app/pages/app/bookings/[id].svelte-e4bedb8f.js", "css": [], "js": ["/./_app/pages/app/bookings/[id].svelte-e4bedb8f.js", "/./_app/chunks/vendor-243478b0.js"], "styles": null }, "src/routes/app/profile.svelte": { "entry": "/./_app/pages/app/profile.svelte-c507d18d.js", "css": ["/./_app/assets/pages/app/profile.svelte-de2358d2.css"], "js": ["/./_app/pages/app/profile.svelte-c507d18d.js", "/./_app/chunks/vendor-243478b0.js", "/./_app/chunks/api-c5039ca7.js", "/./_app/chunks/stores-bf8575d7.js"], "styles": null }, "src/routes/app/logout.svelte": { "entry": "/./_app/pages/app/logout.svelte-df2add02.js", "css": [], "js": ["/./_app/pages/app/logout.svelte-df2add02.js", "/./_app/chunks/vendor-243478b0.js", "/./_app/chunks/navigation-20968cc5.js", "/./_app/chunks/singletons-bb9012b7.js"], "styles": null }, "src/routes/app/pets/index.svelte": { "entry": "/./_app/pages/app/pets/index.svelte-0e126da0.js", "css": [], "js": ["/./_app/pages/app/pets/index.svelte-0e126da0.js", "/./_app/chunks/vendor-243478b0.js"], "styles": null }, "src/routes/app/pets/[id].svelte": { "entry": "/./_app/pages/app/pets/[id].svelte-f8d0ae10.js", "css": ["/./_app/assets/pages/app/pets/[id].svelte-7be6795d.css", "/./_app/assets/InputText-6c487cf7.css"], "js": ["/./_app/pages/app/pets/[id].svelte-f8d0ae10.js", "/./_app/chunks/vendor-243478b0.js", "/./_app/chunks/api-c5039ca7.js", "/./_app/chunks/InputText-2eba10cc.js", "/./_app/chunks/stores-bf8575d7.js"], "styles": null }, "src/routes/app/o/index.svelte": { "entry": "/./_app/pages/app/o/index.svelte-8b482ac9.js", "css": [], "js": ["/./_app/pages/app/o/index.svelte-8b482ac9.js", "/./_app/chunks/vendor-243478b0.js", "/./_app/chunks/api-c5039ca7.js"], "styles": null }, "src/routes/app/o/createOrganization.svelte": { "entry": "/./_app/pages/app/o/createOrganization.svelte-631a8899.js", "css": ["/./_app/assets/InputText-6c487cf7.css"], "js": ["/./_app/pages/app/o/createOrganization.svelte-631a8899.js", "/./_app/chunks/vendor-243478b0.js", "/./_app/chunks/navigation-20968cc5.js", "/./_app/chunks/singletons-bb9012b7.js", "/./_app/chunks/stores-bf8575d7.js", "/./_app/chunks/InputText-2eba10cc.js", "/./_app/chunks/api-c5039ca7.js"], "styles": null }, "src/routes/app/o/[orgId]/index.svelte": { "entry": "/./_app/pages/app/o/[orgId]/index.svelte-0e9ef41f.js", "css": ["/./_app/assets/BookingsList-f6decf47.css"], "js": ["/./_app/pages/app/o/[orgId]/index.svelte-0e9ef41f.js", "/./_app/chunks/vendor-243478b0.js", "/./_app/chunks/api-c5039ca7.js", "/./_app/chunks/BookingsList-90179803.js", "/./_app/chunks/stores-bf8575d7.js"], "styles": null }, "src/routes/app/o/[orgId]/createLocation.svelte": { "entry": "/./_app/pages/app/o/[orgId]/createLocation.svelte-6d8f8e7f.js", "css": ["/./_app/assets/InputText-6c487cf7.css"], "js": ["/./_app/pages/app/o/[orgId]/createLocation.svelte-6d8f8e7f.js", "/./_app/chunks/vendor-243478b0.js", "/./_app/chunks/navigation-20968cc5.js", "/./_app/chunks/singletons-bb9012b7.js", "/./_app/chunks/stores-bf8575d7.js", "/./_app/chunks/api-c5039ca7.js", "/./_app/chunks/InputText-2eba10cc.js"], "styles": null }, "src/routes/app/o/[orgId]/l/[locId]/index.svelte": { "entry": "/./_app/pages/app/o/[orgId]/l/[locId]/index.svelte-10247146.js", "css": ["/./_app/assets/BookingsList-f6decf47.css"], "js": ["/./_app/pages/app/o/[orgId]/l/[locId]/index.svelte-10247146.js", "/./_app/chunks/vendor-243478b0.js", "/./_app/chunks/api-c5039ca7.js", "/./_app/chunks/BookingsList-90179803.js", "/./_app/chunks/stores-bf8575d7.js"], "styles": null } };
async function load_component(file) {
  return {
    module: await module_lookup[file](),
    ...metadata_lookup[file]
  };
}
function render(request, {
  prerender: prerender2
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender: prerender2 });
}
function post() {
  console.log("logout runs");
  return {
    headers: {
      "set-cookie": `${COOKIE_AUTH_KEY_NAME}=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    },
    body: {
      ok: true
    }
  };
}
var logout$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  post
});
var ssr = typeof window === "undefined";
var getStores = () => {
  const stores = getContext("__svelte__");
  return {
    page: {
      subscribe: stores.page.subscribe
    },
    navigating: {
      subscribe: stores.navigating.subscribe
    },
    get preloading() {
      console.error("stores.preloading is deprecated; use stores.navigating instead");
      return {
        subscribe: stores.navigating.subscribe
      };
    },
    session: stores.session
  };
};
var page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
var error$1 = (verb) => {
  throw new Error(ssr ? `Can only ${verb} session store in browser` : `Cannot ${verb} session store before subscribing`);
};
var session = {
  subscribe(fn) {
    const store = getStores().session;
    if (!ssr) {
      session.set = store.set;
      session.update = store.update;
    }
    return store.subscribe(fn);
  },
  set: (value) => {
    error$1("set");
  },
  update: (updater) => {
    error$1("update");
  }
};
var css$n = {
  code: "header.svelte-1huqr9g.svelte-1huqr9g{display:flex;justify-content:space-between;color:#153a33;position:absolute;height:50px;width:100%}.corner.svelte-1huqr9g.svelte-1huqr9g{width:3em;height:3em;display:flex}.corner.svelte-1huqr9g a.svelte-1huqr9g{display:flex;align-items:center;justify-content:center;width:100%;height:100%;text-decoration:none}.corner.svelte-1huqr9g a span.svelte-1huqr9g{font-size:1.8em;object-fit:contain}nav.svelte-1huqr9g.svelte-1huqr9g{display:flex;justify-content:center}ul.svelte-1huqr9g.svelte-1huqr9g{position:relative;padding:0;margin:0;height:3em;display:flex;justify-content:center;align-items:center;list-style:none;background-size:contain}li.svelte-1huqr9g.svelte-1huqr9g{position:relative;height:100%}li.svelte-1huqr9g.svelte-1huqr9g:hover{cursor:pointer;text-decoration:underline}li.active.svelte-1huqr9g.svelte-1huqr9g::before{--size:6px;content:'';width:0;height:0;position:absolute;top:0;left:calc(50% - var(--size));border:var(--size) solid transparent;border-top:var(--size) solid var(--accent-color)}nav.svelte-1huqr9g a.svelte-1huqr9g{display:flex;height:100%;align-items:center;padding:0 1em;color:var(--heading-color);font-weight:700;font-size:0.8rem;text-transform:uppercase;letter-spacing:10%;text-decoration:none;transition:color 0.2s linear}a.svelte-1huqr9g.svelte-1huqr9g:hover{color:var(--accent-color)}",
  map: `{"version":3,"file":"Header.svelte","sources":["Header.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { page } from '$app/stores';\\r\\n<\/script>\\n\\n<header>\\n\\t<div class=\\"corner\\">\\n\\t\\t<a href=\\"https://kit.svelte.dev\\">\\n\\t\\t\\t<span>\u{1F415}\u200D\u{1F9BA}</span>\\n\\t\\t</a>\\n\\n\\t\\t<nav>\\n\\t\\t\\t<ul>\\n\\t\\t\\t\\t<li class:active={$page.path === '/'}><a href=\\"/\\">Home</a></li>\\n\\t\\t\\t\\t<li class:active={$page.path === '/login'}><a href=\\"/login\\">Login</a></li>\\n\\t\\t\\t\\t<li class:active={$page.path === '/signup'}><a href=\\"/signup\\">Signup</a></li>\\n\\t\\t\\t\\t<li class:active={$page.path === '/app'}><a href=\\"/app\\">Dashboard</a></li>\\n\\t\\t\\t</ul>\\n\\t\\t</nav>\\n\\t</div>\\n\\n\\t<div class=\\"corner\\">\\n\\t\\t<!-- TODO put something else here? github link? -->\\n\\t</div>\\n</header>\\n\\n<style>\\n\\theader {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: space-between;\\n\\t\\tcolor: #153a33;\\n\\t\\tposition: absolute;\\n\\t\\theight: 50px;\\n\\t\\twidth: 100%;\\n\\t}\\n\\n\\t.corner {\\n\\t\\twidth: 3em;\\n\\t\\theight: 3em;\\n\\t\\tdisplay: flex;\\n\\t}\\n\\n\\t.corner a {\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\twidth: 100%;\\n\\t\\theight: 100%;\\n\\t\\ttext-decoration: none;\\n\\t}\\n\\n\\t.corner a span {\\n\\t\\tfont-size: 1.8em;\\n\\t\\tobject-fit: contain;\\n\\t}\\n\\n\\n\\tnav {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t}\\n\\n\\tul {\\n\\t\\tposition: relative;\\n\\t\\tpadding: 0;\\n\\t\\tmargin: 0;\\n\\t\\theight: 3em;\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t\\talign-items: center;\\n\\t\\tlist-style: none;\\n\\t\\tbackground-size: contain;\\n\\t}\\n\\n\\tli {\\n\\t\\tposition: relative;\\n\\t\\theight: 100%;\\n\\t}\\n\\n\\tli:hover {\\n\\t\\tcursor: pointer;\\n\\t\\ttext-decoration: underline;\\n\\t}\\n\\n\\tli.active::before {\\n\\t\\t--size: 6px;\\n\\t\\tcontent: '';\\n\\t\\twidth: 0;\\n\\t\\theight: 0;\\n\\t\\tposition: absolute;\\n\\t\\ttop: 0;\\n\\t\\tleft: calc(50% - var(--size));\\n\\t\\tborder: var(--size) solid transparent;\\n\\t\\tborder-top: var(--size) solid var(--accent-color);\\n\\t}\\n\\n\\tnav a {\\n\\t\\tdisplay: flex;\\n\\t\\theight: 100%;\\n\\t\\talign-items: center;\\n\\t\\tpadding: 0 1em;\\n\\t\\tcolor: var(--heading-color);\\n\\t\\tfont-weight: 700;\\n\\t\\tfont-size: 0.8rem;\\n\\t\\ttext-transform: uppercase;\\n\\t\\tletter-spacing: 10%;\\n\\t\\ttext-decoration: none;\\n\\t\\ttransition: color 0.2s linear;\\n\\t}\\n\\n\\ta:hover {\\n\\t\\tcolor: var(--accent-color);\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAyBC,MAAM,8BAAC,CAAC,AACP,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,aAAa,CAC9B,KAAK,CAAE,OAAO,CACd,QAAQ,CAAE,QAAQ,CAClB,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,AACZ,CAAC,AAED,OAAO,8BAAC,CAAC,AACR,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,CACX,OAAO,CAAE,IAAI,AACd,CAAC,AAED,sBAAO,CAAC,CAAC,eAAC,CAAC,AACV,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,eAAe,CAAE,IAAI,AACtB,CAAC,AAED,sBAAO,CAAC,CAAC,CAAC,IAAI,eAAC,CAAC,AACf,SAAS,CAAE,KAAK,CAChB,UAAU,CAAE,OAAO,AACpB,CAAC,AAGD,GAAG,8BAAC,CAAC,AACJ,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,AACxB,CAAC,AAED,EAAE,8BAAC,CAAC,AACH,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,CAAC,CACV,MAAM,CAAE,CAAC,CACT,MAAM,CAAE,GAAG,CACX,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,UAAU,CAAE,IAAI,CAChB,eAAe,CAAE,OAAO,AACzB,CAAC,AAED,EAAE,8BAAC,CAAC,AACH,QAAQ,CAAE,QAAQ,CAClB,MAAM,CAAE,IAAI,AACb,CAAC,AAED,gCAAE,MAAM,AAAC,CAAC,AACT,MAAM,CAAE,OAAO,CACf,eAAe,CAAE,SAAS,AAC3B,CAAC,AAED,EAAE,qCAAO,QAAQ,AAAC,CAAC,AAClB,MAAM,CAAE,GAAG,CACX,OAAO,CAAE,EAAE,CACX,KAAK,CAAE,CAAC,CACR,MAAM,CAAE,CAAC,CACT,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,GAAG,CAAC,CAAC,CAAC,IAAI,MAAM,CAAC,CAAC,CAC7B,MAAM,CAAE,IAAI,MAAM,CAAC,CAAC,KAAK,CAAC,WAAW,CACrC,UAAU,CAAE,IAAI,MAAM,CAAC,CAAC,KAAK,CAAC,IAAI,cAAc,CAAC,AAClD,CAAC,AAED,kBAAG,CAAC,CAAC,eAAC,CAAC,AACN,OAAO,CAAE,IAAI,CACb,MAAM,CAAE,IAAI,CACZ,WAAW,CAAE,MAAM,CACnB,OAAO,CAAE,CAAC,CAAC,GAAG,CACd,KAAK,CAAE,IAAI,eAAe,CAAC,CAC3B,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,MAAM,CACjB,cAAc,CAAE,SAAS,CACzB,cAAc,CAAE,GAAG,CACnB,eAAe,CAAE,IAAI,CACrB,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,MAAM,AAC9B,CAAC,AAED,+BAAC,MAAM,AAAC,CAAC,AACR,KAAK,CAAE,IAAI,cAAc,CAAC,AAC3B,CAAC"}`
};
var Header = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$result.css.add(css$n);
  $$unsubscribe_page();
  return `<header class="${"svelte-1huqr9g"}"><div class="${"corner svelte-1huqr9g"}"><a href="${"https://kit.svelte.dev"}" class="${"svelte-1huqr9g"}"><span class="${"svelte-1huqr9g"}">\u{1F415}\u200D\u{1F9BA}</span></a>

		<nav class="${"svelte-1huqr9g"}"><ul class="${"svelte-1huqr9g"}"><li class="${["svelte-1huqr9g", $page.path === "/" ? "active" : ""].join(" ").trim()}"><a href="${"/"}" class="${"svelte-1huqr9g"}">Home</a></li>
				<li class="${["svelte-1huqr9g", $page.path === "/login" ? "active" : ""].join(" ").trim()}"><a href="${"/login"}" class="${"svelte-1huqr9g"}">Login</a></li>
				<li class="${["svelte-1huqr9g", $page.path === "/signup" ? "active" : ""].join(" ").trim()}"><a href="${"/signup"}" class="${"svelte-1huqr9g"}">Signup</a></li>
				<li class="${["svelte-1huqr9g", $page.path === "/app" ? "active" : ""].join(" ").trim()}"><a href="${"/app"}" class="${"svelte-1huqr9g"}">Dashboard</a></li></ul></nav></div>

	<div class="${"corner svelte-1huqr9g"}"></div>
</header>`;
});
var theme = writable2("light");
var themes = [
  {
    name: "light",
    label: "Light",
    icon: "\u{1F31E}"
  },
  {
    name: "dark",
    label: "Dark",
    icon: "\u{1F311}"
  }
];
var css$m = {
  code: "main.svelte-endqnh{flex:1;display:flex;flex-direction:column;width:100%;height:100%;box-sizing:border-box}",
  map: `{"version":3,"file":"__layout.svelte","sources":["__layout.svelte"],"sourcesContent":["<script context=\\"module\\" lang=\\"ts\\">var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\\r\\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\\r\\n    return new (P || (P = Promise))(function (resolve, reject) {\\r\\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\\r\\n        function rejected(value) { try { step(generator[\\"throw\\"](value)); } catch (e) { reject(e); } }\\r\\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\\r\\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\\r\\n    });\\r\\n};\\r\\nimport Header from '$lib/header/Header.svelte';\\r\\nexport function load({ page, fetch, session, context }) {\\r\\n    return __awaiter(this, void 0, void 0, function* () {\\r\\n        return {};\\r\\n    });\\r\\n}\\r\\n<\/script>\\n\\n<script lang=\\"ts\\">import { theme } from '$lib/stores/theme';\\r\\n<\/script>\\n\\n<svelte:head>\\n  <meta\\n    name=\\"color-scheme\\"\\n    content={$theme === 'system' ? 'light dark' : $theme}\\n  />\\n  <link rel=\\"stylesheet\\" href={\`/theme/\${$theme}.css\`} />\\n</svelte:head>\\n\\n<Header />\\n\\n<main>\\n  <slot />\\n</main>\\n\\n<style>\\n  main {\\n    flex: 1;\\n    display: flex;\\n    flex-direction: column;\\n    width: 100%;\\n    height: 100%;\\n    box-sizing: border-box;\\n  }\\n</style>\\n"],"names":[],"mappings":"AAmCE,IAAI,cAAC,CAAC,AACJ,IAAI,CAAE,CAAC,CACP,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,UAAU,AACxB,CAAC"}`
};
var __awaiter$8 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
function load$b({ page: page2, fetch: fetch2, session: session2, context }) {
  return __awaiter$8(this, void 0, void 0, function* () {
    return {};
  });
}
var _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $theme, $$unsubscribe_theme;
  $$unsubscribe_theme = subscribe(theme, (value) => $theme = value);
  $$result.css.add(css$m);
  $$unsubscribe_theme();
  return `${$$result.head += `<meta name="${"color-scheme"}"${add_attribute("content", $theme === "system" ? "light dark" : $theme, 0)} data-svelte="svelte-4smvxs"><link rel="${"stylesheet"}"${add_attribute("href", `/theme/${$theme}.css`, 0)} data-svelte="svelte-4smvxs">`, ""}

${validate_component(Header, "Header").$$render($$result, {}, {}, {})}

<main class="${"svelte-endqnh"}">${slots.default ? slots.default({}) : ``}
</main>`;
});
var __layout = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout,
  load: load$b
});
function load$a({ error: error22, status }) {
  return { props: { error: error22, status } };
}
var Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { status } = $$props;
  let { error: error22 } = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error22 !== void 0)
    $$bindings.error(error22);
  return `<h1>${escape2(status)}</h1>

<pre>${escape2(error22.message)}</pre>



${error22.frame ? `<pre>${escape2(error22.frame)}</pre>` : ``}
${error22.stack ? `<pre>${escape2(error22.stack)}</pre>` : ``}`;
});
var error2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Error$1,
  load: load$a
});
var css$l = {
  code: "section.svelte-1bgohwt{display:flex;flex-direction:column;justify-content:center;align-items:center;flex:1}h1.svelte-1bgohwt{width:100%}",
  map: '{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script context=\\"module\\" lang=\\"ts\\">export const prerender = true;\\r\\n<\/script>\\n\\n<script lang=\\"ts\\"><\/script>\\n\\n<svelte:head>\\n\\t<title>Home</title>\\n</svelte:head>\\n\\n<section>\\n\\t<h1>Welcome to Pupper</h1>\\n\\n</section>\\n\\n<style>\\n\\tsection {\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\tjustify-content: center;\\n\\t\\talign-items: center;\\n\\t\\tflex: 1;\\n\\t}\\n\\n\\th1 {\\n\\t\\twidth: 100%;\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAeC,OAAO,eAAC,CAAC,AACR,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,IAAI,CAAE,CAAC,AACR,CAAC,AAED,EAAE,eAAC,CAAC,AACH,KAAK,CAAE,IAAI,AACZ,CAAC"}'
};
var prerender = true;
var Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$l);
  return `${$$result.head += `${$$result.title = `<title>Home</title>`, ""}`, ""}

<section class="${"svelte-1bgohwt"}"><h1 class="${"svelte-1bgohwt"}">Welcome to Pupper</h1>

</section>`;
});
var index$6 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes,
  prerender
});
function guard(name) {
  return () => {
    throw new Error(`Cannot call ${name}(...) on the server`);
  };
}
var goto = guard("goto");
var css$k = {
  code: ".split-content.svelte-1j82mzu{display:grid;grid-template-columns:1fr 1fr;gap:50px;height:100%}h1.svelte-1j82mzu,p.svelte-1j82mzu{text-align:center}h1.svelte-1j82mzu{font-family:var(--fontFamilyDisplay);font-weight:900;font-style:italic;font-size:2.5em;margin-top:150px}form.svelte-1j82mzu{display:flex;flex-direction:column}fieldset.svelte-1j82mzu{padding:0;display:flex;width:200px;align-self:center;flex-direction:column;margin-top:1rem;border:none}input.svelte-1j82mzu{border:none;background-color:#f0f0f0;padding:8px}button.svelte-1j82mzu{padding:8px;margin-top:1rem;width:200px;align-self:center;background-color:var(--colorPrimary);border:none;border-radius:5px;color:white;font-weight:bold;letter-spacing:1.3px}img.svelte-1j82mzu{object-fit:cover;object-position:center;height:100%;max-width:100%}",
  map: `{"version":3,"file":"signup.svelte","sources":["signup.svelte"],"sourcesContent":["<script lang=\\"ts\\">var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\\r\\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\\r\\n    return new (P || (P = Promise))(function (resolve, reject) {\\r\\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\\r\\n        function rejected(value) { try { step(generator[\\"throw\\"](value)); } catch (e) { reject(e); } }\\r\\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\\r\\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\\r\\n    });\\r\\n};\\r\\nimport { goto } from '$app/navigation';\\r\\nimport { post } from '$lib/api';\\r\\nimport { session } from '$app/stores';\\r\\nimport { COOKIE_AUTH_KEY_NAME } from '$lib/config';\\r\\nimport Cookie from 'universal-cookie';\\r\\nconst dogUrl = 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=750&q=80';\\r\\nconst cookie = new Cookie();\\r\\nlet email = 'josiah.mortenson@gmail.com';\\r\\nlet password = 'P@ssw0rd';\\r\\nlet error = '';\\r\\nconst submit = (event) => __awaiter(void 0, void 0, void 0, function* () {\\r\\n    error = '';\\r\\n    try {\\r\\n        const body = { email, password };\\r\\n        const res = yield post({ path: \`api/v1/auth/signup\`, data: body });\\r\\n        cookie.set(COOKIE_AUTH_KEY_NAME, res.data.access_token, { path: '/' });\\r\\n        $session.token = res.data.access_token;\\r\\n        goto('/app');\\r\\n    }\\r\\n    catch (err) {\\r\\n        console.log(err);\\r\\n        error = 'Login failed';\\r\\n    }\\r\\n});\\r\\n<\/script>\\r\\n\\r\\n<div class=\\"split-content\\">\\r\\n  <article>\\r\\n    <h1>Let us know how we can help you</h1>\\r\\n    {#if error}\\r\\n      <p>{error}</p>\\r\\n    {/if}\\r\\n    <form on:submit|preventDefault={submit} method=\\"post\\">\\r\\n      <fieldset>\\r\\n        <label for=\\"username\\">Email</label>\\r\\n        <input\\r\\n          type=\\"text\\"\\r\\n          name=\\"username\\"\\r\\n          placeholder=\\"ginny@woof.com\\"\\r\\n          bind:value={email}\\r\\n        />\\r\\n      </fieldset>\\r\\n      <fieldset>\\r\\n        <label for=\\"password\\">Password</label>\\r\\n        <input\\r\\n          type=\\"password\\"\\r\\n          name=\\"password\\"\\r\\n          placeholder=\\"******\\"\\r\\n          bind:value={password}\\r\\n        />\\r\\n      </fieldset>\\r\\n      <p>Already have an account? <a href=\\"/login\\">Login here!</a></p>\\r\\n      <button type=\\"submit\\">Signup</button>\\r\\n    </form>\\r\\n  </article>\\r\\n  <img\\r\\n    src={dogUrl}\\r\\n    alt=\\"Dog staring intently at you with pale pink background.\\"\\r\\n  />\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n  .split-content {\\r\\n    display: grid;\\r\\n    grid-template-columns: 1fr 1fr;\\r\\n    gap: 50px;\\r\\n    height: 100%;\\r\\n  }\\r\\n\\r\\n  h1,\\r\\n  p {\\r\\n    text-align: center;\\r\\n  }\\r\\n\\r\\n  h1 {\\r\\n    font-family: var(--fontFamilyDisplay);\\r\\n    font-weight: 900;\\r\\n    font-style: italic;\\r\\n    font-size: 2.5em;\\r\\n    margin-top: 150px;\\r\\n  }\\r\\n\\r\\n  form {\\r\\n    display: flex;\\r\\n    flex-direction: column;\\r\\n  }\\r\\n\\r\\n  fieldset {\\r\\n    padding: 0;\\r\\n    display: flex;\\r\\n    width: 200px;\\r\\n    align-self: center;\\r\\n    flex-direction: column;\\r\\n    margin-top: 1rem;\\r\\n    border: none;\\r\\n  }\\r\\n\\r\\n  input {\\r\\n    border: none;\\r\\n    background-color: #f0f0f0;\\r\\n    padding: 8px;\\r\\n  }\\r\\n\\r\\n  button {\\r\\n    padding: 8px;\\r\\n    margin-top: 1rem;\\r\\n    width: 200px;\\r\\n    align-self: center;\\r\\n    background-color: var(--colorPrimary);\\r\\n    border: none;\\r\\n    border-radius: 5px;\\r\\n    color: white;\\r\\n    font-weight: bold;\\r\\n    letter-spacing: 1.3px;\\r\\n  }\\r\\n\\r\\n  img {\\r\\n    /* height: 100%; */\\r\\n    object-fit: cover;\\r\\n    object-position: center;\\r\\n    height: 100%;\\r\\n    max-width: 100%;\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAuEE,cAAc,eAAC,CAAC,AACd,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,GAAG,CAAC,GAAG,CAC9B,GAAG,CAAE,IAAI,CACT,MAAM,CAAE,IAAI,AACd,CAAC,AAED,iBAAE,CACF,CAAC,eAAC,CAAC,AACD,UAAU,CAAE,MAAM,AACpB,CAAC,AAED,EAAE,eAAC,CAAC,AACF,WAAW,CAAE,IAAI,mBAAmB,CAAC,CACrC,WAAW,CAAE,GAAG,CAChB,UAAU,CAAE,MAAM,CAClB,SAAS,CAAE,KAAK,CAChB,UAAU,CAAE,KAAK,AACnB,CAAC,AAED,IAAI,eAAC,CAAC,AACJ,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,AACxB,CAAC,AAED,QAAQ,eAAC,CAAC,AACR,OAAO,CAAE,CAAC,CACV,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,KAAK,CACZ,UAAU,CAAE,MAAM,CAClB,cAAc,CAAE,MAAM,CACtB,UAAU,CAAE,IAAI,CAChB,MAAM,CAAE,IAAI,AACd,CAAC,AAED,KAAK,eAAC,CAAC,AACL,MAAM,CAAE,IAAI,CACZ,gBAAgB,CAAE,OAAO,CACzB,OAAO,CAAE,GAAG,AACd,CAAC,AAED,MAAM,eAAC,CAAC,AACN,OAAO,CAAE,GAAG,CACZ,UAAU,CAAE,IAAI,CAChB,KAAK,CAAE,KAAK,CACZ,UAAU,CAAE,MAAM,CAClB,gBAAgB,CAAE,IAAI,cAAc,CAAC,CACrC,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,GAAG,CAClB,KAAK,CAAE,KAAK,CACZ,WAAW,CAAE,IAAI,CACjB,cAAc,CAAE,KAAK,AACvB,CAAC,AAED,GAAG,eAAC,CAAC,AAEH,UAAU,CAAE,KAAK,CACjB,eAAe,CAAE,MAAM,CACvB,MAAM,CAAE,IAAI,CACZ,SAAS,CAAE,IAAI,AACjB,CAAC"}`
};
var dogUrl$1 = "https://images.unsplash.com/photo-1561037404-61cd46aa615b?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=750&q=80";
var Signup = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_session;
  $$unsubscribe_session = subscribe(session, (value) => value);
  (function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve2) {
        resolve2(value);
      });
    }
    return new (P || (P = Promise))(function(resolve2, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  });
  new import_universal_cookie.default();
  let email = "josiah.mortenson@gmail.com";
  let password = "P@ssw0rd";
  $$result.css.add(css$k);
  $$unsubscribe_session();
  return `<div class="${"split-content svelte-1j82mzu"}"><article><h1 class="${"svelte-1j82mzu"}">Let us know how we can help you</h1>
    ${``}
    <form method="${"post"}" class="${"svelte-1j82mzu"}"><fieldset class="${"svelte-1j82mzu"}"><label for="${"username"}">Email</label>
        <input type="${"text"}" name="${"username"}" placeholder="${"ginny@woof.com"}" class="${"svelte-1j82mzu"}"${add_attribute("value", email, 1)}></fieldset>
      <fieldset class="${"svelte-1j82mzu"}"><label for="${"password"}">Password</label>
        <input type="${"password"}" name="${"password"}" placeholder="${"******"}" class="${"svelte-1j82mzu"}"${add_attribute("value", password, 1)}></fieldset>
      <p class="${"svelte-1j82mzu"}">Already have an account? <a href="${"/login"}">Login here!</a></p>
      <button type="${"submit"}" class="${"svelte-1j82mzu"}">Signup</button></form></article>
  <img${add_attribute("src", dogUrl$1, 0)} alt="${"Dog staring intently at you with pale pink background."}" class="${"svelte-1j82mzu"}">
</div>`;
});
var signup = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Signup
});
var css$j = {
  code: ".split-content.svelte-1uye76v{display:grid;grid-template-columns:1fr 1fr;gap:50px;height:100%}h1.svelte-1uye76v,p.svelte-1uye76v{text-align:center}h1.svelte-1uye76v{margin-top:150px}form.svelte-1uye76v{display:flex;flex-direction:column}fieldset.svelte-1uye76v{padding:0;display:flex;width:200px;align-self:center;flex-direction:column;margin-top:1rem;border:none}input.svelte-1uye76v{border:none;background-color:#f0f0f0;padding:8px}button.svelte-1uye76v{padding:8px;margin-top:1rem;width:200px;align-self:center;background-color:#153a33;border:none;border-radius:5px;color:white;font-weight:bold;letter-spacing:1.3px}img.svelte-1uye76v{object-fit:cover;object-position:center;height:100%;max-width:100%}",
  map: `{"version":3,"file":"login.svelte","sources":["login.svelte"],"sourcesContent":["<script lang=\\"ts\\" context=\\"module\\">var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\\r\\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\\r\\n    return new (P || (P = Promise))(function (resolve, reject) {\\r\\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\\r\\n        function rejected(value) { try { step(generator[\\"throw\\"](value)); } catch (e) { reject(e); } }\\r\\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\\r\\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\\r\\n    });\\r\\n};\\r\\n;\\r\\nimport { me } from '$lib/stores/auth';\\r\\nexport function load({ session }) {\\r\\n    return __awaiter(this, void 0, void 0, function* () {\\r\\n        if (!session.token) {\\r\\n            return {};\\r\\n        }\\r\\n        const user = yield me(session.token);\\r\\n        if (!user) {\\r\\n            return {};\\r\\n        }\\r\\n        else {\\r\\n            return {\\r\\n                status: 302,\\r\\n                redirect: '/app',\\r\\n            };\\r\\n        }\\r\\n    });\\r\\n}\\r\\n<\/script>\\r\\n\\r\\n<script lang=\\"ts\\">var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\\r\\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\\r\\n    return new (P || (P = Promise))(function (resolve, reject) {\\r\\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\\r\\n        function rejected(value) { try { step(generator[\\"throw\\"](value)); } catch (e) { reject(e); } }\\r\\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\\r\\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\\r\\n    });\\r\\n};\\r\\nimport { goto } from '$app/navigation';\\r\\nimport { post } from '$lib/api';\\r\\nimport { session } from '$app/stores';\\r\\nimport { COOKIE_AUTH_KEY_NAME } from '$lib/config';\\r\\nimport Cookie from 'universal-cookie';\\r\\nconst dogUrl = 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=750&q=80';\\r\\nconst cookie = new Cookie();\\r\\nlet username = 'josiah.mortenson@gmail.com';\\r\\nlet password = 'P@ssw0rd';\\r\\nlet error = '';\\r\\nconst submit = (event) => __awaiter(void 0, void 0, void 0, function* () {\\r\\n    error = '';\\r\\n    try {\\r\\n        const body = { username, password };\\r\\n        const res = yield post({ path: \`api/v1/auth/login\`, data: body });\\r\\n        cookie.set(COOKIE_AUTH_KEY_NAME, res.data.access_token, { path: '/' });\\r\\n        $session.token = res.data.access_token;\\r\\n        goto('/app');\\r\\n    }\\r\\n    catch (err) {\\r\\n        console.log(err);\\r\\n        error = 'Login failed';\\r\\n    }\\r\\n});\\r\\n<\/script>\\r\\n\\r\\n<svelte:head>\\r\\n  <title>Login</title>\\r\\n</svelte:head>\\r\\n<div class=\\"split-content\\">\\r\\n  <article>\\r\\n    <h1>Login</h1>\\r\\n    {#if error}\\r\\n      <p>{error}</p>\\r\\n    {/if}\\r\\n    <form on:submit|preventDefault={submit} method=\\"post\\">\\r\\n      <fieldset>\\r\\n        <label for=\\"username\\">Email</label>\\r\\n        <input\\r\\n          type=\\"text\\"\\r\\n          name=\\"username\\"\\r\\n          placeholder=\\"ginny@woof.com\\"\\r\\n          bind:value={username}\\r\\n        />\\r\\n      </fieldset>\\r\\n      <fieldset>\\r\\n        <label for=\\"password\\">Password</label>\\r\\n        <input\\r\\n          type=\\"password\\"\\r\\n          name=\\"password\\"\\r\\n          placeholder=\\"******\\"\\r\\n          bind:value={password}\\r\\n        />\\r\\n      </fieldset>\\r\\n      <p>New here? <a href=\\"/signup\\">Signup today!</a></p>\\r\\n      <button type=\\"submit\\">Submit</button>\\r\\n    </form>\\r\\n  </article>\\r\\n  <img\\r\\n    src={dogUrl}\\r\\n    alt=\\"Dog staring intently at you with pale pink background.\\"\\r\\n  />\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n  .split-content {\\r\\n    display: grid;\\r\\n    grid-template-columns: 1fr 1fr;\\r\\n    gap: 50px;\\r\\n    height: 100%;\\r\\n  }\\r\\n\\r\\n  h1,\\r\\n  p {\\r\\n    text-align: center;\\r\\n  }\\r\\n\\r\\n  h1 {\\r\\n    margin-top: 150px;\\r\\n  }\\r\\n\\r\\n  form {\\r\\n    display: flex;\\r\\n    flex-direction: column;\\r\\n  }\\r\\n\\r\\n  fieldset {\\r\\n    padding: 0;\\r\\n    display: flex;\\r\\n    width: 200px;\\r\\n    align-self: center;\\r\\n    flex-direction: column;\\r\\n    margin-top: 1rem;\\r\\n    border: none;\\r\\n  }\\r\\n\\r\\n  input {\\r\\n    border: none;\\r\\n    background-color: #f0f0f0;\\r\\n    padding: 8px;\\r\\n  }\\r\\n\\r\\n  button {\\r\\n    padding: 8px;\\r\\n    margin-top: 1rem;\\r\\n    width: 200px;\\r\\n    align-self: center;\\r\\n    background-color: #153a33;\\r\\n    border: none;\\r\\n    border-radius: 5px;\\r\\n    color: white;\\r\\n    font-weight: bold;\\r\\n    letter-spacing: 1.3px;\\r\\n  }\\r\\n\\r\\n  img {\\r\\n    /* height: 100%; */\\r\\n    object-fit: cover;\\r\\n    object-position: center;\\r\\n    height: 100%;\\r\\n    max-width: 100%;\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAwGE,cAAc,eAAC,CAAC,AACd,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,GAAG,CAAC,GAAG,CAC9B,GAAG,CAAE,IAAI,CACT,MAAM,CAAE,IAAI,AACd,CAAC,AAED,iBAAE,CACF,CAAC,eAAC,CAAC,AACD,UAAU,CAAE,MAAM,AACpB,CAAC,AAED,EAAE,eAAC,CAAC,AACF,UAAU,CAAE,KAAK,AACnB,CAAC,AAED,IAAI,eAAC,CAAC,AACJ,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,AACxB,CAAC,AAED,QAAQ,eAAC,CAAC,AACR,OAAO,CAAE,CAAC,CACV,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,KAAK,CACZ,UAAU,CAAE,MAAM,CAClB,cAAc,CAAE,MAAM,CACtB,UAAU,CAAE,IAAI,CAChB,MAAM,CAAE,IAAI,AACd,CAAC,AAED,KAAK,eAAC,CAAC,AACL,MAAM,CAAE,IAAI,CACZ,gBAAgB,CAAE,OAAO,CACzB,OAAO,CAAE,GAAG,AACd,CAAC,AAED,MAAM,eAAC,CAAC,AACN,OAAO,CAAE,GAAG,CACZ,UAAU,CAAE,IAAI,CAChB,KAAK,CAAE,KAAK,CACZ,UAAU,CAAE,MAAM,CAClB,gBAAgB,CAAE,OAAO,CACzB,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,GAAG,CAClB,KAAK,CAAE,KAAK,CACZ,WAAW,CAAE,IAAI,CACjB,cAAc,CAAE,KAAK,AACvB,CAAC,AAED,GAAG,eAAC,CAAC,AAEH,UAAU,CAAE,KAAK,CACjB,eAAe,CAAE,MAAM,CACvB,MAAM,CAAE,IAAI,CACZ,SAAS,CAAE,IAAI,AACjB,CAAC"}`
};
var __awaiter$7 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
function load$9({ session: session2 }) {
  return __awaiter$7(this, void 0, void 0, function* () {
    if (!session2.token) {
      return {};
    }
    const user = yield me(session2.token);
    if (!user) {
      return {};
    } else {
      return { status: 302, redirect: "/app" };
    }
  });
}
var dogUrl = "https://images.unsplash.com/photo-1561037404-61cd46aa615b?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=750&q=80";
var Login = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_session;
  $$unsubscribe_session = subscribe(session, (value) => value);
  (function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve2) {
        resolve2(value);
      });
    }
    return new (P || (P = Promise))(function(resolve2, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  });
  new import_universal_cookie.default();
  let username = "josiah.mortenson@gmail.com";
  let password = "P@ssw0rd";
  $$result.css.add(css$j);
  $$unsubscribe_session();
  return `${$$result.head += `${$$result.title = `<title>Login</title>`, ""}`, ""}
<div class="${"split-content svelte-1uye76v"}"><article><h1 class="${"svelte-1uye76v"}">Login</h1>
    ${``}
    <form method="${"post"}" class="${"svelte-1uye76v"}"><fieldset class="${"svelte-1uye76v"}"><label for="${"username"}">Email</label>
        <input type="${"text"}" name="${"username"}" placeholder="${"ginny@woof.com"}" class="${"svelte-1uye76v"}"${add_attribute("value", username, 1)}></fieldset>
      <fieldset class="${"svelte-1uye76v"}"><label for="${"password"}">Password</label>
        <input type="${"password"}" name="${"password"}" placeholder="${"******"}" class="${"svelte-1uye76v"}"${add_attribute("value", password, 1)}></fieldset>
      <p class="${"svelte-1uye76v"}">New here? <a href="${"/signup"}">Signup today!</a></p>
      <button type="${"submit"}" class="${"svelte-1uye76v"}">Submit</button></form></article>
  <img${add_attribute("src", dogUrl, 0)} alt="${"Dog staring intently at you with pale pink background."}" class="${"svelte-1uye76v"}">
</div>`;
});
var login = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Login,
  load: load$9
});
var css$i = {
  code: "select.svelte-rygaom{font-family:var(--fontFamilySansSerif);font-size:1rem}",
  map: `{"version":3,"file":"ThemeSwitcher.svelte","sources":["ThemeSwitcher.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { theme, themes } from '$lib/stores/theme';\\r\\n<\/script>\\r\\n\\r\\n<select bind:value={$theme}>\\r\\n  {#each themes as { name, label, icon }}\\r\\n    <option value={name}>{label} <span>{icon}</span></option>\\r\\n  {/each}\\r\\n</select>\\r\\n\\r\\n<style>\\r\\n  select {\\r\\n    font-family: var(--fontFamilySansSerif);\\r\\n    font-size: 1rem;\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAUE,MAAM,cAAC,CAAC,AACN,WAAW,CAAE,IAAI,qBAAqB,CAAC,CACvC,SAAS,CAAE,IAAI,AACjB,CAAC"}`
};
var ThemeSwitcher = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $theme, $$unsubscribe_theme;
  $$unsubscribe_theme = subscribe(theme, (value) => $theme = value);
  $$result.css.add(css$i);
  $$unsubscribe_theme();
  return `<select class="${"svelte-rygaom"}"${add_attribute("value", $theme, 1)}>${each(themes, ({ name, label, icon }) => `<option${add_attribute("value", name, 0)}>${escape2(label)} <span>${escape2(icon)}</span></option>`)}</select>`;
});
var css$h = {
  code: "form.svelte-fni382.svelte-fni382{display:flex;flex-direction:column}form.svelte-fni382 select.svelte-fni382{font-family:var(--fontFamilySansSerif);font-weight:bold;background-color:transparent;color:var(--navbarFontColor);font-size:1.6rem;border:none}form.svelte-fni382 select.svelte-fni382:hover{cursor:pointer}",
  map: '{"version":3,"file":"OrganizationPicker.svelte","sources":["OrganizationPicker.svelte"],"sourcesContent":["<script lang=\\"ts\\">export let organizations = [];\\r\\nlet defaultOrg = organizations === null || organizations === void 0 ? void 0 : organizations[0];\\r\\nlet selectedOrganization = defaultOrg === null || defaultOrg === void 0 ? void 0 : defaultOrg.id;\\r\\n<\/script>\\r\\n\\r\\n<form>\\r\\n  {#if organizations.length > 0}\\r\\n    <!-- svelte-ignore a11y-no-onchange -->\\r\\n    <select name=\\"organization\\" bind:value={selectedOrganization}>\\r\\n      {#each organizations as organization}\\r\\n        <option value={organization.id}>{organization.name}</option>\\r\\n      {/each}\\r\\n    </select>\\r\\n  {/if}\\r\\n</form>\\r\\n\\r\\n<style>\\r\\n  form {\\r\\n    display: flex;\\r\\n    flex-direction: column;\\r\\n  }\\r\\n\\r\\n  form select {\\r\\n    font-family: var(--fontFamilySansSerif);\\r\\n    font-weight: bold;\\r\\n    background-color: transparent;\\r\\n    color: var(--navbarFontColor);\\r\\n    font-size: 1.6rem;\\r\\n    border: none;\\r\\n  }\\r\\n\\r\\n  form select:hover {\\r\\n    cursor: pointer;\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAiBE,IAAI,4BAAC,CAAC,AACJ,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,AACxB,CAAC,AAED,kBAAI,CAAC,MAAM,cAAC,CAAC,AACX,WAAW,CAAE,IAAI,qBAAqB,CAAC,CACvC,WAAW,CAAE,IAAI,CACjB,gBAAgB,CAAE,WAAW,CAC7B,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,SAAS,CAAE,MAAM,CACjB,MAAM,CAAE,IAAI,AACd,CAAC,AAED,kBAAI,CAAC,oBAAM,MAAM,AAAC,CAAC,AACjB,MAAM,CAAE,OAAO,AACjB,CAAC"}'
};
var OrganizationPicker = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { organizations = [] } = $$props;
  let defaultOrg = organizations === null || organizations === void 0 ? void 0 : organizations[0];
  let selectedOrganization = defaultOrg === null || defaultOrg === void 0 ? void 0 : defaultOrg.id;
  if ($$props.organizations === void 0 && $$bindings.organizations && organizations !== void 0)
    $$bindings.organizations(organizations);
  $$result.css.add(css$h);
  return `<form class="${"svelte-fni382"}">${organizations.length > 0 ? `
    <select name="${"organization"}" class="${"svelte-fni382"}"${add_attribute("value", selectedOrganization, 1)}>${each(organizations, (organization) => `<option${add_attribute("value", organization.id, 0)}>${escape2(organization.name)}</option>`)}</select>` : ``}
</form>`;
});
var css$g = {
  code: "header.svelte-zsrif0.svelte-zsrif0{position:fixed;flex:0 0 100px;display:flex;flex-direction:column;justify-content:space-between;background-color:var(--navbar);color:var(--navbarFontColor);margin-right:1rem;width:225px;box-shadow:2px 0px 15px -10px var(--shadowColor);height:100%}.corner.svelte-zsrif0.svelte-zsrif0{display:flex;flex-direction:column;padding:1rem}.corner.svelte-zsrif0 a.svelte-zsrif0{color:var(--navbarFontColor);font-family:var(--fontFamilyDisplay);font-size:1.4rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%;text-decoration:none;margin-bottom:1rem}nav.svelte-zsrif0.svelte-zsrif0{display:flex;flex-direction:column;justify-content:center}nav.svelte-zsrif0 h3.svelte-zsrif0{margin:0;margin-bottom:0.5rem;padding-left:1rem;font-family:var(--fontFamilyDisplay);font-weight:normal;letter-spacing:2px;color:var(--navHeaderColor);font-size:1rem}nav.svelte-zsrif0 ul.svelte-zsrif0{position:relative;padding:0;margin:0;width:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;list-style:none;background-size:contain}li.svelte-zsrif0.svelte-zsrif0{position:relative;height:100%;width:100%;padding:0.5rem 0}li.svelte-zsrif0.svelte-zsrif0:hover{text-decoration:underline}li.active.svelte-zsrif0.svelte-zsrif0{background-color:var(--navbarSelected);color:var(--navbarSelectedFont)}nav.svelte-zsrif0 ul li a.svelte-zsrif0{height:100%;align-items:center;padding:0 1em;color:var(--heading-color);font-weight:700;font-size:1rem;text-transform:uppercase;letter-spacing:10%;text-decoration:none;transition:color 0.2s linear}nav.svelte-zsrif0 ul li.svelte-zsrif0:last-child{color:var(--navHeaderColor)}",
  map: '{"version":3,"file":"AppHeader.svelte","sources":["AppHeader.svelte"],"sourcesContent":["<script lang=\\"ts\\">var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\\r\\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\\r\\n    return new (P || (P = Promise))(function (resolve, reject) {\\r\\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\\r\\n        function rejected(value) { try { step(generator[\\"throw\\"](value)); } catch (e) { reject(e); } }\\r\\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\\r\\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\\r\\n    });\\r\\n};\\r\\nvar _a;\\r\\nimport { page, session } from \\"$app/stores\\";\\r\\nimport ThemeSwitcher from \\"$lib/ThemeSwitcher.svelte\\";\\r\\nimport { onMount } from \\"svelte\\";\\r\\nimport { get } from \\"$lib/api\\";\\r\\nimport OrganizationPicker from \\"$lib/organizations/OrganizationPicker.svelte\\";\\r\\n;\\r\\nconst isClient = ((_a = $session.user.user_settings.find((us) => (us.key = \\"isClient\\"))) === null || _a === void 0 ? void 0 : _a.value) ===\\r\\n    \\"true\\";\\r\\nlet organizations = [];\\r\\nlet locations = [];\\r\\nlet selectedOrg;\\r\\nconst fetchOrgs = () => __awaiter(void 0, void 0, void 0, function* () {\\r\\n    try {\\r\\n        const orgRes = yield get({\\r\\n            path: `api/v1/organizations?userId=${$session.user.id}`,\\r\\n            token: $session.token,\\r\\n        });\\r\\n        return orgRes.data;\\r\\n    }\\r\\n    catch (err) {\\r\\n        console.log(err);\\r\\n    }\\r\\n});\\r\\nonMount(() => __awaiter(void 0, void 0, void 0, function* () {\\r\\n    var _b;\\r\\n    organizations = yield fetchOrgs();\\r\\n    selectedOrg = organizations === null || organizations === void 0 ? void 0 : organizations.find((o) => o.id === parseInt($page.params.orgId));\\r\\n    console.log(selectedOrg);\\r\\n    locations = (_b = selectedOrg === null || selectedOrg === void 0 ? void 0 : selectedOrg.location) !== null && _b !== void 0 ? _b : [];\\r\\n}));\\r\\n<\/script>\\r\\n\\r\\n<header>\\r\\n  <div class=\\"corner\\">\\r\\n    <a href=\\"/app\\">\u{1F33F} Pupper</a>\\r\\n    <OrganizationPicker {organizations} />\\r\\n  </div>\\r\\n  <nav>\\r\\n    {#if isClient}\\r\\n      <h3>Locations</h3>\\r\\n      <ul>\\r\\n        {#each locations as location}\\r\\n          <li\\r\\n            class:active={$page.path ===\\r\\n              `/app/o/${selectedOrg.id}/l/${location.id}`}>\\r\\n            <a href={`/app/o/${selectedOrg.id}/l/${location.id}`}>\\r\\n              {location.name}\\r\\n            </a>\\r\\n          </li>\\r\\n        {/each}\\r\\n        <li>\\r\\n          <a href={`/app/o/${selectedOrg?.id}/createLocation`}\\r\\n            >+ Create location</a>\\r\\n        </li>\\r\\n      </ul>\\r\\n    {:else}\\r\\n      <ul>\\r\\n        <li><a href=\\"/app\\">Dashboard</a></li>\\r\\n        <li><a href=\\"/app/pets\\">Pets</a></li>\\r\\n        <li><a href=\\"/app/bookings\\">Bookings</a></li>\\r\\n      </ul>\\r\\n    {/if}\\r\\n  </nav>\\r\\n\\r\\n  <div class=\\"corner\\">\\r\\n    <!-- TODO put something else here? github link? -->\\r\\n    <a href=\\"/app/logout\\">Logout \u270C</a>\\r\\n    <ThemeSwitcher />\\r\\n  </div>\\r\\n</header>\\r\\n\\r\\n<style>\\r\\n  header {\\r\\n    position: fixed;\\r\\n    flex: 0 0 100px;\\r\\n    display: flex;\\r\\n    flex-direction: column;\\r\\n    justify-content: space-between;\\r\\n    background-color: var(--navbar);\\r\\n    color: var(--navbarFontColor);\\r\\n    margin-right: 1rem;\\r\\n    width: 225px;\\r\\n    box-shadow: 2px 0px 15px -10px var(--shadowColor);\\r\\n    height: 100%;\\r\\n  }\\r\\n\\r\\n  .corner {\\r\\n    display: flex;\\r\\n    flex-direction: column;\\r\\n    padding: 1rem;\\r\\n  }\\r\\n\\r\\n  .corner a {\\r\\n    color: var(--navbarFontColor);\\r\\n    font-family: var(--fontFamilyDisplay);\\r\\n    font-size: 1.4rem;\\r\\n    display: flex;\\r\\n    align-items: center;\\r\\n    justify-content: center;\\r\\n    width: 100%;\\r\\n    height: 100%;\\r\\n    text-decoration: none;\\r\\n    margin-bottom: 1rem;\\r\\n  }\\r\\n\\r\\n  nav {\\r\\n    display: flex;\\r\\n    flex-direction: column;\\r\\n    justify-content: center;\\r\\n  }\\r\\n\\r\\n  nav h3 {\\r\\n    margin: 0;\\r\\n    margin-bottom: 0.5rem;\\r\\n    padding-left: 1rem;\\r\\n    font-family: var(--fontFamilyDisplay);\\r\\n    font-weight: normal;\\r\\n    letter-spacing: 2px;\\r\\n    color: var(--navHeaderColor);\\r\\n    /* text-transform: uppercase; */\\r\\n    font-size: 1rem;\\r\\n  }\\r\\n\\r\\n  nav ul {\\r\\n    position: relative;\\r\\n    padding: 0;\\r\\n    margin: 0;\\r\\n    width: 100%;\\r\\n    display: flex;\\r\\n    flex-direction: column;\\r\\n    justify-content: center;\\r\\n    align-items: center;\\r\\n    list-style: none;\\r\\n    background-size: contain;\\r\\n  }\\r\\n\\r\\n  li {\\r\\n    position: relative;\\r\\n    height: 100%;\\r\\n    width: 100%;\\r\\n    padding: 0.5rem 0;\\r\\n  }\\r\\n\\r\\n  li:hover {\\r\\n    text-decoration: underline;\\r\\n  }\\r\\n\\r\\n  li.active {\\r\\n    background-color: var(--navbarSelected);\\r\\n    color: var(--navbarSelectedFont);\\r\\n  }\\r\\n\\r\\n  nav ul li a {\\r\\n    height: 100%;\\r\\n    align-items: center;\\r\\n    padding: 0 1em;\\r\\n    color: var(--heading-color);\\r\\n    font-weight: 700;\\r\\n    font-size: 1rem;\\r\\n    text-transform: uppercase;\\r\\n    letter-spacing: 10%;\\r\\n    text-decoration: none;\\r\\n    transition: color 0.2s linear;\\r\\n  }\\r\\n\\r\\n  nav ul li:last-child {\\r\\n    color: var(--navHeaderColor);\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAkFE,MAAM,4BAAC,CAAC,AACN,QAAQ,CAAE,KAAK,CACf,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,KAAK,CACf,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,eAAe,CAAE,aAAa,CAC9B,gBAAgB,CAAE,IAAI,QAAQ,CAAC,CAC/B,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,YAAY,CAAE,IAAI,CAClB,KAAK,CAAE,KAAK,CACZ,UAAU,CAAE,GAAG,CAAC,GAAG,CAAC,IAAI,CAAC,KAAK,CAAC,IAAI,aAAa,CAAC,CACjD,MAAM,CAAE,IAAI,AACd,CAAC,AAED,OAAO,4BAAC,CAAC,AACP,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,OAAO,CAAE,IAAI,AACf,CAAC,AAED,qBAAO,CAAC,CAAC,cAAC,CAAC,AACT,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,WAAW,CAAE,IAAI,mBAAmB,CAAC,CACrC,SAAS,CAAE,MAAM,CACjB,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,eAAe,CAAE,IAAI,CACrB,aAAa,CAAE,IAAI,AACrB,CAAC,AAED,GAAG,4BAAC,CAAC,AACH,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,eAAe,CAAE,MAAM,AACzB,CAAC,AAED,iBAAG,CAAC,EAAE,cAAC,CAAC,AACN,MAAM,CAAE,CAAC,CACT,aAAa,CAAE,MAAM,CACrB,YAAY,CAAE,IAAI,CAClB,WAAW,CAAE,IAAI,mBAAmB,CAAC,CACrC,WAAW,CAAE,MAAM,CACnB,cAAc,CAAE,GAAG,CACnB,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAE5B,SAAS,CAAE,IAAI,AACjB,CAAC,AAED,iBAAG,CAAC,EAAE,cAAC,CAAC,AACN,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,CAAC,CACV,MAAM,CAAE,CAAC,CACT,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,UAAU,CAAE,IAAI,CAChB,eAAe,CAAE,OAAO,AAC1B,CAAC,AAED,EAAE,4BAAC,CAAC,AACF,QAAQ,CAAE,QAAQ,CAClB,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,MAAM,CAAC,CAAC,AACnB,CAAC,AAED,8BAAE,MAAM,AAAC,CAAC,AACR,eAAe,CAAE,SAAS,AAC5B,CAAC,AAED,EAAE,OAAO,4BAAC,CAAC,AACT,gBAAgB,CAAE,IAAI,gBAAgB,CAAC,CACvC,KAAK,CAAE,IAAI,oBAAoB,CAAC,AAClC,CAAC,AAED,iBAAG,CAAC,EAAE,CAAC,EAAE,CAAC,CAAC,cAAC,CAAC,AACX,MAAM,CAAE,IAAI,CACZ,WAAW,CAAE,MAAM,CACnB,OAAO,CAAE,CAAC,CAAC,GAAG,CACd,KAAK,CAAE,IAAI,eAAe,CAAC,CAC3B,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,IAAI,CACf,cAAc,CAAE,SAAS,CACzB,cAAc,CAAE,GAAG,CACnB,eAAe,CAAE,IAAI,CACrB,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,MAAM,AAC/B,CAAC,AAED,iBAAG,CAAC,EAAE,CAAC,gBAAE,WAAW,AAAC,CAAC,AACpB,KAAK,CAAE,IAAI,gBAAgB,CAAC,AAC9B,CAAC"}'
};
var AppHeader = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $session, $$unsubscribe_session;
  let $page, $$unsubscribe_page;
  $$unsubscribe_session = subscribe(session, (value) => $session = value);
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  var __awaiter2 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve2) {
        resolve2(value);
      });
    }
    return new (P || (P = Promise))(function(resolve2, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var _a;
  const isClient = ((_a = $session.user.user_settings.find((us) => us.key = "isClient")) === null || _a === void 0 ? void 0 : _a.value) === "true";
  let organizations = [];
  let locations = [];
  let selectedOrg;
  const fetchOrgs = () => __awaiter2(void 0, void 0, void 0, function* () {
    try {
      const orgRes = yield get({
        path: `api/v1/organizations?userId=${$session.user.id}`,
        token: $session.token
      });
      return orgRes.data;
    } catch (err) {
      console.log(err);
    }
  });
  onMount(() => __awaiter2(void 0, void 0, void 0, function* () {
    var _b;
    organizations = yield fetchOrgs();
    selectedOrg = organizations === null || organizations === void 0 ? void 0 : organizations.find((o) => o.id === parseInt($page.params.orgId));
    console.log(selectedOrg);
    locations = (_b = selectedOrg === null || selectedOrg === void 0 ? void 0 : selectedOrg.location) !== null && _b !== void 0 ? _b : [];
  }));
  $$result.css.add(css$g);
  $$unsubscribe_session();
  $$unsubscribe_page();
  return `<header class="${"svelte-zsrif0"}"><div class="${"corner svelte-zsrif0"}"><a href="${"/app"}" class="${"svelte-zsrif0"}">\u{1F33F} Pupper</a>
    ${validate_component(OrganizationPicker, "OrganizationPicker").$$render($$result, { organizations }, {}, {})}</div>
  <nav class="${"svelte-zsrif0"}">${isClient ? `<h3 class="${"svelte-zsrif0"}">Locations</h3>
      <ul class="${"svelte-zsrif0"}">${each(locations, (location) => `<li class="${[
    "svelte-zsrif0",
    $page.path === `/app/o/${selectedOrg.id}/l/${location.id}` ? "active" : ""
  ].join(" ").trim()}"><a${add_attribute("href", `/app/o/${selectedOrg.id}/l/${location.id}`, 0)} class="${"svelte-zsrif0"}">${escape2(location.name)}</a>
          </li>`)}
        <li class="${"svelte-zsrif0"}"><a${add_attribute("href", `/app/o/${selectedOrg == null ? void 0 : selectedOrg.id}/createLocation`, 0)} class="${"svelte-zsrif0"}">+ Create location</a></li></ul>` : `<ul class="${"svelte-zsrif0"}"><li class="${"svelte-zsrif0"}"><a href="${"/app"}" class="${"svelte-zsrif0"}">Dashboard</a></li>
        <li class="${"svelte-zsrif0"}"><a href="${"/app/pets"}" class="${"svelte-zsrif0"}">Pets</a></li>
        <li class="${"svelte-zsrif0"}"><a href="${"/app/bookings"}" class="${"svelte-zsrif0"}">Bookings</a></li></ul>`}</nav>

  <div class="${"corner svelte-zsrif0"}">
    <a href="${"/app/logout"}" class="${"svelte-zsrif0"}">Logout \u270C</a>
    ${validate_component(ThemeSwitcher, "ThemeSwitcher").$$render($$result, {}, {}, {})}</div>
</header>`;
});
var css$f = {
  code: "main.svelte-rusvpj{margin-left:225px;padding-left:1rem;overflow:auto}",
  map: `{"version":3,"file":"__layout.reset.svelte","sources":["__layout.reset.svelte"],"sourcesContent":["<script context=\\"module\\" lang=\\"ts\\">var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\\r\\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\\r\\n    return new (P || (P = Promise))(function (resolve, reject) {\\r\\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\\r\\n        function rejected(value) { try { step(generator[\\"throw\\"](value)); } catch (e) { reject(e); } }\\r\\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\\r\\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\\r\\n    });\\r\\n};\\r\\nimport Header from '$lib/header/AppHeader.svelte';\\r\\n;\\r\\nimport { me } from '$lib/stores/auth';\\r\\nexport function load({ session }) {\\r\\n    return __awaiter(this, void 0, void 0, function* () {\\r\\n        if (!session.token) {\\r\\n            return {\\r\\n                status: 303,\\r\\n                redirect: '/',\\r\\n            };\\r\\n        }\\r\\n        const user = yield me(session.token);\\r\\n        if (user) {\\r\\n            session.user = user;\\r\\n            return { props: Object.assign({}, user) };\\r\\n        }\\r\\n        else {\\r\\n            return {\\r\\n                status: 302,\\r\\n                redirect: '/login',\\r\\n            };\\r\\n        }\\r\\n    });\\r\\n}\\r\\n<\/script>\\r\\n\\r\\n<script lang=\\"ts\\">import { theme } from '$lib/stores/theme';\\r\\n<\/script>\\r\\n\\r\\n<svelte:head>\\r\\n  <meta\\r\\n    name=\\"color-scheme\\"\\r\\n    content={$theme === 'system' ? 'light dark' : $theme}\\r\\n  />\\r\\n  <link rel=\\"stylesheet\\" href={\`/theme/\${$theme}.css\`} />\\r\\n</svelte:head>\\r\\n\\r\\n<div>\\r\\n  <Header />\\r\\n  <main>\\r\\n    <slot />\\r\\n  </main>\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n  main {\\r\\n    margin-left: 225px;\\r\\n    padding-left: 1rem;\\r\\n    overflow: auto;\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAsDE,IAAI,cAAC,CAAC,AACJ,WAAW,CAAE,KAAK,CAClB,YAAY,CAAE,IAAI,CAClB,QAAQ,CAAE,IAAI,AAChB,CAAC"}`
};
var __awaiter$6 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
function load$8({ session: session2 }) {
  return __awaiter$6(this, void 0, void 0, function* () {
    if (!session2.token) {
      return { status: 303, redirect: "/" };
    }
    const user = yield me(session2.token);
    if (user) {
      session2.user = user;
      return { props: Object.assign({}, user) };
    } else {
      return { status: 302, redirect: "/login" };
    }
  });
}
var _layout_reset = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $theme, $$unsubscribe_theme;
  $$unsubscribe_theme = subscribe(theme, (value) => $theme = value);
  $$result.css.add(css$f);
  $$unsubscribe_theme();
  return `${$$result.head += `<meta name="${"color-scheme"}"${add_attribute("content", $theme === "system" ? "light dark" : $theme, 0)} data-svelte="svelte-4smvxs"><link rel="${"stylesheet"}"${add_attribute("href", `/theme/${$theme}.css`, 0)} data-svelte="svelte-4smvxs">`, ""}

<div>${validate_component(AppHeader, "Header").$$render($$result, {}, {}, {})}
  <main class="${"svelte-rusvpj"}">${slots.default ? slots.default({}) : ``}</main>
</div>`;
});
var __layout_reset = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout_reset,
  load: load$8
});
var SECONDS_A_MINUTE = 60;
var SECONDS_A_HOUR = SECONDS_A_MINUTE * 60;
var SECONDS_A_DAY = SECONDS_A_HOUR * 24;
var SECONDS_A_WEEK = SECONDS_A_DAY * 7;
var MILLISECONDS_A_SECOND = 1e3;
var MILLISECONDS_A_MINUTE = SECONDS_A_MINUTE * MILLISECONDS_A_SECOND;
var MILLISECONDS_A_HOUR = SECONDS_A_HOUR * MILLISECONDS_A_SECOND;
var MILLISECONDS_A_DAY = SECONDS_A_DAY * MILLISECONDS_A_SECOND;
var MILLISECONDS_A_WEEK = SECONDS_A_WEEK * MILLISECONDS_A_SECOND;
var MS = "millisecond";
var S = "second";
var MIN = "minute";
var H = "hour";
var D = "day";
var W = "week";
var M = "month";
var Q = "quarter";
var Y = "year";
var DATE = "date";
var FORMAT_DEFAULT = "YYYY-MM-DDTHH:mm:ssZ";
var INVALID_DATE_STRING = "Invalid Date";
var REGEX_PARSE = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/;
var REGEX_FORMAT = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g;
var en = {
  name: "en",
  weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
  months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_")
};
var padStart = function padStart2(string, length, pad) {
  var s2 = String(string);
  if (!s2 || s2.length >= length)
    return string;
  return "" + Array(length + 1 - s2.length).join(pad) + string;
};
var padZoneStr = function padZoneStr2(instance) {
  var negMinutes = -instance.utcOffset();
  var minutes = Math.abs(negMinutes);
  var hourOffset = Math.floor(minutes / 60);
  var minuteOffset = minutes % 60;
  return "" + (negMinutes <= 0 ? "+" : "-") + padStart(hourOffset, 2, "0") + ":" + padStart(minuteOffset, 2, "0");
};
var monthDiff = function monthDiff2(a, b) {
  if (a.date() < b.date())
    return -monthDiff2(b, a);
  var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month());
  var anchor = a.clone().add(wholeMonthDiff, M);
  var c = b - anchor < 0;
  var anchor2 = a.clone().add(wholeMonthDiff + (c ? -1 : 1), M);
  return +(-(wholeMonthDiff + (b - anchor) / (c ? anchor - anchor2 : anchor2 - anchor)) || 0);
};
var absFloor = function absFloor2(n) {
  return n < 0 ? Math.ceil(n) || 0 : Math.floor(n);
};
var prettyUnit = function prettyUnit2(u) {
  var special = {
    M,
    y: Y,
    w: W,
    d: D,
    D: DATE,
    h: H,
    m: MIN,
    s: S,
    ms: MS,
    Q
  };
  return special[u] || String(u || "").toLowerCase().replace(/s$/, "");
};
var isUndefined = function isUndefined2(s2) {
  return s2 === void 0;
};
var U = {
  s: padStart,
  z: padZoneStr,
  m: monthDiff,
  a: absFloor,
  p: prettyUnit,
  u: isUndefined
};
var L = "en";
var Ls = {};
Ls[L] = en;
var isDayjs = function isDayjs2(d2) {
  return d2 instanceof Dayjs;
};
var parseLocale = function parseLocale2(preset, object, isLocal) {
  var l;
  if (!preset)
    return L;
  if (typeof preset === "string") {
    if (Ls[preset]) {
      l = preset;
    }
    if (object) {
      Ls[preset] = object;
      l = preset;
    }
  } else {
    var name = preset.name;
    Ls[name] = preset;
    l = name;
  }
  if (!isLocal && l)
    L = l;
  return l || !isLocal && L;
};
var dayjs = function dayjs2(date, c) {
  if (isDayjs(date)) {
    return date.clone();
  }
  var cfg = typeof c === "object" ? c : {};
  cfg.date = date;
  cfg.args = arguments;
  return new Dayjs(cfg);
};
var wrapper = function wrapper2(date, instance) {
  return dayjs(date, {
    locale: instance.$L,
    utc: instance.$u,
    x: instance.$x,
    $offset: instance.$offset
  });
};
var Utils = U;
Utils.l = parseLocale;
Utils.i = isDayjs;
Utils.w = wrapper;
var parseDate = function parseDate2(cfg) {
  var date = cfg.date, utc = cfg.utc;
  if (date === null)
    return new Date(NaN);
  if (Utils.u(date))
    return new Date();
  if (date instanceof Date)
    return new Date(date);
  if (typeof date === "string" && !/Z$/i.test(date)) {
    var d2 = date.match(REGEX_PARSE);
    if (d2) {
      var m = d2[2] - 1 || 0;
      var ms = (d2[7] || "0").substring(0, 3);
      if (utc) {
        return new Date(Date.UTC(d2[1], m, d2[3] || 1, d2[4] || 0, d2[5] || 0, d2[6] || 0, ms));
      }
      return new Date(d2[1], m, d2[3] || 1, d2[4] || 0, d2[5] || 0, d2[6] || 0, ms);
    }
  }
  return new Date(date);
};
var Dayjs = /* @__PURE__ */ function() {
  function Dayjs2(cfg) {
    this.$L = parseLocale(cfg.locale, null, true);
    this.parse(cfg);
  }
  var _proto = Dayjs2.prototype;
  _proto.parse = function parse(cfg) {
    this.$d = parseDate(cfg);
    this.$x = cfg.x || {};
    this.init();
  };
  _proto.init = function init2() {
    var $d = this.$d;
    this.$y = $d.getFullYear();
    this.$M = $d.getMonth();
    this.$D = $d.getDate();
    this.$W = $d.getDay();
    this.$H = $d.getHours();
    this.$m = $d.getMinutes();
    this.$s = $d.getSeconds();
    this.$ms = $d.getMilliseconds();
  };
  _proto.$utils = function $utils() {
    return Utils;
  };
  _proto.isValid = function isValid() {
    return !(this.$d.toString() === INVALID_DATE_STRING);
  };
  _proto.isSame = function isSame(that, units) {
    var other = dayjs(that);
    return this.startOf(units) <= other && other <= this.endOf(units);
  };
  _proto.isAfter = function isAfter(that, units) {
    return dayjs(that) < this.startOf(units);
  };
  _proto.isBefore = function isBefore(that, units) {
    return this.endOf(units) < dayjs(that);
  };
  _proto.$g = function $g(input, get2, set2) {
    if (Utils.u(input))
      return this[get2];
    return this.set(set2, input);
  };
  _proto.unix = function unix() {
    return Math.floor(this.valueOf() / 1e3);
  };
  _proto.valueOf = function valueOf() {
    return this.$d.getTime();
  };
  _proto.startOf = function startOf(units, _startOf) {
    var _this = this;
    var isStartOf = !Utils.u(_startOf) ? _startOf : true;
    var unit = Utils.p(units);
    var instanceFactory = function instanceFactory2(d2, m) {
      var ins = Utils.w(_this.$u ? Date.UTC(_this.$y, m, d2) : new Date(_this.$y, m, d2), _this);
      return isStartOf ? ins : ins.endOf(D);
    };
    var instanceFactorySet = function instanceFactorySet2(method, slice) {
      var argumentStart = [0, 0, 0, 0];
      var argumentEnd = [23, 59, 59, 999];
      return Utils.w(_this.toDate()[method].apply(_this.toDate("s"), (isStartOf ? argumentStart : argumentEnd).slice(slice)), _this);
    };
    var $W = this.$W, $M = this.$M, $D = this.$D;
    var utcPad = "set" + (this.$u ? "UTC" : "");
    switch (unit) {
      case Y:
        return isStartOf ? instanceFactory(1, 0) : instanceFactory(31, 11);
      case M:
        return isStartOf ? instanceFactory(1, $M) : instanceFactory(0, $M + 1);
      case W: {
        var weekStart = this.$locale().weekStart || 0;
        var gap = ($W < weekStart ? $W + 7 : $W) - weekStart;
        return instanceFactory(isStartOf ? $D - gap : $D + (6 - gap), $M);
      }
      case D:
      case DATE:
        return instanceFactorySet(utcPad + "Hours", 0);
      case H:
        return instanceFactorySet(utcPad + "Minutes", 1);
      case MIN:
        return instanceFactorySet(utcPad + "Seconds", 2);
      case S:
        return instanceFactorySet(utcPad + "Milliseconds", 3);
      default:
        return this.clone();
    }
  };
  _proto.endOf = function endOf(arg) {
    return this.startOf(arg, false);
  };
  _proto.$set = function $set(units, _int) {
    var _C$D$C$DATE$C$M$C$Y$C;
    var unit = Utils.p(units);
    var utcPad = "set" + (this.$u ? "UTC" : "");
    var name = (_C$D$C$DATE$C$M$C$Y$C = {}, _C$D$C$DATE$C$M$C$Y$C[D] = utcPad + "Date", _C$D$C$DATE$C$M$C$Y$C[DATE] = utcPad + "Date", _C$D$C$DATE$C$M$C$Y$C[M] = utcPad + "Month", _C$D$C$DATE$C$M$C$Y$C[Y] = utcPad + "FullYear", _C$D$C$DATE$C$M$C$Y$C[H] = utcPad + "Hours", _C$D$C$DATE$C$M$C$Y$C[MIN] = utcPad + "Minutes", _C$D$C$DATE$C$M$C$Y$C[S] = utcPad + "Seconds", _C$D$C$DATE$C$M$C$Y$C[MS] = utcPad + "Milliseconds", _C$D$C$DATE$C$M$C$Y$C)[unit];
    var arg = unit === D ? this.$D + (_int - this.$W) : _int;
    if (unit === M || unit === Y) {
      var date = this.clone().set(DATE, 1);
      date.$d[name](arg);
      date.init();
      this.$d = date.set(DATE, Math.min(this.$D, date.daysInMonth())).$d;
    } else if (name)
      this.$d[name](arg);
    this.init();
    return this;
  };
  _proto.set = function set2(string, _int2) {
    return this.clone().$set(string, _int2);
  };
  _proto.get = function get2(unit) {
    return this[Utils.p(unit)]();
  };
  _proto.add = function add(number, units) {
    var _this2 = this, _C$MIN$C$H$C$S$unit;
    number = Number(number);
    var unit = Utils.p(units);
    var instanceFactorySet = function instanceFactorySet2(n) {
      var d2 = dayjs(_this2);
      return Utils.w(d2.date(d2.date() + Math.round(n * number)), _this2);
    };
    if (unit === M) {
      return this.set(M, this.$M + number);
    }
    if (unit === Y) {
      return this.set(Y, this.$y + number);
    }
    if (unit === D) {
      return instanceFactorySet(1);
    }
    if (unit === W) {
      return instanceFactorySet(7);
    }
    var step = (_C$MIN$C$H$C$S$unit = {}, _C$MIN$C$H$C$S$unit[MIN] = MILLISECONDS_A_MINUTE, _C$MIN$C$H$C$S$unit[H] = MILLISECONDS_A_HOUR, _C$MIN$C$H$C$S$unit[S] = MILLISECONDS_A_SECOND, _C$MIN$C$H$C$S$unit)[unit] || 1;
    var nextTimeStamp = this.$d.getTime() + number * step;
    return Utils.w(nextTimeStamp, this);
  };
  _proto.subtract = function subtract(number, string) {
    return this.add(number * -1, string);
  };
  _proto.format = function format2(formatStr) {
    var _this3 = this;
    var locale = this.$locale();
    if (!this.isValid())
      return locale.invalidDate || INVALID_DATE_STRING;
    var str = formatStr || FORMAT_DEFAULT;
    var zoneStr = Utils.z(this);
    var $H = this.$H, $m = this.$m, $M = this.$M;
    var weekdays = locale.weekdays, months = locale.months, meridiem = locale.meridiem;
    var getShort = function getShort2(arr, index2, full, length) {
      return arr && (arr[index2] || arr(_this3, str)) || full[index2].substr(0, length);
    };
    var get$H = function get$H2(num) {
      return Utils.s($H % 12 || 12, num, "0");
    };
    var meridiemFunc = meridiem || function(hour, minute, isLowercase) {
      var m = hour < 12 ? "AM" : "PM";
      return isLowercase ? m.toLowerCase() : m;
    };
    var matches = {
      YY: String(this.$y).slice(-2),
      YYYY: this.$y,
      M: $M + 1,
      MM: Utils.s($M + 1, 2, "0"),
      MMM: getShort(locale.monthsShort, $M, months, 3),
      MMMM: getShort(months, $M),
      D: this.$D,
      DD: Utils.s(this.$D, 2, "0"),
      d: String(this.$W),
      dd: getShort(locale.weekdaysMin, this.$W, weekdays, 2),
      ddd: getShort(locale.weekdaysShort, this.$W, weekdays, 3),
      dddd: weekdays[this.$W],
      H: String($H),
      HH: Utils.s($H, 2, "0"),
      h: get$H(1),
      hh: get$H(2),
      a: meridiemFunc($H, $m, true),
      A: meridiemFunc($H, $m, false),
      m: String($m),
      mm: Utils.s($m, 2, "0"),
      s: String(this.$s),
      ss: Utils.s(this.$s, 2, "0"),
      SSS: Utils.s(this.$ms, 3, "0"),
      Z: zoneStr
    };
    return str.replace(REGEX_FORMAT, function(match, $1) {
      return $1 || matches[match] || zoneStr.replace(":", "");
    });
  };
  _proto.utcOffset = function utcOffset() {
    return -Math.round(this.$d.getTimezoneOffset() / 15) * 15;
  };
  _proto.diff = function diff(input, units, _float) {
    var _C$Y$C$M$C$Q$C$W$C$D$;
    var unit = Utils.p(units);
    var that = dayjs(input);
    var zoneDelta = (that.utcOffset() - this.utcOffset()) * MILLISECONDS_A_MINUTE;
    var diff2 = this - that;
    var result = Utils.m(this, that);
    result = (_C$Y$C$M$C$Q$C$W$C$D$ = {}, _C$Y$C$M$C$Q$C$W$C$D$[Y] = result / 12, _C$Y$C$M$C$Q$C$W$C$D$[M] = result, _C$Y$C$M$C$Q$C$W$C$D$[Q] = result / 3, _C$Y$C$M$C$Q$C$W$C$D$[W] = (diff2 - zoneDelta) / MILLISECONDS_A_WEEK, _C$Y$C$M$C$Q$C$W$C$D$[D] = (diff2 - zoneDelta) / MILLISECONDS_A_DAY, _C$Y$C$M$C$Q$C$W$C$D$[H] = diff2 / MILLISECONDS_A_HOUR, _C$Y$C$M$C$Q$C$W$C$D$[MIN] = diff2 / MILLISECONDS_A_MINUTE, _C$Y$C$M$C$Q$C$W$C$D$[S] = diff2 / MILLISECONDS_A_SECOND, _C$Y$C$M$C$Q$C$W$C$D$)[unit] || diff2;
    return _float ? result : Utils.a(result);
  };
  _proto.daysInMonth = function daysInMonth() {
    return this.endOf(M).$D;
  };
  _proto.$locale = function $locale() {
    return Ls[this.$L];
  };
  _proto.locale = function locale(preset, object) {
    if (!preset)
      return this.$L;
    var that = this.clone();
    var nextLocaleName = parseLocale(preset, object, true);
    if (nextLocaleName)
      that.$L = nextLocaleName;
    return that;
  };
  _proto.clone = function clone2() {
    return Utils.w(this.$d, this);
  };
  _proto.toDate = function toDate() {
    return new Date(this.valueOf());
  };
  _proto.toJSON = function toJSON() {
    return this.isValid() ? this.toISOString() : null;
  };
  _proto.toISOString = function toISOString() {
    return this.$d.toISOString();
  };
  _proto.toString = function toString() {
    return this.$d.toUTCString();
  };
  return Dayjs2;
}();
var proto = Dayjs.prototype;
dayjs.prototype = proto;
[["$ms", MS], ["$s", S], ["$m", MIN], ["$H", H], ["$W", D], ["$M", M], ["$y", Y], ["$D", DATE]].forEach(function(g) {
  proto[g[1]] = function(input) {
    return this.$g(input, g[0], g[1]);
  };
});
dayjs.extend = function(plugin, option) {
  if (!plugin.$i) {
    plugin(option, Dayjs, dayjs);
    plugin.$i = true;
  }
  return dayjs;
};
dayjs.locale = parseLocale;
dayjs.isDayjs = isDayjs;
dayjs.unix = function(timestamp) {
  return dayjs(timestamp * 1e3);
};
dayjs.en = Ls[L];
dayjs.Ls = Ls;
dayjs.p = {};
var css$e = {
  code: "table.svelte-1nyr7p7.svelte-1nyr7p7{border-spacing:0;padding-top:16px;padding-bottom:16px;text-align:left}tr.svelte-1nyr7p7.svelte-1nyr7p7{margin-left:10px;margin-right:10px}td.svelte-1nyr7p7.svelte-1nyr7p7,th.svelte-1nyr7p7.svelte-1nyr7p7{background-color:var(--tableRowColor);padding:5px 16px}.nestedRow.svelte-1nyr7p7 td.svelte-1nyr7p7{background-color:var(--tableSubRowColor)}",
  map: `{"version":3,"file":"BookingsList.svelte","sources":["BookingsList.svelte"],"sourcesContent":["<script lang=\\"ts\\">var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\\r\\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\\r\\n    return new (P || (P = Promise))(function (resolve, reject) {\\r\\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\\r\\n        function rejected(value) { try { step(generator[\\"throw\\"](value)); } catch (e) { reject(e); } }\\r\\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\\r\\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\\r\\n    });\\r\\n};\\r\\nimport { get } from '$lib/api';\\r\\nimport { session } from '$app/stores';\\r\\nimport { onMount } from 'svelte';\\r\\n;\\r\\nimport dayjs from 'dayjs/esm';\\r\\nexport let bookings = undefined;\\r\\nconsole.log(bookings);\\r\\nonMount(() => __awaiter(void 0, void 0, void 0, function* () {\\r\\n    if (bookings !== undefined) {\\r\\n        return;\\r\\n    }\\r\\n    try {\\r\\n        const res = yield get({\\r\\n            path: \`api/v1/bookings?userId=\${$session.user.id}\`,\\r\\n            token: $session.token,\\r\\n        });\\r\\n        bookings = res.data;\\r\\n    }\\r\\n    catch (err) {\\r\\n        console.log(err);\\r\\n    }\\r\\n}));\\r\\n<\/script>\\r\\n\\r\\n<div>\\r\\n  {#if bookings && bookings.length > 0}\\r\\n    <table>\\r\\n      <thead>\\r\\n        <tr>\\r\\n          <th>Drop Off At</th>\\r\\n          <th>Pick Up At</th>\\r\\n          <th>User</th>\\r\\n          <th>Email</th>\\r\\n        </tr>\\r\\n      </thead>\\r\\n      <tbody>\\r\\n        {#each bookings as booking}\\r\\n          <tr>\\r\\n            <td>\\r\\n              {dayjs(booking.drop_off_at).format('MM/DD/YYYY h:mm A')}\\r\\n            </td>\\r\\n            <td> {dayjs(booking.pick_up_at).format('MM/DD/YYYY h:mm A')} </td>\\r\\n            <td>\\r\\n              {booking.user.first_name ?? ''}\\r\\n              {booking.user.last_name ?? ''}\\r\\n            </td>\\r\\n            <td> {booking.user.email} </td>\\r\\n          </tr>\\r\\n\\r\\n          {#each booking.booking_details as bd}\\r\\n            <tr class=\\"nestedRow\\">\\r\\n              <td> {bd.pet.name} </td>\\r\\n              <td />\\r\\n              <td> Check In </td>\\r\\n              <td> Check Out </td>\\r\\n            </tr>\\r\\n          {/each}\\r\\n        {/each}\\r\\n      </tbody>\\r\\n    </table>\\r\\n  {:else}\\r\\n    <p>No upcoming bookings</p>\\r\\n  {/if}\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n  table {\\r\\n    border-spacing: 0;\\r\\n    padding-top: 16px;\\r\\n    padding-bottom: 16px;\\r\\n    text-align: left;\\r\\n  }\\r\\n\\r\\n  tr {\\r\\n    margin-left: 10px;\\r\\n    margin-right: 10px;\\r\\n  }\\r\\n\\r\\n  td,\\r\\n  th {\\r\\n    background-color: var(--tableRowColor);\\r\\n    padding: 5px 16px;\\r\\n  }\\r\\n  .nestedRow td {\\r\\n    background-color: var(--tableSubRowColor);\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AA2EE,KAAK,8BAAC,CAAC,AACL,cAAc,CAAE,CAAC,CACjB,WAAW,CAAE,IAAI,CACjB,cAAc,CAAE,IAAI,CACpB,UAAU,CAAE,IAAI,AAClB,CAAC,AAED,EAAE,8BAAC,CAAC,AACF,WAAW,CAAE,IAAI,CACjB,YAAY,CAAE,IAAI,AACpB,CAAC,AAED,gCAAE,CACF,EAAE,8BAAC,CAAC,AACF,gBAAgB,CAAE,IAAI,eAAe,CAAC,CACtC,OAAO,CAAE,GAAG,CAAC,IAAI,AACnB,CAAC,AACD,yBAAU,CAAC,EAAE,eAAC,CAAC,AACb,gBAAgB,CAAE,IAAI,kBAAkB,CAAC,AAC3C,CAAC"}`
};
var BookingsList = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $session, $$unsubscribe_session;
  $$unsubscribe_session = subscribe(session, (value) => $session = value);
  var __awaiter2 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve2) {
        resolve2(value);
      });
    }
    return new (P || (P = Promise))(function(resolve2, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  let { bookings = void 0 } = $$props;
  console.log(bookings);
  onMount(() => __awaiter2(void 0, void 0, void 0, function* () {
    if (bookings !== void 0) {
      return;
    }
    try {
      const res = yield get({
        path: `api/v1/bookings?userId=${$session.user.id}`,
        token: $session.token
      });
      bookings = res.data;
    } catch (err) {
      console.log(err);
    }
  }));
  if ($$props.bookings === void 0 && $$bindings.bookings && bookings !== void 0)
    $$bindings.bookings(bookings);
  $$result.css.add(css$e);
  $$unsubscribe_session();
  return `<div>${bookings && bookings.length > 0 ? `<table class="${"svelte-1nyr7p7"}"><thead><tr class="${"svelte-1nyr7p7"}"><th class="${"svelte-1nyr7p7"}">Drop Off At</th>
          <th class="${"svelte-1nyr7p7"}">Pick Up At</th>
          <th class="${"svelte-1nyr7p7"}">User</th>
          <th class="${"svelte-1nyr7p7"}">Email</th></tr></thead>
      <tbody>${each(bookings, (booking) => {
    var _a, _b;
    return `<tr class="${"svelte-1nyr7p7"}"><td class="${"svelte-1nyr7p7"}">${escape2(dayjs(booking.drop_off_at).format("MM/DD/YYYY h:mm A"))}</td>
            <td class="${"svelte-1nyr7p7"}">${escape2(dayjs(booking.pick_up_at).format("MM/DD/YYYY h:mm A"))}</td>
            <td class="${"svelte-1nyr7p7"}">${escape2((_a = booking.user.first_name) != null ? _a : "")}
              ${escape2((_b = booking.user.last_name) != null ? _b : "")}</td>
            <td class="${"svelte-1nyr7p7"}">${escape2(booking.user.email)} </td></tr>

          ${each(booking.booking_details, (bd) => `<tr class="${"nestedRow svelte-1nyr7p7"}"><td class="${"svelte-1nyr7p7"}">${escape2(bd.pet.name)}</td>
              <td class="${"svelte-1nyr7p7"}"></td>
              <td class="${"svelte-1nyr7p7"}">Check In </td>
              <td class="${"svelte-1nyr7p7"}">Check Out </td>
            </tr>`)}`;
  })}</tbody></table>` : `<p>No upcoming bookings</p>`}
</div>`;
});
var css$d = {
  code: "li.svelte-1mh9kuq.svelte-1mh9kuq{list-style-type:none;text-align:center;border-radius:5px;background-color:var(--bgCardColor);transition:all 0.1s}li.svelte-1mh9kuq a.svelte-1mh9kuq{display:flex;padding:0.25rem 1rem;text-decoration:none;color:var(--fontColor)}li.svelte-1mh9kuq.svelte-1mh9kuq:hover{background-color:var(--textHighlightPrimary)}",
  map: '{"version":3,"file":"PetCard.svelte","sources":["PetCard.svelte"],"sourcesContent":["<script lang=\\"ts\\">export let id;\\r\\nexport let name;\\r\\nconst url = `/app/pets/${id}`;\\r\\n<\/script>\\r\\n\\r\\n<li style={$$props.style}>\\r\\n  <a href={url}>\\r\\n    <h6>{name}</h6>\\r\\n  </a>\\r\\n</li>\\r\\n\\r\\n<style>\\r\\n  li {\\r\\n    list-style-type: none;\\r\\n    text-align: center;\\r\\n    border-radius: 5px;\\r\\n    background-color: var(--bgCardColor);\\r\\n    transition: all 0.1s;\\r\\n  }\\r\\n\\r\\n  li a {\\r\\n    display: flex;\\r\\n    padding: 0.25rem 1rem;\\r\\n    text-decoration: none;\\r\\n    color: var(--fontColor);\\r\\n  }\\r\\n\\r\\n  li:hover {\\r\\n    background-color: var(--textHighlightPrimary);\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAYE,EAAE,8BAAC,CAAC,AACF,eAAe,CAAE,IAAI,CACrB,UAAU,CAAE,MAAM,CAClB,aAAa,CAAE,GAAG,CAClB,gBAAgB,CAAE,IAAI,aAAa,CAAC,CACpC,UAAU,CAAE,GAAG,CAAC,IAAI,AACtB,CAAC,AAED,iBAAE,CAAC,CAAC,eAAC,CAAC,AACJ,OAAO,CAAE,IAAI,CACb,OAAO,CAAE,OAAO,CAAC,IAAI,CACrB,eAAe,CAAE,IAAI,CACrB,KAAK,CAAE,IAAI,WAAW,CAAC,AACzB,CAAC,AAED,gCAAE,MAAM,AAAC,CAAC,AACR,gBAAgB,CAAE,IAAI,sBAAsB,CAAC,AAC/C,CAAC"}'
};
var PetCard = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { id } = $$props;
  let { name } = $$props;
  const url = `/app/pets/${id}`;
  if ($$props.id === void 0 && $$bindings.id && id !== void 0)
    $$bindings.id(id);
  if ($$props.name === void 0 && $$bindings.name && name !== void 0)
    $$bindings.name(name);
  $$result.css.add(css$d);
  return `<li${add_attribute("style", $$props.style, 0)} class="${"svelte-1mh9kuq"}"><a${add_attribute("href", url, 0)} class="${"svelte-1mh9kuq"}"><h6>${escape2(name)}</h6></a>
</li>`;
});
var css$c = {
  code: "ul.svelte-azvv34{max-width:400px;padding-left:0}",
  map: `{"version":3,"file":"PetList.svelte","sources":["PetList.svelte"],"sourcesContent":["<script lang=\\"ts\\">var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\\r\\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\\r\\n    return new (P || (P = Promise))(function (resolve, reject) {\\r\\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\\r\\n        function rejected(value) { try { step(generator[\\"throw\\"](value)); } catch (e) { reject(e); } }\\r\\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\\r\\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\\r\\n    });\\r\\n};\\r\\nimport PetCard from '$lib/pets/PetCard.svelte';\\r\\nimport { get } from '$lib/api';\\r\\nimport { session } from '$app/stores';\\r\\nimport { onMount } from 'svelte';\\r\\nexport let pets = undefined;\\r\\nonMount(() => __awaiter(void 0, void 0, void 0, function* () {\\r\\n    if (pets !== undefined) {\\r\\n        return;\\r\\n    }\\r\\n    try {\\r\\n        const res = yield get({\\r\\n            path: \`api/v1/pets?userId=\${$session.user.id}\`,\\r\\n            token: $session.token,\\r\\n        });\\r\\n        pets = res.data;\\r\\n    }\\r\\n    catch (err) {\\r\\n        console.log(err);\\r\\n    }\\r\\n}));\\r\\n<\/script>\\r\\n\\r\\n{#if pets && pets.length > 0}\\r\\n  <a href=\\"/app/createPet\\">Add Pet</a>\\r\\n  <ul>\\r\\n    {#each pets as pet}\\r\\n      <PetCard name={pet.name} id={pet.id} style=\\"margin-bottom: 15px;\\" />\\r\\n    {/each}\\r\\n  </ul>\\r\\n{:else}\\r\\n  <a href=\\"/app/createPet\\">Let's add your pets!</a>\\r\\n{/if}\\r\\n\\r\\n<style>\\r\\n  ul {\\r\\n    max-width: 400px;\\r\\n    padding-left: 0;\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AA2CE,EAAE,cAAC,CAAC,AACF,SAAS,CAAE,KAAK,CAChB,YAAY,CAAE,CAAC,AACjB,CAAC"}`
};
var PetList = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $session, $$unsubscribe_session;
  $$unsubscribe_session = subscribe(session, (value) => $session = value);
  var __awaiter2 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve2) {
        resolve2(value);
      });
    }
    return new (P || (P = Promise))(function(resolve2, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  let { pets = void 0 } = $$props;
  onMount(() => __awaiter2(void 0, void 0, void 0, function* () {
    if (pets !== void 0) {
      return;
    }
    try {
      const res = yield get({
        path: `api/v1/pets?userId=${$session.user.id}`,
        token: $session.token
      });
      pets = res.data;
    } catch (err) {
      console.log(err);
    }
  }));
  if ($$props.pets === void 0 && $$bindings.pets && pets !== void 0)
    $$bindings.pets(pets);
  $$result.css.add(css$c);
  $$unsubscribe_session();
  return `${pets && pets.length > 0 ? `<a href="${"/app/createPet"}">Add Pet</a>
  <ul class="${"svelte-azvv34"}">${each(pets, (pet) => `${validate_component(PetCard, "PetCard").$$render($$result, {
    name: pet.name,
    id: pet.id,
    style: "margin-bottom: 15px;"
  }, {}, {})}`)}</ul>` : `<a href="${"/app/createPet"}">Let&#39;s add your pets!</a>`}`;
});
var __awaiter$5 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
function load$7({ session: session2 }) {
  var _a;
  return __awaiter$5(this, void 0, void 0, function* () {
    const isClient = ((_a = session2.user.user_settings.find((us) => us.key = "isClient")) === null || _a === void 0 ? void 0 : _a.value) === "true";
    if (isClient) {
      let organizations = session2.user.organization_user.map((org_user) => org_user.organization);
      return {
        redirect: `/app/o/${organizations[0].id}`,
        status: 302
      };
    } else {
      return {};
    }
  });
}
var App = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<h5>Your furry friends</h5>
${validate_component(PetList, "PetList").$$render($$result, {}, {}, {})}
<h5>Upcoming Bookings</h5>
${validate_component(BookingsList, "BookingsList").$$render($$result, {}, {}, {})}`;
});
var index$5 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": App,
  load: load$7
});
var css$b = {
  code: ".container.svelte-gzu733.svelte-gzu733{max-width:400px;padding:1rem;background-color:var(--bgCardColor)}.header.svelte-gzu733.svelte-gzu733,.body.svelte-gzu733.svelte-gzu733{display:grid;grid-template-columns:repeat(7, 1fr)}.header.svelte-gzu733 div.svelte-gzu733{text-align:center;font-size:0.8rem}.body.svelte-gzu733 div.svelte-gzu733{padding:5px;text-align:center;width:40px;height:40px;box-sizing:border-box;display:flex;justify-content:center;align-items:center;border-radius:50%}.past.svelte-gzu733.svelte-gzu733{color:var(--calendarDisabledCellFontColor)}.future.svelte-gzu733.svelte-gzu733{color:var(--fontColor)}.future.svelte-gzu733.svelte-gzu733:hover{cursor:pointer;border:1px solid var(--btnPrimary)}.rangeEnd.svelte-gzu733.svelte-gzu733{background-color:var(--calendarRangeEnd)}.rangeMiddle.svelte-gzu733.svelte-gzu733{background-color:var(--calendarRangeMiddle)}h6.svelte-gzu733.svelte-gzu733{text-align:center}",
  map: `{"version":3,"file":"Calendar.svelte","sources":["Calendar.svelte"],"sourcesContent":["<script lang=\\"ts\\">import dayjs from 'dayjs/esm';\\r\\nexport let highlightStartAt = undefined;\\r\\nexport let highlightEndAt = undefined;\\r\\nexport let onClickCell;\\r\\nexport let date = dayjs();\\r\\nlet now = dayjs();\\r\\nlet daysOfWeek = Array.from(Array(7).keys()).map((_, i) => {\\r\\n    return date.day(i).format('ddd');\\r\\n});\\r\\nlet thisMonth = date;\\r\\nlet daysInThisMonth = thisMonth.daysInMonth();\\r\\nlet beginningOfMonthOffset = date.startOf('month').day();\\r\\nfunction isPastRange(date, start, end) {\\r\\n    return date.isBefore(now);\\r\\n}\\r\\nfunction isMiddleRange(date, start, end) {\\r\\n    const val = date.isBefore(end, 'day') && date.isAfter(start, 'day');\\r\\n    return val;\\r\\n}\\r\\nfunction isEndRange(date, start, end) {\\r\\n    return ((highlightStartAt && date.isSame(start, 'day')) ||\\r\\n        (highlightEndAt && date.isSame(end, 'day')));\\r\\n}\\r\\n<\/script>\\r\\n\\r\\n<div class=\\"container\\">\\r\\n  <h6>{thisMonth.format(\\"MMMM 'YY\\")}</h6>\\r\\n  <div class=\\"header\\">\\r\\n    {#each daysOfWeek as day}\\r\\n      <div>{day}</div>\\r\\n    {/each}\\r\\n  </div>\\r\\n  <div class=\\"body\\">\\r\\n    {#each Array(beginningOfMonthOffset) as _, i}\\r\\n      <div class=\\"past\\" />\\r\\n    {/each}\\r\\n    {#each Array(daysInThisMonth) as _, i}\\r\\n      <div\\r\\n        class=\\"\\r\\n          {isPastRange(\\r\\n          thisMonth.subtract(thisMonth.date() - (i + 1), 'd'),\\r\\n          highlightStartAt,\\r\\n          highlightEndAt\\r\\n        )\\r\\n          ? 'past'\\r\\n          : 'future'}\\r\\n          {isEndRange(\\r\\n          thisMonth.subtract(thisMonth.date() - (i + 1), 'd'),\\r\\n          highlightStartAt,\\r\\n          highlightEndAt\\r\\n        )\\r\\n          ? 'rangeEnd'\\r\\n          : ''}\\r\\n          {isMiddleRange(\\r\\n          thisMonth.subtract(thisMonth.date() - (i + 1), 'd'),\\r\\n          highlightStartAt,\\r\\n          highlightEndAt\\r\\n        )\\r\\n          ? 'rangeMiddle'\\r\\n          : ''}\\r\\n        \\"\\r\\n        on:click={onClickCell(\\r\\n          thisMonth.subtract(thisMonth.date() - (i + 1), 'd')\\r\\n        )}\\r\\n      >\\r\\n        <div>\\r\\n          {thisMonth.subtract(thisMonth.date() - (i + 1), 'd').format('D')}\\r\\n        </div>\\r\\n      </div>\\r\\n    {/each}\\r\\n  </div>\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n  .container {\\r\\n    max-width: 400px;\\r\\n    padding: 1rem;\\r\\n    background-color: var(--bgCardColor);\\r\\n  }\\r\\n\\r\\n  .header,\\r\\n  .body {\\r\\n    display: grid;\\r\\n    grid-template-columns: repeat(7, 1fr);\\r\\n  }\\r\\n\\r\\n  .header div {\\r\\n    text-align: center;\\r\\n    font-size: 0.8rem;\\r\\n  }\\r\\n\\r\\n  .body div {\\r\\n    padding: 5px;\\r\\n    text-align: center;\\r\\n    width: 40px;\\r\\n    height: 40px;\\r\\n    box-sizing: border-box;\\r\\n    display: flex;\\r\\n    justify-content: center;\\r\\n    align-items: center;\\r\\n    border-radius: 50%;\\r\\n  }\\r\\n\\r\\n  .past {\\r\\n    color: var(--calendarDisabledCellFontColor);\\r\\n  }\\r\\n\\r\\n  .future {\\r\\n    color: var(--fontColor);\\r\\n    /* transition: all 0.25s; */\\r\\n  }\\r\\n\\r\\n  .future:hover {\\r\\n    cursor: pointer;\\r\\n    border: 1px solid var(--btnPrimary);\\r\\n  }\\r\\n\\r\\n  .rangeEnd {\\r\\n    background-color: var(--calendarRangeEnd);\\r\\n  }\\r\\n\\r\\n  .rangeMiddle {\\r\\n    background-color: var(--calendarRangeMiddle);\\r\\n  }\\r\\n\\r\\n  h6 {\\r\\n    text-align: center;\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AA0EE,UAAU,4BAAC,CAAC,AACV,SAAS,CAAE,KAAK,CAChB,OAAO,CAAE,IAAI,CACb,gBAAgB,CAAE,IAAI,aAAa,CAAC,AACtC,CAAC,AAED,mCAAO,CACP,KAAK,4BAAC,CAAC,AACL,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,OAAO,CAAC,CAAC,CAAC,GAAG,CAAC,AACvC,CAAC,AAED,qBAAO,CAAC,GAAG,cAAC,CAAC,AACX,UAAU,CAAE,MAAM,CAClB,SAAS,CAAE,MAAM,AACnB,CAAC,AAED,mBAAK,CAAC,GAAG,cAAC,CAAC,AACT,OAAO,CAAE,GAAG,CACZ,UAAU,CAAE,MAAM,CAClB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,UAAU,CACtB,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,aAAa,CAAE,GAAG,AACpB,CAAC,AAED,KAAK,4BAAC,CAAC,AACL,KAAK,CAAE,IAAI,+BAA+B,CAAC,AAC7C,CAAC,AAED,OAAO,4BAAC,CAAC,AACP,KAAK,CAAE,IAAI,WAAW,CAAC,AAEzB,CAAC,AAED,mCAAO,MAAM,AAAC,CAAC,AACb,MAAM,CAAE,OAAO,CACf,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,YAAY,CAAC,AACrC,CAAC,AAED,SAAS,4BAAC,CAAC,AACT,gBAAgB,CAAE,IAAI,kBAAkB,CAAC,AAC3C,CAAC,AAED,YAAY,4BAAC,CAAC,AACZ,gBAAgB,CAAE,IAAI,qBAAqB,CAAC,AAC9C,CAAC,AAED,EAAE,4BAAC,CAAC,AACF,UAAU,CAAE,MAAM,AACpB,CAAC"}`
};
function isMiddleRange(date, start, end) {
  const val = date.isBefore(end, "day") && date.isAfter(start, "day");
  return val;
}
var Calendar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { highlightStartAt = void 0 } = $$props;
  let { highlightEndAt = void 0 } = $$props;
  let { onClickCell } = $$props;
  let { date = dayjs() } = $$props;
  let now = dayjs();
  let daysOfWeek = Array.from(Array(7).keys()).map((_, i) => {
    return date.day(i).format("ddd");
  });
  let thisMonth = date;
  let daysInThisMonth = thisMonth.daysInMonth();
  let beginningOfMonthOffset = date.startOf("month").day();
  function isPastRange(date2, start, end) {
    return date2.isBefore(now);
  }
  function isEndRange(date2, start, end) {
    return highlightStartAt && date2.isSame(start, "day") || highlightEndAt && date2.isSame(end, "day");
  }
  if ($$props.highlightStartAt === void 0 && $$bindings.highlightStartAt && highlightStartAt !== void 0)
    $$bindings.highlightStartAt(highlightStartAt);
  if ($$props.highlightEndAt === void 0 && $$bindings.highlightEndAt && highlightEndAt !== void 0)
    $$bindings.highlightEndAt(highlightEndAt);
  if ($$props.onClickCell === void 0 && $$bindings.onClickCell && onClickCell !== void 0)
    $$bindings.onClickCell(onClickCell);
  if ($$props.date === void 0 && $$bindings.date && date !== void 0)
    $$bindings.date(date);
  $$result.css.add(css$b);
  return `<div class="${"container svelte-gzu733"}"><h6 class="${"svelte-gzu733"}">${escape2(thisMonth.format("MMMM 'YY"))}</h6>
  <div class="${"header svelte-gzu733"}">${each(daysOfWeek, (day) => `<div class="${"svelte-gzu733"}">${escape2(day)}</div>`)}</div>
  <div class="${"body svelte-gzu733"}">${each(Array(beginningOfMonthOffset), (_, i) => `<div class="${"past svelte-gzu733"}"></div>`)}
    ${each(Array(daysInThisMonth), (_, i) => `<div class="${"\r\n          " + escape2(isPastRange(thisMonth.subtract(thisMonth.date() - (i + 1), "d")) ? "past" : "future") + "\r\n          " + escape2(isEndRange(thisMonth.subtract(thisMonth.date() - (i + 1), "d"), highlightStartAt, highlightEndAt) ? "rangeEnd" : "") + "\r\n          " + escape2(isMiddleRange(thisMonth.subtract(thisMonth.date() - (i + 1), "d"), highlightStartAt, highlightEndAt) ? "rangeMiddle" : "") + "\r\n         svelte-gzu733"}"><div class="${"svelte-gzu733"}">${escape2(thisMonth.subtract(thisMonth.date() - (i + 1), "d").format("D"))}</div>
      </div>`)}</div>
</div>`;
});
var css$a = {
  code: "div.svelte-x839gh.svelte-x839gh{display:flex}div.svelte-x839gh div.svelte-x839gh{box-shadow:1px 1px 3px var(--shadowColor)}",
  map: `{"version":3,"file":"DatePicker.svelte","sources":["DatePicker.svelte"],"sourcesContent":["<script lang=\\"ts\\">import Calendar from '$lib/components/Calendar.svelte';\\r\\nimport dayjs from 'dayjs/esm';\\r\\nimport { createEventDispatcher } from 'svelte';\\r\\nconst dispatch = createEventDispatcher();\\r\\nlet nextMonth = dayjs().add(1, 'month');\\r\\nlet selectedStartDate;\\r\\nlet selectedEndDate;\\r\\nfunction handleClickCell(date) {\\r\\n    if (((selectedStartDate || (!selectedStartDate && !selectedEndDate)) &&\\r\\n        date.isBefore(dayjs(), 'day')) ||\\r\\n        (selectedStartDate &&\\r\\n            selectedEndDate &&\\r\\n            selectedStartDate.isSame(date, 'day'))) {\\r\\n        selectedStartDate = null;\\r\\n        selectedEndDate = null;\\r\\n    }\\r\\n    else if (selectedStartDate == null) {\\r\\n        selectedStartDate = date;\\r\\n    }\\r\\n    else if (selectedStartDate.isAfter(date, 'day')) {\\r\\n        selectedStartDate = date;\\r\\n        selectedEndDate = null;\\r\\n    }\\r\\n    else {\\r\\n        selectedEndDate = date;\\r\\n    }\\r\\n    dispatch('change', {\\r\\n        startDate: selectedStartDate,\\r\\n        endDate: selectedEndDate,\\r\\n    });\\r\\n}\\r\\n<\/script>\\r\\n\\r\\n<div>\\r\\n  <div>\\r\\n    <Calendar\\r\\n      onClickCell={handleClickCell}\\r\\n      highlightStartAt={selectedStartDate}\\r\\n      highlightEndAt={selectedEndDate}\\r\\n    />\\r\\n    <Calendar\\r\\n      onClickCell={handleClickCell}\\r\\n      highlightStartAt={selectedStartDate}\\r\\n      highlightEndAt={selectedEndDate}\\r\\n      date={nextMonth}\\r\\n    />\\r\\n  </div>\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n  div {\\r\\n    display: flex;\\r\\n  }\\r\\n\\r\\n  div div {\\r\\n    box-shadow: 1px 1px 3px var(--shadowColor);\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAkDE,GAAG,4BAAC,CAAC,AACH,OAAO,CAAE,IAAI,AACf,CAAC,AAED,iBAAG,CAAC,GAAG,cAAC,CAAC,AACP,UAAU,CAAE,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,aAAa,CAAC,AAC5C,CAAC"}`
};
var DatePicker = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const dispatch = createEventDispatcher();
  let nextMonth = dayjs().add(1, "month");
  let selectedStartDate;
  let selectedEndDate;
  function handleClickCell(date) {
    if ((selectedStartDate || !selectedStartDate && !selectedEndDate) && date.isBefore(dayjs(), "day") || selectedStartDate && selectedEndDate && selectedStartDate.isSame(date, "day")) {
      selectedStartDate = null;
      selectedEndDate = null;
    } else if (selectedStartDate == null) {
      selectedStartDate = date;
    } else if (selectedStartDate.isAfter(date, "day")) {
      selectedStartDate = date;
      selectedEndDate = null;
    } else {
      selectedEndDate = date;
    }
    dispatch("change", {
      startDate: selectedStartDate,
      endDate: selectedEndDate
    });
  }
  $$result.css.add(css$a);
  return `<div class="${"svelte-x839gh"}"><div class="${"svelte-x839gh"}">${validate_component(Calendar, "Calendar").$$render($$result, {
    onClickCell: handleClickCell,
    highlightStartAt: selectedStartDate,
    highlightEndAt: selectedEndDate
  }, {}, {})}
    ${validate_component(Calendar, "Calendar").$$render($$result, {
    onClickCell: handleClickCell,
    highlightStartAt: selectedStartDate,
    highlightEndAt: selectedEndDate,
    date: nextMonth
  }, {}, {})}</div>
</div>`;
});
var css$9 = {
  code: "button.svelte-1qkg03k{padding:0.5rem 1rem;font-size:1rem;font-family:var(--fontFamilySansSerif);background-color:var(--btnPrimary);color:var(--btnPrimayFont);border:none}button.svelte-1qkg03k:hover{cursor:pointer;background-color:var(--btnPrimaryHover)}",
  map: '{"version":3,"file":"Button.svelte","sources":["Button.svelte"],"sourcesContent":["<script lang=\\"ts\\">export let click;\\r\\nexport let disabled = false;\\r\\n<\/script>\\r\\n\\r\\n<button type=\\"button\\" on:click|stopPropagation={click} {disabled}>\\r\\n  <slot />\\r\\n</button>\\r\\n\\r\\n<style>\\r\\n  button {\\r\\n    padding: 0.5rem 1rem;\\r\\n    font-size: 1rem;\\r\\n    font-family: var(--fontFamilySansSerif);\\r\\n    background-color: var(--btnPrimary);\\r\\n    color: var(--btnPrimayFont);\\r\\n    border: none;\\r\\n  }\\r\\n\\r\\n  button:hover {\\r\\n    cursor: pointer;\\r\\n    background-color: var(--btnPrimaryHover);\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AASE,MAAM,eAAC,CAAC,AACN,OAAO,CAAE,MAAM,CAAC,IAAI,CACpB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,IAAI,qBAAqB,CAAC,CACvC,gBAAgB,CAAE,IAAI,YAAY,CAAC,CACnC,KAAK,CAAE,IAAI,eAAe,CAAC,CAC3B,MAAM,CAAE,IAAI,AACd,CAAC,AAED,qBAAM,MAAM,AAAC,CAAC,AACZ,MAAM,CAAE,OAAO,CACf,gBAAgB,CAAE,IAAI,iBAAiB,CAAC,AAC1C,CAAC"}'
};
var Button = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { click } = $$props;
  let { disabled = false } = $$props;
  if ($$props.click === void 0 && $$bindings.click && click !== void 0)
    $$bindings.click(click);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0)
    $$bindings.disabled(disabled);
  $$result.css.add(css$9);
  return `<button type="${"button"}" ${disabled ? "disabled" : ""} class="${"svelte-1qkg03k"}">${slots.default ? slots.default({}) : ``}
</button>`;
});
var css$8 = {
  code: "label.svelte-qt3m8t{font-weight:bold;margin-right:1rem;font-size:1.4rem}",
  map: `{"version":3,"file":"Label.svelte","sources":["Label.svelte"],"sourcesContent":["<script lang=\\"ts\\">export let forName = '';\\r\\n<\/script>\\r\\n\\r\\n<label for={forName}><slot /></label>\\r\\n\\r\\n<style>\\r\\n  label {\\r\\n    font-weight: bold;\\r\\n    margin-right: 1rem;\\r\\n    font-size: 1.4rem;\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAME,KAAK,cAAC,CAAC,AACL,WAAW,CAAE,IAAI,CACjB,YAAY,CAAE,IAAI,CAClB,SAAS,CAAE,MAAM,AACnB,CAAC"}`
};
var Label = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { forName = "" } = $$props;
  if ($$props.forName === void 0 && $$bindings.forName && forName !== void 0)
    $$bindings.forName(forName);
  $$result.css.add(css$8);
  return `<label${add_attribute("for", forName, 0)} class="${"svelte-qt3m8t"}">${slots.default ? slots.default({}) : ``}</label>`;
});
var css$7 = {
  code: "input.svelte-1vm58z5{border:none;padding:10px}",
  map: `{"version":3,"file":"InputText.svelte","sources":["InputText.svelte"],"sourcesContent":["<script lang=\\"ts\\">import Label from '$lib/components/Label.svelte';\\r\\nexport let name;\\r\\nexport let label = name;\\r\\nexport let value;\\r\\nexport let disabled = false;\\r\\nexport let placeholder = '';\\r\\n<\/script>\\r\\n\\r\\n<Label forName={name}>{label}</Label>\\r\\n<input type=\\"text\\" {name} bind:value {disabled} {placeholder} />\\r\\n\\r\\n<style>\\r\\n  input {\\r\\n    border: none;\\r\\n    padding: 10px;\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAYE,KAAK,eAAC,CAAC,AACL,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,IAAI,AACf,CAAC"}`
};
var InputText = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { name } = $$props;
  let { label = name } = $$props;
  let { value } = $$props;
  let { disabled = false } = $$props;
  let { placeholder = "" } = $$props;
  if ($$props.name === void 0 && $$bindings.name && name !== void 0)
    $$bindings.name(name);
  if ($$props.label === void 0 && $$bindings.label && label !== void 0)
    $$bindings.label(label);
  if ($$props.value === void 0 && $$bindings.value && value !== void 0)
    $$bindings.value(value);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0)
    $$bindings.disabled(disabled);
  if ($$props.placeholder === void 0 && $$bindings.placeholder && placeholder !== void 0)
    $$bindings.placeholder(placeholder);
  $$result.css.add(css$7);
  return `${validate_component(Label, "Label").$$render($$result, { forName: name }, {}, { default: () => `${escape2(label)}` })}
<input type="${"text"}"${add_attribute("name", name, 0)} ${disabled ? "disabled" : ""}${add_attribute("placeholder", placeholder, 0)} class="${"svelte-1vm58z5"}"${add_attribute("value", value, 1)}>`;
});
var css$6 = {
  code: "legend.svelte-9awmpv.svelte-9awmpv{font-weight:bold;float:left;font-size:1.4rem}input[type='checkbox'].svelte-9awmpv.svelte-9awmpv{appearance:none}label.svelte-9awmpv.svelte-9awmpv{font-weight:bold;padding:5px 12px;background-color:var(--bgCardColor);box-shadow:1px 1px 2px var(--shadowColor);border-radius:20px}input.svelte-9awmpv.svelte-9awmpv:hover,label.svelte-9awmpv.svelte-9awmpv:hover{cursor:pointer}input.svelte-9awmpv:checked+label.svelte-9awmpv{background-color:var(--selectedChipColor);color:var(--selectedChipFontColor)}",
  map: `{"version":3,"file":"InputChips.svelte","sources":["InputChips.svelte"],"sourcesContent":["<script lang=\\"ts\\">export let name;\\r\\nexport let group = []; // { id: string | number; name: string }[];\\r\\nexport let options;\\r\\nexport let disabled = false;\\r\\nexport let label = '';\\r\\n<\/script>\\r\\n\\r\\n<legend>{label}</legend>\\r\\n{#each options as item}\\r\\n  <input\\r\\n    type=\\"checkbox\\"\\r\\n    bind:group\\r\\n    {name}\\r\\n    value={JSON.stringify(item)}\\r\\n    id={item.id.toString()}\\r\\n    {disabled}\\r\\n  />\\r\\n  <label for={item.id.toString()}>{item.name}</label>\\r\\n{/each}\\r\\n\\r\\n<style>\\r\\n  legend {\\r\\n    font-weight: bold;\\r\\n    float: left;\\r\\n    font-size: 1.4rem;\\r\\n  }\\r\\n\\r\\n  input[type='checkbox'] {\\r\\n    appearance: none;\\r\\n  }\\r\\n\\r\\n  label {\\r\\n    font-weight: bold;\\r\\n    padding: 5px 12px;\\r\\n    background-color: var(--bgCardColor);\\r\\n    box-shadow: 1px 1px 2px var(--shadowColor);\\r\\n    border-radius: 20px;\\r\\n  }\\r\\n\\r\\n  input:hover,\\r\\n  label:hover {\\r\\n    cursor: pointer;\\r\\n  }\\r\\n\\r\\n  input:checked + label {\\r\\n    background-color: var(--selectedChipColor);\\r\\n    color: var(--selectedChipFontColor);\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAqBE,MAAM,4BAAC,CAAC,AACN,WAAW,CAAE,IAAI,CACjB,KAAK,CAAE,IAAI,CACX,SAAS,CAAE,MAAM,AACnB,CAAC,AAED,KAAK,CAAC,IAAI,CAAC,UAAU,CAAC,4BAAC,CAAC,AACtB,UAAU,CAAE,IAAI,AAClB,CAAC,AAED,KAAK,4BAAC,CAAC,AACL,WAAW,CAAE,IAAI,CACjB,OAAO,CAAE,GAAG,CAAC,IAAI,CACjB,gBAAgB,CAAE,IAAI,aAAa,CAAC,CACpC,UAAU,CAAE,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,aAAa,CAAC,CAC1C,aAAa,CAAE,IAAI,AACrB,CAAC,AAED,iCAAK,MAAM,CACX,iCAAK,MAAM,AAAC,CAAC,AACX,MAAM,CAAE,OAAO,AACjB,CAAC,AAED,mBAAK,QAAQ,CAAG,KAAK,cAAC,CAAC,AACrB,gBAAgB,CAAE,IAAI,mBAAmB,CAAC,CAC1C,KAAK,CAAE,IAAI,uBAAuB,CAAC,AACrC,CAAC"}`
};
var InputChips = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { name } = $$props;
  let { group = [] } = $$props;
  let { options: options2 } = $$props;
  let { disabled = false } = $$props;
  let { label = "" } = $$props;
  if ($$props.name === void 0 && $$bindings.name && name !== void 0)
    $$bindings.name(name);
  if ($$props.group === void 0 && $$bindings.group && group !== void 0)
    $$bindings.group(group);
  if ($$props.options === void 0 && $$bindings.options && options2 !== void 0)
    $$bindings.options(options2);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0)
    $$bindings.disabled(disabled);
  if ($$props.label === void 0 && $$bindings.label && label !== void 0)
    $$bindings.label(label);
  $$result.css.add(css$6);
  return `<legend class="${"svelte-9awmpv"}">${escape2(label)}</legend>
${each(options2, (item) => `<input type="${"checkbox"}"${add_attribute("name", name, 0)}${add_attribute("value", JSON.stringify(item), 0)}${add_attribute("id", item.id.toString(), 0)} ${disabled ? "disabled" : ""} class="${"svelte-9awmpv"}">
  <label${add_attribute("for", item.id.toString(), 0)} class="${"svelte-9awmpv"}">${escape2(item.name)}</label>`)}`;
});
var css$5 = {
  code: "select.svelte-y2snvb{border:none;padding:10px}select.svelte-y2snvb:hover{cursor:pointer}",
  map: `{"version":3,"file":"InputDropdown.svelte","sources":["InputDropdown.svelte"],"sourcesContent":["<script lang=\\"ts\\">export let name = '';\\r\\nexport let options;\\r\\nexport let value;\\r\\nexport let disabled = false;\\r\\n<\/script>\\r\\n\\r\\n<select {disabled} {name} bind:value>\\r\\n  {#each options as option}\\r\\n    {#if typeof option === 'string'}\\r\\n      <option value={option}>{option}</option>\\r\\n    {:else}\\r\\n      <option value={option.id}>{option.name}</option>\\r\\n    {/if}\\r\\n  {/each}\\r\\n</select>\\r\\n\\r\\n<style>\\r\\n  select {\\r\\n    border: none;\\r\\n    padding: 10px;\\r\\n  }\\r\\n\\r\\n  select:hover {\\r\\n    cursor: pointer;\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAiBE,MAAM,cAAC,CAAC,AACN,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,IAAI,AACf,CAAC,AAED,oBAAM,MAAM,AAAC,CAAC,AACZ,MAAM,CAAE,OAAO,AACjB,CAAC"}`
};
var InputDropdown = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { name = "" } = $$props;
  let { options: options2 } = $$props;
  let { value } = $$props;
  let { disabled = false } = $$props;
  if ($$props.name === void 0 && $$bindings.name && name !== void 0)
    $$bindings.name(name);
  if ($$props.options === void 0 && $$bindings.options && options2 !== void 0)
    $$bindings.options(options2);
  if ($$props.value === void 0 && $$bindings.value && value !== void 0)
    $$bindings.value(value);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0)
    $$bindings.disabled(disabled);
  $$result.css.add(css$5);
  return `<select ${disabled ? "disabled" : ""}${add_attribute("name", name, 0)} class="${"svelte-y2snvb"}"${add_attribute("value", value, 1)}>${each(options2, (option) => `${typeof option === "string" ? `<option${add_attribute("value", option, 0)}>${escape2(option)}</option>` : `<option${add_attribute("value", option.id, 0)}>${escape2(option.name)}</option>`}`)}</select>`;
});
var css$4 = {
  code: "select.svelte-1r373c0{border:none;padding:10px;font-size:1rem}select.svelte-1r373c0:hover{cursor:pointer}",
  map: `{"version":3,"file":"InputTime.svelte","sources":["InputTime.svelte"],"sourcesContent":["<script lang=\\"ts\\">export let hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];\\r\\nexport let minutes = [0, 15, 30, 45];\\r\\nexport let ampms = ['am', 'pm'];\\r\\nexport let hour;\\r\\nexport let minute;\\r\\nexport let ampm;\\r\\n<\/script>\\r\\n\\r\\n<select name=\\"hour\\" bind:value={hour}>\\r\\n  {#each hours as _hour}\\r\\n    <option value={_hour}>{_hour}</option>\\r\\n  {/each}\\r\\n</select>\\r\\n\\r\\n<select name=\\"minute\\" bind:value={minute}>\\r\\n  {#each minutes as _minute}\\r\\n    <option value={_minute}>{_minute.toString().padStart(2, '0')}</option>\\r\\n  {/each}\\r\\n</select>\\r\\n\\r\\n<select name=\\"ampm\\" bind:value={ampm}>\\r\\n  {#each ampms as _ampm}\\r\\n    <option value={_ampm}>{_ampm.toUpperCase()}</option>\\r\\n  {/each}\\r\\n</select>\\r\\n\\r\\n<style>\\r\\n  select {\\r\\n    border: none;\\r\\n    padding: 10px;\\r\\n    font-size: 1rem;\\r\\n  }\\r\\n\\r\\n  select:hover {\\r\\n    cursor: pointer;\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AA2BE,MAAM,eAAC,CAAC,AACN,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,IAAI,CACb,SAAS,CAAE,IAAI,AACjB,CAAC,AAED,qBAAM,MAAM,AAAC,CAAC,AACZ,MAAM,CAAE,OAAO,AACjB,CAAC"}`
};
var InputTime = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] } = $$props;
  let { minutes = [0, 15, 30, 45] } = $$props;
  let { ampms = ["am", "pm"] } = $$props;
  let { hour } = $$props;
  let { minute } = $$props;
  let { ampm } = $$props;
  if ($$props.hours === void 0 && $$bindings.hours && hours !== void 0)
    $$bindings.hours(hours);
  if ($$props.minutes === void 0 && $$bindings.minutes && minutes !== void 0)
    $$bindings.minutes(minutes);
  if ($$props.ampms === void 0 && $$bindings.ampms && ampms !== void 0)
    $$bindings.ampms(ampms);
  if ($$props.hour === void 0 && $$bindings.hour && hour !== void 0)
    $$bindings.hour(hour);
  if ($$props.minute === void 0 && $$bindings.minute && minute !== void 0)
    $$bindings.minute(minute);
  if ($$props.ampm === void 0 && $$bindings.ampm && ampm !== void 0)
    $$bindings.ampm(ampm);
  $$result.css.add(css$4);
  return `<select name="${"hour"}" class="${"svelte-1r373c0"}"${add_attribute("value", hour, 1)}>${each(hours, (_hour) => `<option${add_attribute("value", _hour, 0)}>${escape2(_hour)}</option>`)}</select>

<select name="${"minute"}" class="${"svelte-1r373c0"}"${add_attribute("value", minute, 1)}>${each(minutes, (_minute) => `<option${add_attribute("value", _minute, 0)}>${escape2(_minute.toString().padStart(2, "0"))}</option>`)}</select>

<select name="${"ampm"}" class="${"svelte-1r373c0"}"${add_attribute("value", ampm, 1)}>${each(ampms, (_ampm) => `<option${add_attribute("value", _ampm, 0)}>${escape2(_ampm.toUpperCase())}</option>`)}</select>`;
});
var css$3 = {
  code: "fieldset.svelte-1v6z70d.svelte-1v6z70d{margin-bottom:2rem}.summary.svelte-1v6z70d.svelte-1v6z70d{font-size:1.4rem;max-width:400px;font-weight:bold}.summary.svelte-1v6z70d span.svelte-1v6z70d{padding-left:5px;padding-right:5px;font-weight:normal;font-family:var(--fontFamilyDisplay)}.summary.svelte-1v6z70d span.quaternary.svelte-1v6z70d{background-color:var(--textHighlightQuaternary)}.summary.svelte-1v6z70d span.secondary.svelte-1v6z70d{background-color:var(--textHighlightSecondary)}.summary.svelte-1v6z70d span.tertiary.svelte-1v6z70d{background-color:var(--textHighlightTertiary)}.error.svelte-1v6z70d.svelte-1v6z70d{color:var(--errorColor)}",
  map: `{"version":3,"file":"createBooking.svelte","sources":["createBooking.svelte"],"sourcesContent":["<script lang=\\"ts\\" context=\\"module\\">var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\\r\\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\\r\\n    return new (P || (P = Promise))(function (resolve, reject) {\\r\\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\\r\\n        function rejected(value) { try { step(generator[\\"throw\\"](value)); } catch (e) { reject(e); } }\\r\\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\\r\\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\\r\\n    });\\r\\n};\\r\\n;\\r\\nimport { get, post } from '$lib/api';\\r\\n;\\r\\nexport function load({ page, session, }) {\\r\\n    var _a, _b;\\r\\n    return __awaiter(this, void 0, void 0, function* () {\\r\\n        let orgId = parseInt((_a = page.query.get('org_id')) !== null && _a !== void 0 ? _a : '0');\\r\\n        let locId = parseInt((_b = page.query.get('loc_id')) !== null && _b !== void 0 ? _b : '0');\\r\\n        try {\\r\\n            const res = yield get({\\r\\n                path: \`api/v1/organizations/\${orgId}\`,\\r\\n                token: session.token,\\r\\n            });\\r\\n            const org = res.data;\\r\\n            const selectedLocation = org.location.find((l) => l.id === locId);\\r\\n            return {\\r\\n                props: {\\r\\n                    org,\\r\\n                    selectedLocation,\\r\\n                    selectedLocationId: selectedLocation.id,\\r\\n                    allLocations: org.location,\\r\\n                },\\r\\n            };\\r\\n        }\\r\\n        catch (err) {\\r\\n            console.log(err);\\r\\n            return {};\\r\\n        }\\r\\n    });\\r\\n}\\r\\n<\/script>\\r\\n\\r\\n<script lang=\\"ts\\">var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\\r\\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\\r\\n    return new (P || (P = Promise))(function (resolve, reject) {\\r\\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\\r\\n        function rejected(value) { try { step(generator[\\"throw\\"](value)); } catch (e) { reject(e); } }\\r\\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\\r\\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\\r\\n    });\\r\\n};\\r\\nvar _a;\\r\\n;\\r\\nimport { session } from '$app/stores';\\r\\nimport DatePicker from '$lib/components/DatePicker.svelte';\\r\\nimport Button from '$lib/components/Button.svelte';\\r\\nimport Input from '$lib/components/InputText.svelte';\\r\\nimport InputChips from '$lib/components/InputChips.svelte';\\r\\nimport Label from '$lib/components/Label.svelte';\\r\\nimport InputDropdown from '$lib/components/InputDropdown.svelte';\\r\\nimport InputTime from '$lib/components/InputTime.svelte';\\r\\nexport let org;\\r\\nexport let selectedLocation;\\r\\nlet selectedLocationId;\\r\\nexport let allLocations;\\r\\nlet errorMessage = '';\\r\\nlet disabled = false;\\r\\nlet success;\\r\\nlet pets = $session.user.pet;\\r\\nlet petId = (_a = pets === null || pets === void 0 ? void 0 : pets[0].id) !== null && _a !== void 0 ? _a : '';\\r\\nlet dropOffDate;\\r\\nlet dropOffHour;\\r\\nlet dropOffMinute;\\r\\nlet dropOffAmpm;\\r\\nlet pickUpDate;\\r\\nlet pickUpHour;\\r\\nlet pickUpMinute;\\r\\nlet pickUpAmpm;\\r\\nlet selectedPetsString = [];\\r\\nfunction joinNames(names) {\\r\\n    if (names.length === 0) {\\r\\n        return '';\\r\\n    }\\r\\n    if (names.length === 1) {\\r\\n        return names[0];\\r\\n    }\\r\\n    if (names.length === 2) {\\r\\n        return \`\${names[0]} and \${names[1]}\`;\\r\\n    }\\r\\n    if (names.length > 2) {\\r\\n        return \`\${names.slice(0, -1).join(', ')}, and \${names[names.length - 1]}\`;\\r\\n    }\\r\\n}\\r\\n$: selectedPets = selectedPetsString.map((p) => JSON.parse(p));\\r\\n$: petNames = selectedPets.map((p) => p.name);\\r\\n$: petSummary = joinNames(petNames);\\r\\n$: dropOffDateSummary = dropOffDate ? dropOffDate.format('ddd, MMM D') : '';\\r\\n$: pickUpDateSummary = pickUpDate ? pickUpDate.format('ddd, MMM D') : '';\\r\\n$: selectedLocation = allLocations.find((x) => x.id === selectedLocationId);\\r\\n$: locationSummary = selectedLocation;\\r\\nfunction handleDateChange(event) {\\r\\n    var _a, _b;\\r\\n    dropOffDate = (_a = event.detail.startDate) === null || _a === void 0 ? void 0 : _a.startOf('day');\\r\\n    pickUpDate = (_b = event.detail.endDate) === null || _b === void 0 ? void 0 : _b.startOf('day');\\r\\n}\\r\\nconst handleSubmit = () => __awaiter(void 0, void 0, void 0, function* () {\\r\\n    let dropOffAtISO;\\r\\n    let pickUpAtISO;\\r\\n    try {\\r\\n        let dropOffDatetime = dropOffDate\\r\\n            .hour(dropOffHour + (dropOffAmpm.toUpperCase() === 'PM' ? 12 : 0))\\r\\n            .minute(dropOffMinute)\\r\\n            .second(0);\\r\\n        let pickUpDatetime = pickUpDate\\r\\n            .hour(pickUpHour + (pickUpAmpm.toUpperCase() === 'PM' ? 12 : 0))\\r\\n            .minute(pickUpMinute)\\r\\n            .second(0);\\r\\n        //TODO timezone? this seems to adjust know what utc offset to use.\\r\\n        dropOffAtISO = dropOffDatetime.toISOString();\\r\\n        pickUpAtISO = pickUpDatetime.toISOString();\\r\\n        console.log(dropOffAtISO, pickUpAtISO);\\r\\n    }\\r\\n    catch (err) {\\r\\n        errorMessage = 'Invalid pick up/drop off dates \u231A';\\r\\n        console.error(err);\\r\\n        return;\\r\\n    }\\r\\n    let bookingDetails;\\r\\n    try {\\r\\n        bookingDetails = selectedPets.map((p) => {\\r\\n            return {\\r\\n                petId: p.id,\\r\\n            };\\r\\n        });\\r\\n    }\\r\\n    catch (err) {\\r\\n        errorMessage = 'Error gathering pet details \u{1F63F}.';\\r\\n        console.log(err);\\r\\n        return;\\r\\n    }\\r\\n    try {\\r\\n        disabled = true;\\r\\n        errorMessage = '';\\r\\n        let data = {\\r\\n            orgId: org.id,\\r\\n            locId: selectedLocation.id,\\r\\n            pickUpAt: pickUpAtISO,\\r\\n            dropOffAt: dropOffAtISO,\\r\\n            bookingDetails,\\r\\n        };\\r\\n        const booking = yield post({\\r\\n            path: 'api/v1/bookings',\\r\\n            data,\\r\\n            token: $session.token,\\r\\n        });\\r\\n        //await goto('/app');\\r\\n    }\\r\\n    catch (err) {\\r\\n        errorMessage = 'Failed to create organization. Try again later.';\\r\\n        console.log(err);\\r\\n    }\\r\\n    finally {\\r\\n        disabled = false;\\r\\n    }\\r\\n});\\r\\n<\/script>\\r\\n\\r\\n<h1>Create Booking</h1>\\r\\n<form>\\r\\n  {#if errorMessage}\\r\\n    <p class=\\"error\\">{errorMessage}</p>\\r\\n  {/if}\\r\\n  <fieldset>\\r\\n    <Input disabled value={org.name} name=\\"where\\" label=\\"Where?\\" />\\r\\n    <InputDropdown\\r\\n      {disabled}\\r\\n      bind:value={selectedLocationId}\\r\\n      options={allLocations}\\r\\n      name=\\"location\\"\\r\\n    />\\r\\n    <!-- TODO add map here of the location -->\\r\\n  </fieldset>\\r\\n  <fieldset>\\r\\n    <InputChips\\r\\n      bind:group={selectedPetsString}\\r\\n      options={pets}\\r\\n      name=\\"pets\\"\\r\\n      label=\\"Who?\\"\\r\\n      {disabled}\\r\\n    />\\r\\n  </fieldset>\\r\\n  <fieldset>\\r\\n    <Label>When?</Label>\\r\\n    <DatePicker on:change={handleDateChange} />\\r\\n  </fieldset>\\r\\n\\r\\n  <p class=\\"summary\\">\\r\\n    {#if petSummary}\\r\\n      <span class=\\"tertiary\\">{petSummary}</span>\\r\\n    {/if}\\r\\n  </p>\\r\\n  <p class=\\"summary\\">\\r\\n    {locationSummary && !petSummary && dropOffDateSummary ? '...' : ''}\\r\\n    {#if locationSummary && (petSummary || dropOffDateSummary)}\\r\\n      will be staying at <span class=\\"quaternary\\">{locationSummary.name}</span>\\r\\n    {/if}\\r\\n  </p>\\r\\n  <p class=\\"summary\\">\\r\\n    {#if dropOffDateSummary}\\r\\n      from <span class=\\"secondary\\">{dropOffDateSummary}</span>\\r\\n      <InputTime\\r\\n        bind:hour={dropOffHour}\\r\\n        bind:minute={dropOffMinute}\\r\\n        bind:ampm={dropOffAmpm}\\r\\n      />\\r\\n    {/if}\\r\\n    {petSummary && dropOffDateSummary && !pickUpDateSummary ? '...' : ''}\\r\\n  </p>\\r\\n  <p class=\\"summary\\">\\r\\n    {#if pickUpDateSummary}\\r\\n      to <span class=\\"secondary\\">{pickUpDateSummary}</span>\\r\\n      <InputTime\\r\\n        bind:hour={pickUpHour}\\r\\n        bind:minute={pickUpMinute}\\r\\n        bind:ampm={pickUpAmpm}\\r\\n      />\\r\\n    {/if}\\r\\n  </p>\\r\\n\\r\\n  <Button click={handleSubmit} {disabled}>{success ? '\u{1F680}' : 'Submit'}</Button>\\r\\n</form>\\r\\n\\r\\n<style>\\r\\n  fieldset {\\r\\n    margin-bottom: 2rem;\\r\\n  }\\r\\n\\r\\n  .summary {\\r\\n    font-size: 1.4rem;\\r\\n    max-width: 400px;\\r\\n    font-weight: bold;\\r\\n  }\\r\\n\\r\\n  .summary span {\\r\\n    padding-left: 5px;\\r\\n    padding-right: 5px;\\r\\n    font-weight: normal;\\r\\n    font-family: var(--fontFamilyDisplay);\\r\\n  }\\r\\n\\r\\n  .summary span.quaternary {\\r\\n    background-color: var(--textHighlightQuaternary);\\r\\n  }\\r\\n\\r\\n  .summary span.secondary {\\r\\n    background-color: var(--textHighlightSecondary);\\r\\n  }\\r\\n\\r\\n  .summary span.tertiary {\\r\\n    background-color: var(--textHighlightTertiary);\\r\\n  }\\r\\n\\r\\n  .error {\\r\\n    color: var(--errorColor);\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAwOE,QAAQ,8BAAC,CAAC,AACR,aAAa,CAAE,IAAI,AACrB,CAAC,AAED,QAAQ,8BAAC,CAAC,AACR,SAAS,CAAE,MAAM,CACjB,SAAS,CAAE,KAAK,CAChB,WAAW,CAAE,IAAI,AACnB,CAAC,AAED,uBAAQ,CAAC,IAAI,eAAC,CAAC,AACb,YAAY,CAAE,GAAG,CACjB,aAAa,CAAE,GAAG,CAClB,WAAW,CAAE,MAAM,CACnB,WAAW,CAAE,IAAI,mBAAmB,CAAC,AACvC,CAAC,AAED,uBAAQ,CAAC,IAAI,WAAW,eAAC,CAAC,AACxB,gBAAgB,CAAE,IAAI,yBAAyB,CAAC,AAClD,CAAC,AAED,uBAAQ,CAAC,IAAI,UAAU,eAAC,CAAC,AACvB,gBAAgB,CAAE,IAAI,wBAAwB,CAAC,AACjD,CAAC,AAED,uBAAQ,CAAC,IAAI,SAAS,eAAC,CAAC,AACtB,gBAAgB,CAAE,IAAI,uBAAuB,CAAC,AAChD,CAAC,AAED,MAAM,8BAAC,CAAC,AACN,KAAK,CAAE,IAAI,YAAY,CAAC,AAC1B,CAAC"}`
};
var __awaiter$4 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
function load$6({ page: page2, session: session2 }) {
  var _a, _b;
  return __awaiter$4(this, void 0, void 0, function* () {
    let orgId = parseInt((_a = page2.query.get("org_id")) !== null && _a !== void 0 ? _a : "0");
    let locId = parseInt((_b = page2.query.get("loc_id")) !== null && _b !== void 0 ? _b : "0");
    try {
      const res = yield get({
        path: `api/v1/organizations/${orgId}`,
        token: session2.token
      });
      const org = res.data;
      const selectedLocation = org.location.find((l) => l.id === locId);
      return {
        props: {
          org,
          selectedLocation,
          selectedLocationId: selectedLocation.id,
          allLocations: org.location
        }
      };
    } catch (err) {
      console.log(err);
      return {};
    }
  });
}
function joinNames(names) {
  if (names.length === 0) {
    return "";
  }
  if (names.length === 1) {
    return names[0];
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }
  if (names.length > 2) {
    return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
  }
}
var CreateBooking = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let selectedPets;
  let petNames;
  let petSummary;
  let dropOffDateSummary;
  let pickUpDateSummary;
  let locationSummary;
  let $session, $$unsubscribe_session;
  $$unsubscribe_session = subscribe(session, (value) => $session = value);
  var __awaiter2 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve2) {
        resolve2(value);
      });
    }
    return new (P || (P = Promise))(function(resolve2, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var _a;
  let { org } = $$props;
  let { selectedLocation } = $$props;
  let selectedLocationId;
  let { allLocations } = $$props;
  let errorMessage = "";
  let disabled = false;
  let pets = $session.user.pet;
  (_a = pets === null || pets === void 0 ? void 0 : pets[0].id) !== null && _a !== void 0 ? _a : "";
  let dropOffDate;
  let dropOffHour;
  let dropOffMinute;
  let dropOffAmpm;
  let pickUpDate;
  let pickUpHour;
  let pickUpMinute;
  let pickUpAmpm;
  let selectedPetsString = [];
  const handleSubmit = () => __awaiter2(void 0, void 0, void 0, function* () {
    let dropOffAtISO;
    let pickUpAtISO;
    try {
      let dropOffDatetime = dropOffDate.hour(dropOffHour + (dropOffAmpm.toUpperCase() === "PM" ? 12 : 0)).minute(dropOffMinute).second(0);
      let pickUpDatetime = pickUpDate.hour(pickUpHour + (pickUpAmpm.toUpperCase() === "PM" ? 12 : 0)).minute(pickUpMinute).second(0);
      dropOffAtISO = dropOffDatetime.toISOString();
      pickUpAtISO = pickUpDatetime.toISOString();
      console.log(dropOffAtISO, pickUpAtISO);
    } catch (err) {
      errorMessage = "Invalid pick up/drop off dates \u231A";
      console.error(err);
      return;
    }
    let bookingDetails;
    try {
      bookingDetails = selectedPets.map((p) => {
        return { petId: p.id };
      });
    } catch (err) {
      errorMessage = "Error gathering pet details \u{1F63F}.";
      console.log(err);
      return;
    }
    try {
      disabled = true;
      errorMessage = "";
      let data = {
        orgId: org.id,
        locId: selectedLocation.id,
        pickUpAt: pickUpAtISO,
        dropOffAt: dropOffAtISO,
        bookingDetails
      };
      const booking = yield post$1({
        path: "api/v1/bookings",
        data,
        token: $session.token
      });
    } catch (err) {
      errorMessage = "Failed to create organization. Try again later.";
      console.log(err);
    } finally {
      disabled = false;
    }
  });
  if ($$props.org === void 0 && $$bindings.org && org !== void 0)
    $$bindings.org(org);
  if ($$props.selectedLocation === void 0 && $$bindings.selectedLocation && selectedLocation !== void 0)
    $$bindings.selectedLocation(selectedLocation);
  if ($$props.allLocations === void 0 && $$bindings.allLocations && allLocations !== void 0)
    $$bindings.allLocations(allLocations);
  $$result.css.add(css$3);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    selectedPets = selectedPetsString.map((p) => JSON.parse(p));
    petNames = selectedPets.map((p) => p.name);
    petSummary = joinNames(petNames);
    dropOffDateSummary = "";
    pickUpDateSummary = "";
    selectedLocation = allLocations.find((x) => x.id === selectedLocationId);
    locationSummary = selectedLocation;
    $$rendered = `<h1>Create Booking</h1>
<form>${errorMessage ? `<p class="${"error svelte-1v6z70d"}">${escape2(errorMessage)}</p>` : ``}
  <fieldset class="${"svelte-1v6z70d"}">${validate_component(InputText, "Input").$$render($$result, {
      disabled: true,
      value: org.name,
      name: "where",
      label: "Where?"
    }, {}, {})}
    ${validate_component(InputDropdown, "InputDropdown").$$render($$result, {
      disabled,
      options: allLocations,
      name: "location",
      value: selectedLocationId
    }, {
      value: ($$value) => {
        selectedLocationId = $$value;
        $$settled = false;
      }
    }, {})}
    </fieldset>
  <fieldset class="${"svelte-1v6z70d"}">${validate_component(InputChips, "InputChips").$$render($$result, {
      options: pets,
      name: "pets",
      label: "Who?",
      disabled,
      group: selectedPetsString
    }, {
      group: ($$value) => {
        selectedPetsString = $$value;
        $$settled = false;
      }
    }, {})}</fieldset>
  <fieldset class="${"svelte-1v6z70d"}">${validate_component(Label, "Label").$$render($$result, {}, {}, { default: () => `When?` })}
    ${validate_component(DatePicker, "DatePicker").$$render($$result, {}, {}, {})}</fieldset>

  <p class="${"summary svelte-1v6z70d"}">${petSummary ? `<span class="${"tertiary svelte-1v6z70d"}">${escape2(petSummary)}</span>` : ``}</p>
  <p class="${"summary svelte-1v6z70d"}">${escape2(locationSummary && !petSummary && dropOffDateSummary ? "..." : "")}
    ${locationSummary && (petSummary || dropOffDateSummary) ? `will be staying at <span class="${"quaternary svelte-1v6z70d"}">${escape2(locationSummary.name)}</span>` : ``}</p>
  <p class="${"summary svelte-1v6z70d"}">${dropOffDateSummary ? `from <span class="${"secondary svelte-1v6z70d"}">${escape2(dropOffDateSummary)}</span>
      ${validate_component(InputTime, "InputTime").$$render($$result, {
      hour: dropOffHour,
      minute: dropOffMinute,
      ampm: dropOffAmpm
    }, {
      hour: ($$value) => {
        dropOffHour = $$value;
        $$settled = false;
      },
      minute: ($$value) => {
        dropOffMinute = $$value;
        $$settled = false;
      },
      ampm: ($$value) => {
        dropOffAmpm = $$value;
        $$settled = false;
      }
    }, {})}` : ``}
    ${escape2(petSummary && dropOffDateSummary && !pickUpDateSummary ? "..." : "")}</p>
  <p class="${"summary svelte-1v6z70d"}">${pickUpDateSummary ? `to <span class="${"secondary svelte-1v6z70d"}">${escape2(pickUpDateSummary)}</span>
      ${validate_component(InputTime, "InputTime").$$render($$result, {
      hour: pickUpHour,
      minute: pickUpMinute,
      ampm: pickUpAmpm
    }, {
      hour: ($$value) => {
        pickUpHour = $$value;
        $$settled = false;
      },
      minute: ($$value) => {
        pickUpMinute = $$value;
        $$settled = false;
      },
      ampm: ($$value) => {
        pickUpAmpm = $$value;
        $$settled = false;
      }
    }, {})}` : ``}</p>

  ${validate_component(Button, "Button").$$render($$result, { click: handleSubmit, disabled }, {}, {
      default: () => `${escape2("Submit")}`
    })}
</form>`;
  } while (!$$settled);
  $$unsubscribe_session();
  return $$rendered;
});
var createBooking = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": CreateBooking,
  load: load$6
});
var CreatePet = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_session;
  $$unsubscribe_session = subscribe(session, (value) => value);
  let petName = "";
  $$unsubscribe_session();
  return `<h1>Create Pet</h1>
<form>${``}
  <fieldset><label for="${"name"}">Pet name</label>
    <input type="${"text"}" name="${"name"}"${add_attribute("value", petName, 1)}></fieldset>
  <button type="${"button"}">Submit</button></form>`;
});
var createPet = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": CreatePet
});
var Bookings = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return ``;
});
var index$4 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Bookings
});
var U5Bidu5D$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return ``;
});
var _id_$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": U5Bidu5D$1
});
var css$2 = {
  code: "input.svelte-197dkgi{padding:1px}.danger.svelte-197dkgi{color:red}",
  map: `{"version":3,"file":"profile.svelte","sources":["profile.svelte"],"sourcesContent":["<script context=\\"module\\" lang=\\"ts\\">;\\r\\nexport function load({ session }) {\\r\\n    return {\\r\\n        props: {\\r\\n            user: session.user,\\r\\n        },\\r\\n    };\\r\\n}\\r\\n<\/script>\\r\\n\\r\\n<script>\\r\\n  import { patch } from '$lib/api';\\r\\n  import { session } from '$app/stores';\\r\\n  export let user;\\r\\n  let errorMessage = '';\\r\\n\\r\\n  async function handleSubmit(e) {\\r\\n    try {\\r\\n      errorMessage = '';\\r\\n      console.log('handling submit \u26A1');\\r\\n      const res = await patch({\\r\\n        path: \`api/v1/users/\${user.id}\`,\\r\\n        data: { firstName: user.first_name, lastName: user.last_name },\\r\\n        token: $session.token,\\r\\n      });\\r\\n      console.log(res);\\r\\n    } catch (err) {\\r\\n      console.log('should be here');\\r\\n      errorMessage = 'Update failed, try again later.';\\r\\n    }\\r\\n  }\\r\\n<\/script>\\r\\n\\r\\n<h1>This is the profile page</h1>\\r\\n\\r\\n{#if errorMessage}\\r\\n  <p class=\\"danger\\">{errorMessage}</p>\\r\\n{/if}\\r\\n<form>\\r\\n  <fieldset>\\r\\n    <label for=\\"email\\">Email</label>\\r\\n    <input type=\\"text\\" name=\\"firstName\\" value={user.email} disabled />\\r\\n  </fieldset>\\r\\n  <fieldset>\\r\\n    <label for=\\"firstName\\">First Name</label>\\r\\n    <input type=\\"text\\" name=\\"firstName\\" bind:value={user.first_name} />\\r\\n  </fieldset>\\r\\n  <fieldset>\\r\\n    <label for=\\"lastName\\">Last Name</label>\\r\\n    <input type=\\"text\\" name=\\"lastName\\" bind:value={user.last_name} />\\r\\n  </fieldset>\\r\\n  <button type=\\"button\\" on:click|stopPropagation={handleSubmit}>Submit</button>\\r\\n</form>\\r\\n\\r\\n<style>\\r\\n  input {\\r\\n    padding: 1px;\\r\\n  }\\r\\n\\r\\n  .danger {\\r\\n    color: red;\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAuDE,KAAK,eAAC,CAAC,AACL,OAAO,CAAE,GAAG,AACd,CAAC,AAED,OAAO,eAAC,CAAC,AACP,KAAK,CAAE,GAAG,AACZ,CAAC"}`
};
function load$5({ session: session2 }) {
  return { props: { user: session2.user } };
}
var Profile = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_session;
  $$unsubscribe_session = subscribe(session, (value) => value);
  let { user } = $$props;
  if ($$props.user === void 0 && $$bindings.user && user !== void 0)
    $$bindings.user(user);
  $$result.css.add(css$2);
  $$unsubscribe_session();
  return `<h1>This is the profile page</h1>

${``}
<form><fieldset><label for="${"email"}">Email</label>
    <input type="${"text"}" name="${"firstName"}"${add_attribute("value", user.email, 0)} disabled class="${"svelte-197dkgi"}"></fieldset>
  <fieldset><label for="${"firstName"}">First Name</label>
    <input type="${"text"}" name="${"firstName"}" class="${"svelte-197dkgi"}"${add_attribute("value", user.first_name, 1)}></fieldset>
  <fieldset><label for="${"lastName"}">Last Name</label>
    <input type="${"text"}" name="${"lastName"}" class="${"svelte-197dkgi"}"${add_attribute("value", user.last_name, 1)}></fieldset>
  <button type="${"button"}">Submit</button>
</form>`;
});
var profile = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Profile,
  load: load$5
});
async function load$4({ fetch: fetch2 }) {
  console.log("logout.svelte running");
  await fetch2("/auth/logout", { method: "post" });
  return goto("/login");
}
var Logout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return ``;
});
var logout = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Logout,
  load: load$4
});
var Pets = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return ``;
});
var index$3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Pets
});
var css$1 = {
  code: "a.svelte-1ea4zrq{box-sizing:border-box;padding:0.5rem 1rem;font-family:var(--fontFamilySansSerif);background-color:var(--btnSecondary);color:var(--fontColor);border:2px solid var(--btnSecondaryFont);text-decoration:none}a.svelte-1ea4zrq:hover{cursor:pointer;background-color:var(--btnSecondaryHover)}",
  map: '{"version":3,"file":"ButtonLink.svelte","sources":["ButtonLink.svelte"],"sourcesContent":["<script lang=\\"ts\\">export let href;\\r\\n<\/script>\\r\\n\\r\\n<a {href}>\\r\\n  <slot />\\r\\n</a>\\r\\n\\r\\n<style>\\r\\n  a {\\r\\n    box-sizing: border-box;\\r\\n    padding: 0.5rem 1rem;\\r\\n    font-family: var(--fontFamilySansSerif);\\r\\n    background-color: var(--btnSecondary);\\r\\n    color: var(--fontColor);\\r\\n    border: 2px solid var(--btnSecondaryFont);\\r\\n    text-decoration: none;\\r\\n  }\\r\\n\\r\\n  a:hover {\\r\\n    cursor: pointer;\\r\\n    background-color: var(--btnSecondaryHover);\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAQE,CAAC,eAAC,CAAC,AACD,UAAU,CAAE,UAAU,CACtB,OAAO,CAAE,MAAM,CAAC,IAAI,CACpB,WAAW,CAAE,IAAI,qBAAqB,CAAC,CACvC,gBAAgB,CAAE,IAAI,cAAc,CAAC,CACrC,KAAK,CAAE,IAAI,WAAW,CAAC,CACvB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,kBAAkB,CAAC,CACzC,eAAe,CAAE,IAAI,AACvB,CAAC,AAED,gBAAC,MAAM,AAAC,CAAC,AACP,MAAM,CAAE,OAAO,CACf,gBAAgB,CAAE,IAAI,mBAAmB,CAAC,AAC5C,CAAC"}'
};
var ButtonLink = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { href } = $$props;
  if ($$props.href === void 0 && $$bindings.href && href !== void 0)
    $$bindings.href(href);
  $$result.css.add(css$1);
  return `<a${add_attribute("href", href, 0)} class="${"svelte-1ea4zrq"}">${slots.default ? slots.default({}) : ``}
</a>`;
});
var css = {
  code: "form.svelte-19hjji8.svelte-19hjji8{display:flex;flex-direction:column;justify-content:center}form.svelte-19hjji8 div.svelte-19hjji8{display:flex;flex-direction:row;justify-content:space-around}fieldset.svelte-19hjji8.svelte-19hjji8{padding:10px 0}",
  map: `{"version":3,"file":"[id].svelte","sources":["[id].svelte"],"sourcesContent":["<script context=\\"module\\" lang=\\"ts\\">var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\\r\\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\\r\\n    return new (P || (P = Promise))(function (resolve, reject) {\\r\\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\\r\\n        function rejected(value) { try { step(generator[\\"throw\\"](value)); } catch (e) { reject(e); } }\\r\\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\\r\\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\\r\\n    });\\r\\n};\\r\\n;\\r\\nimport { get } from '$lib/api';\\r\\nexport function load({ session, page, }) {\\r\\n    return __awaiter(this, void 0, void 0, function* () {\\r\\n        if (!session.token) {\\r\\n            return {\\r\\n                status: 303,\\r\\n                redirect: '/',\\r\\n            };\\r\\n        }\\r\\n        if (page.params.id) {\\r\\n            const { data } = yield get({\\r\\n                path: \`api/v1/pets/\${page.params.id}\`,\\r\\n                token: session.token,\\r\\n            });\\r\\n            return {\\r\\n                props: {\\r\\n                    pet: data,\\r\\n                },\\r\\n            };\\r\\n        }\\r\\n        return {\\r\\n            props: {\\r\\n                pet: null,\\r\\n            },\\r\\n        };\\r\\n    });\\r\\n}\\r\\n<\/script>\\r\\n\\r\\n<script lang=\\"ts\\">var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\\r\\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\\r\\n    return new (P || (P = Promise))(function (resolve, reject) {\\r\\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\\r\\n        function rejected(value) { try { step(generator[\\"throw\\"](value)); } catch (e) { reject(e); } }\\r\\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\\r\\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\\r\\n    });\\r\\n};\\r\\nimport Button from '$lib/components/Button.svelte';\\r\\nimport ButtonLink from '$lib/components/ButtonLink.svelte';\\r\\nimport Input from '$lib/components/InputText.svelte';\\r\\nimport { patch } from '$lib/api';\\r\\nimport { session, page } from '$app/stores';\\r\\nexport let pet;\\r\\nlet disabled = false;\\r\\nfunction handleSubmit() {\\r\\n    return __awaiter(this, void 0, void 0, function* () {\\r\\n        try {\\r\\n            disabled = true;\\r\\n            const data = {\\r\\n                name: pet.name,\\r\\n                userId: $session.user.id,\\r\\n            };\\r\\n            yield patch({\\r\\n                path: \`api/v1/pets/\${$page.params.id}\`,\\r\\n                data,\\r\\n                token: $session.token,\\r\\n            });\\r\\n        }\\r\\n        catch (err) {\\r\\n            console.log(err);\\r\\n        }\\r\\n        finally {\\r\\n            disabled = false;\\r\\n        }\\r\\n    });\\r\\n}\\r\\n<\/script>\\r\\n\\r\\n<h1>Pet Details</h1>\\r\\n<form action=\\"post\\">\\r\\n  <fieldset {disabled}>\\r\\n    <Input name=\\"name\\" label=\\"Name\\" bind:value={pet.name} />\\r\\n  </fieldset>\\r\\n  <div>\\r\\n    <ButtonLink href=\\"/app\\">Cancel</ButtonLink>\\r\\n    <Button click={handleSubmit} {disabled}>Save</Button>\\r\\n  </div>\\r\\n</form>\\r\\n\\r\\n<style>\\r\\n  form {\\r\\n    display: flex;\\r\\n    flex-direction: column;\\r\\n    justify-content: center;\\r\\n  }\\r\\n\\r\\n  form div {\\r\\n    display: flex;\\r\\n    flex-direction: row;\\r\\n    justify-content: space-around;\\r\\n  }\\r\\n\\r\\n  fieldset {\\r\\n    padding: 10px 0;\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AA2FE,IAAI,8BAAC,CAAC,AACJ,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,eAAe,CAAE,MAAM,AACzB,CAAC,AAED,mBAAI,CAAC,GAAG,eAAC,CAAC,AACR,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,GAAG,CACnB,eAAe,CAAE,YAAY,AAC/B,CAAC,AAED,QAAQ,8BAAC,CAAC,AACR,OAAO,CAAE,IAAI,CAAC,CAAC,AACjB,CAAC"}`
};
var __awaiter$3 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
function load$3({ session: session2, page: page2 }) {
  return __awaiter$3(this, void 0, void 0, function* () {
    if (!session2.token) {
      return { status: 303, redirect: "/" };
    }
    if (page2.params.id) {
      const { data } = yield get({
        path: `api/v1/pets/${page2.params.id}`,
        token: session2.token
      });
      return { props: { pet: data } };
    }
    return { props: { pet: null } };
  });
}
var U5Bidu5D = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $session, $$unsubscribe_session;
  let $page, $$unsubscribe_page;
  $$unsubscribe_session = subscribe(session, (value) => $session = value);
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  var __awaiter2 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve2) {
        resolve2(value);
      });
    }
    return new (P || (P = Promise))(function(resolve2, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  let { pet } = $$props;
  let disabled = false;
  function handleSubmit() {
    return __awaiter2(this, void 0, void 0, function* () {
      try {
        disabled = true;
        const data = { name: pet.name, userId: $session.user.id };
        yield patch({
          path: `api/v1/pets/${$page.params.id}`,
          data,
          token: $session.token
        });
      } catch (err) {
        console.log(err);
      } finally {
        disabled = false;
      }
    });
  }
  if ($$props.pet === void 0 && $$bindings.pet && pet !== void 0)
    $$bindings.pet(pet);
  $$result.css.add(css);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    $$rendered = `<h1>Pet Details</h1>
<form action="${"post"}" class="${"svelte-19hjji8"}"><fieldset ${disabled ? "disabled" : ""} class="${"svelte-19hjji8"}">${validate_component(InputText, "Input").$$render($$result, {
      name: "name",
      label: "Name",
      value: pet.name
    }, {
      value: ($$value) => {
        pet.name = $$value;
        $$settled = false;
      }
    }, {})}</fieldset>
  <div class="${"svelte-19hjji8"}">${validate_component(ButtonLink, "ButtonLink").$$render($$result, { href: "/app" }, {}, { default: () => `Cancel` })}
    ${validate_component(Button, "Button").$$render($$result, { click: handleSubmit, disabled }, {}, { default: () => `Save` })}</div>
</form>`;
  } while (!$$settled);
  $$unsubscribe_session();
  $$unsubscribe_page();
  return $$rendered;
});
var _id_ = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": U5Bidu5D,
  load: load$3
});
var __awaiter$2 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
function load$2({ session: session2 }) {
  var _a;
  return __awaiter$2(this, void 0, void 0, function* () {
    try {
      const res = yield get({
        path: `api/v1/organizations?userId=${session2.user.id}`,
        token: session2.token
      });
      if (((_a = res.data) === null || _a === void 0 ? void 0 : _a.length) > 0) {
        return {
          status: 302,
          redirect: `/app/o/${res.data[0].id}`
        };
      } else {
        return {};
      }
    } catch (error22) {
      console.log(error22);
      return { error: error22 };
    }
  });
}
var O = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<h1>Welcome! Let&#39;s get to work! \u{1F4AA}</h1>
<p>But first...let&#39;s <a href="${"/app/o/createOrganization"}">create an organization!</a></p>`;
});
var index$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": O,
  load: load$2
});
var CreateOrganization = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $session, $$unsubscribe_session;
  $$unsubscribe_session = subscribe(session, (value) => $session = value);
  var __awaiter2 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve2) {
        resolve2(value);
      });
    }
    return new (P || (P = Promise))(function(resolve2, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  let orgName = "";
  let errorMessage = "";
  let disabled = false;
  let success = void 0;
  const handleSubmit = () => __awaiter2(void 0, void 0, void 0, function* () {
    try {
      disabled = true;
      errorMessage = "";
      const res = yield post$1({
        path: "api/v1/organizations",
        data: { name: orgName, ownerId: $session.user.id },
        token: $session.token
      });
      const orgId = res.data.id;
      success = true;
      yield new Promise((resolve2) => setTimeout(resolve2, 1e3));
      yield goto(`/app`);
    } catch (err) {
      errorMessage = "Failed to create organization. Try again later.";
      console.log(err);
    } finally {
      disabled = false;
    }
  });
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    $$rendered = `<h1>Create your organization</h1>
<form>${errorMessage ? `<p>${escape2(errorMessage)}</p>` : ``}
  <fieldset ${disabled ? "disabled" : ""}>${validate_component(InputText, "InputText").$$render($$result, {
      name: "name",
      label: "Organization name",
      value: orgName
    }, {
      value: ($$value) => {
        orgName = $$value;
        $$settled = false;
      }
    }, {})}</fieldset>
  ${validate_component(Button, "Button").$$render($$result, { click: handleSubmit, disabled }, {}, {
      default: () => `${escape2(success ? "\u{1F680}" : "Submit")}`
    })}</form>`;
  } while (!$$settled);
  $$unsubscribe_session();
  return $$rendered;
});
var createOrganization = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": CreateOrganization
});
var __awaiter$1 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
function load$1({ page: page2, session: session2 }) {
  return __awaiter$1(this, void 0, void 0, function* () {
    try {
      const { orgId } = page2.params;
      const bookings = yield get({
        path: `api/v1/bookings?orgId=${orgId}&sort[]=drop_off_at+DESC`,
        token: session2.token
      });
      return {
        props: { orgId, bookings: bookings.data }
      };
    } catch (error22) {
      console.log("this caught");
      console.log(error22);
      return { error: error22, status: 500 };
    }
  });
}
var U5BorgIdu5D = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { orgId } = $$props;
  let { bookings } = $$props;
  if ($$props.orgId === void 0 && $$bindings.orgId && orgId !== void 0)
    $$bindings.orgId(orgId);
  if ($$props.bookings === void 0 && $$bindings.bookings && bookings !== void 0)
    $$bindings.bookings(bookings);
  return `<h1>Organization page ${escape2(orgId)}</h1>
<h5>Today</h5>
${validate_component(BookingsList, "BookingsList").$$render($$result, { bookings }, {}, {})}`;
});
var index$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": U5BorgIdu5D,
  load: load$1
});
var CreateLocation = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  let $session, $$unsubscribe_session;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$unsubscribe_session = subscribe(session, (value) => $session = value);
  var __awaiter2 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve2) {
        resolve2(value);
      });
    }
    return new (P || (P = Promise))(function(resolve2, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  let name = "";
  let errorMessage = "";
  let disabled = false;
  let success = void 0;
  const handleSubmit = () => __awaiter2(void 0, void 0, void 0, function* () {
    try {
      disabled = true;
      errorMessage = "";
      const loc = yield post$1({
        path: `api/v1/organizations/${$page.params.orgId}/locations`,
        data: { name },
        token: $session.token
      });
      success = true;
      yield new Promise((resolve2) => setTimeout(resolve2, 1e3));
      yield goto(`/app/o/${$page.params.orgId}`);
    } catch (err) {
      errorMessage = "Failed to create Location. Try again later.";
      console.log(err);
    } finally {
      disabled = false;
    }
  });
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    $$rendered = `<h1>Create Location</h1>
<p>A <strong>location</strong> represents a physical location that your organization
  manages. Many business owners just have one location. Some people name it after
  the address or street name.
</p>
<p>For example: <strong>Vine Street Kennel</strong></p>

<form>${errorMessage ? `<p>${escape2(errorMessage)}</p>` : ``}
  <fieldset ${disabled ? "disabled" : ""}>${validate_component(InputText, "InputText").$$render($$result, {
      name: "name",
      label: "Location name",
      value: name
    }, {
      value: ($$value) => {
        name = $$value;
        $$settled = false;
      }
    }, {})}</fieldset>
  ${validate_component(Button, "Button").$$render($$result, { click: handleSubmit, disabled }, {}, {
      default: () => `${escape2(success ? "\u{1F680}" : "Submit")}`
    })}</form>`;
  } while (!$$settled);
  $$unsubscribe_page();
  $$unsubscribe_session();
  return $$rendered;
});
var createLocation = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": CreateLocation
});
var __awaiter = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
function load({ session: session2, page: page2 }) {
  return __awaiter(this, void 0, void 0, function* () {
    const { orgId, locId } = page2.params;
    const bookingsRes = yield get({
      path: `api/v1/bookings?orgId=${orgId}&locId=${locId}`,
      token: session2.token
    });
    return {
      props: { orgId, locId, bookings: bookingsRes.data }
    };
  });
}
var U5BlocIdu5D = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { orgId } = $$props;
  let { locId } = $$props;
  let { bookings } = $$props;
  if ($$props.orgId === void 0 && $$bindings.orgId && orgId !== void 0)
    $$bindings.orgId(orgId);
  if ($$props.locId === void 0 && $$bindings.locId && locId !== void 0)
    $$bindings.locId(locId);
  if ($$props.bookings === void 0 && $$bindings.bookings && bookings !== void 0)
    $$bindings.bookings(bookings);
  return `<h1>Organization page ${escape2(orgId)} - ${escape2(locId)}</h1>

${validate_component(BookingsList, "BookingsList").$$render($$result, { bookings }, {}, {})}`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": U5BlocIdu5D,
  load
});

// .svelte-kit/netlify/entry.js
init();
async function handler(event) {
  const { path, httpMethod, headers, rawQuery, body, isBase64Encoded } = event;
  const query = new URLSearchParams(rawQuery);
  const encoding = isBase64Encoded ? "base64" : headers["content-encoding"] || "utf-8";
  const rawBody = typeof body === "string" ? Buffer.from(body, encoding) : body;
  const rendered = await render({
    method: httpMethod,
    headers,
    path,
    query,
    rawBody
  });
  if (rendered) {
    return {
      isBase64Encoded: false,
      statusCode: rendered.status,
      ...splitHeaders(rendered.headers),
      body: rendered.body
    };
  }
  return {
    statusCode: 404,
    body: "Not found"
  };
}
function splitHeaders(headers) {
  const h = {};
  const m = {};
  for (const key in headers) {
    const value = headers[key];
    const target = Array.isArray(value) ? m : h;
    target[key] = value;
  }
  return {
    headers: h,
    multiValueHeaders: m
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
