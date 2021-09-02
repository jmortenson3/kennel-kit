/**
 * Can be made globally available by placing this
 * inside `global.d.ts` and removing `export` keyword
 */
export interface Locals {
  userid: string;
}

type Theme = "system" | "light" | "dark";

type Organization = {
  id: number;
  name: string;
  location: Location[];
};

type Location = {
  id: number;
  name: string;
};

type Booking = {
  id: string;
};
