import { writable } from "svelte/store";

type AppContext = {
  orgId?: number;
  locId?: number;
};

export const appContext = writable<AppContext>({});

export const setAppContext = async (data: AppContext) => {
  appContext.update((value) => {
    console.log("updating appContext with value", data);
    return {
      orgId: data.orgId,
      locId: data.locId,
    };
  });
};
