import { API_URL, COOKIE_AUTH_KEY_NAME } from "$lib/config";
import Cookie from "universal-cookie";

const cookie = new Cookie();
const cookieToken = cookie.get(COOKIE_AUTH_KEY_NAME);

interface ApiInput {
  path: string;
  token?: string;
  data?: any;
}

interface SendInput {
  method: string;
  path: string;
  data?: any;
  token?: string;
}

const send = async ({ method, path, data, token }: SendInput) => {
  const opts: RequestInit = { method, headers: {} };
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

export const post = async ({ path, data, token }: ApiInput) => {
  return await send({ method: "POST", path, data, token });
};

export const put = async ({ path, data, token }: ApiInput) => {
  return await send({ method: "PUT", path, data, token });
};

export const patch = async ({ path, data, token }: ApiInput) => {
  return await send({ method: "PATCH", path, data, token });
};

export const get = async ({ path, token }: ApiInput) => {
  return await send({ method: "GET", path, token });
};

export const del = async ({ path, token }: ApiInput) => {
  return await send({ method: "DELETE", path, token });
};
