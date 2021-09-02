import cookie from "cookie";
import type { GetSession, Handle } from "@sveltejs/kit";
import { COOKIE_AUTH_KEY_NAME } from "$lib/config";
import { me } from "$lib/stores/auth";

/**
 * Runs on every request, for both pages and endpoints. Use to modify
 * 	response headers and bodies.
 *
 * Notice here, the auth token is being pulled off the header and put into
 * 	request.locals. Token can then be accessed from a bunch of other places.
 *
 * To add custom data to request which is passed to endpoints,
 * 	populate `request.locals` object.
 *
 * @param param0
 * @returns
 */
export const handle: Handle = async ({ request, resolve }) => {
  const cookies = cookie.parse(request.headers.cookie || "");
  request.locals.token = cookies[COOKIE_AUTH_KEY_NAME];

  // TODO https://github.com/sveltejs/kit/issues/1046
  if (request.query.has("_method")) {
    request.method = request.query.get("_method").toUpperCase();
  }

  try {
    const user = await me(request.locals.token);
    request.locals.user = user;
  } catch (err) {
    request.locals.user = null;
  }

  const response = await resolve(request);

  if (!cookies.userid) {
    // if this is the first time the user has visited this app,
    // set a cookie so that we recognise them when they return
    response.headers[
      "set-cookie"
    ] = `userid=${request.locals.userid}; Path=/; HttpOnly`;
  }

  return response;
};

/**
 * Takes the `request` object and returns a `session` object that is
 * `accessible on the client and therefore must be safe to expose to users.
 *
 * Runs whenever sveltekit renders a page.
 * @param request
 */
export const getSession: GetSession = async ({ locals }) => {
  return {
    user: locals.user,
    token: locals.token,
  };
};
