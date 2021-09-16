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
  organization_id: number;
  location_id: number;
  drop_off_at: string;
  pick_up_at: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  booking_details: BookingDetails[];
  user: User;
};

type BookingDetails = {
  id: string;
  booking_id: string;
  pet_id: string;
  created_at: string;
  updated_at: string;
  pet: Pet;
};

type Pet = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};

type User = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at?: string;
  password_hash?: string;
  deleted_at?: string;
};
