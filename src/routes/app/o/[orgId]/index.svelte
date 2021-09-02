<script context="module" lang="ts">
  import type { LoadInput, LoadOutput } from '@sveltejs/kit';
  import { get } from '$lib/api';

  export async function load({
    page,
    session,
  }: LoadInput): Promise<LoadOutput> {
    const { orgId } = page.params;
    const bookings = await get({
      path: `api/v1/bookings?orgId=${orgId}`,
      token: session.token,
    });
    return {
      props: {
        orgId,
        bookings: bookings.data,
      },
    };
  }
</script>

<script lang="ts">
  import BookingsList from '$lib/bookings/BookingsList.svelte';

  export let orgId: string;
  export let bookings: any[];
</script>

<h1>Organization page {orgId}</h1>
<BookingsList {bookings} />
