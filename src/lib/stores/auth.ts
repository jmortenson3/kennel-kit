import { writable } from "svelte/store";
import { get } from "$lib/api";
const { set } = writable({});

export const me = async (token?: string) => {
  try {
    const user = await get({ path: "api/v1/users/me", token });
    set(user.data);
    return user.data;
  } catch (err) {
    set({});
  }
};
