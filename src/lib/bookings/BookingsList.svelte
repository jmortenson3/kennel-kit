<script lang="ts">
  import BookingCard from '$lib/bookings/BookingCard.svelte';
  import { get } from '$lib/api';
  import { session } from '$app/stores';
  import { onMount } from 'svelte';

  export let bookings: any[] = undefined;

  onMount(async () => {
    if (bookings !== undefined) {
      return;
    }

    try {
      const res = await get({
        path: `api/v1/bookings?userId=${$session.user.id}`,
        token: $session.token,
      });

      bookings = res.data;
    } catch (err) {
      console.log(err);
    }
  });
</script>

<div>
  {#if bookings && bookings.length > 0}
    <a href="/app/createPet"><h3>Add Pet</h3></a>
    {#each bookings as booking}
      <BookingCard {booking} />
    {/each}
  {:else}
    <p>No upcoming bookings</p>
  {/if}
</div>

<style>
</style>
