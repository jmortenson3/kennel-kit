<script context="module" lang="ts">
  import type { LoadInput, LoadOutput } from '@sveltejs/kit';
  import { get } from '$lib/api';

  export async function load({
    session,
    page,
  }: LoadInput): Promise<LoadOutput> {
    const { orgId, locId } = page.params;

    const bookingsRes = await get({
      path: `api/v1/bookings?orgId=${orgId}&locId=${locId}`,
      token: session.token,
    });

    return {
      props: {
        orgId,
        locId,
        bookings: bookingsRes.data,
      },
    };
  }
</script>

<script lang="ts">
  import BookingsList from '$lib/bookings/BookingsList.svelte';
  import type { Booking } from '$lib/types';

  export let orgId: string;
  export let locId: string;
  export let bookings: Booking[];
</script>

<h1>Organization page {orgId} - {locId}</h1>

<BookingsList {bookings} />
