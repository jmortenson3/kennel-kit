<script lang="ts">
  import { get } from '$lib/api';
  import { session } from '$app/stores';
  import { onMount } from 'svelte';
  import type { Booking } from '$lib/types';
  import dayjs from 'dayjs/esm';

  export let bookings: Booking[] = undefined;

  console.log(bookings);

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
    <table>
      <thead>
        <tr>
          <th>Drop Off At</th>
          <th>Pick Up At</th>
          <th>User</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        {#each bookings as booking}
          <tr>
            <td>
              {dayjs(booking.drop_off_at).format('MM/DD/YYYY h:mm A')}
            </td>
            <td> {dayjs(booking.pick_up_at).format('MM/DD/YYYY h:mm A')} </td>
            <td>
              {booking.user.first_name ?? ''}
              {booking.user.last_name ?? ''}
            </td>
            <td> {booking.user.email} </td>
          </tr>

          {#each booking.booking_details as bd}
            <tr class="nestedRow">
              <td> {bd.pet.name} </td>
              <td />
              <td> Check In </td>
              <td> Check Out </td>
            </tr>
          {/each}
        {/each}
      </tbody>
    </table>
  {:else}
    <p>No upcoming bookings</p>
  {/if}
</div>

<style>
  table {
    border-spacing: 0;
    padding-top: 16px;
    padding-bottom: 16px;
    text-align: left;
  }

  tr {
    margin-left: 10px;
    margin-right: 10px;
  }

  td,
  th {
    background-color: var(--tableRowColor);
    padding: 5px 16px;
  }
  .nestedRow td {
    background-color: var(--tableSubRowColor);
  }
</style>
