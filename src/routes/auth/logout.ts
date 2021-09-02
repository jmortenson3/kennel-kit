import { COOKIE_AUTH_KEY_NAME } from "$lib/config";

export function post() {
  console.log("logout runs");
  return {
    headers: {
      "set-cookie": `${COOKIE_AUTH_KEY_NAME}=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    },
    body: {
      ok: true,
    },
  };
}
