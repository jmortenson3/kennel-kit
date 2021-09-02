import { readable, writable } from "svelte/store";

export const theme = writable("light");
export const themes = [
  {
    name: "light",
    label: "Light",
    icon: "🌞",
  },
  {
    name: "dark",
    label: "Dark",
    icon: "🌑",
  },
];
