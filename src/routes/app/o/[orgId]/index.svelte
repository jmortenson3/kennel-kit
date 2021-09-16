<script context="module" lang="ts">
  import type { LoadInput, LoadOutput } from "@sveltejs/kit";
  import { get } from "$lib/api";

  export async function load({
    page,
    session,
  }: LoadInput): Promise<LoadOutput> {
    try {
      const { orgId } = page.params;
      const bookings = await get({
        path: `api/v1/bookings?orgId=${orgId}&sort[]=drop_off_at+DESC`,
        token: session.token,
      });

      return {
        props: {
          orgId,
          bookings: bookings.data,
        },
      };
    } catch (error) {
      console.log("this caught");
      console.log(error);
      return {
        error,
        status: 500,
      };
    }
  }
</script>

<script lang="ts">
  import BookingsList from "$lib/bookings/BookingsList.svelte";

  export let orgId: string;
  export let bookings: any[];
</script>

<h1>Organization page {orgId}</h1>
<h5>Today</h5>
<BookingsList {bookings} />
