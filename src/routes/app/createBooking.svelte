<script lang="ts">
  import dayjs from 'dayjs/esm';
  import { session, page } from '$app/stores';
  import { post } from '$lib/api';
  import DatePicker from '$lib/components/DatePicker.svelte';
  import Button from '$lib/components/Button.svelte';

  let orgId: number = parseInt($page.query.get('org_id') ?? '0');
  let locId: number = parseInt($page.query.get('loc_id') ?? '0');

  let errorMessage = '';
  let disabled: boolean = false;
  let success: boolean;
  let pets: any[] = $session.user.pet;
  let petId = pets?.[0].id ?? '';
  let dropOffDate: string; // '2021-08-23';
  let dropOffTime: string; // '17:00';
  let pickUpDate: string; // '2021-08-31';
  let pickUpTime: string; // '08:00';

  function handleDateChange(
    event: CustomEvent<{ startDate?: dayjs.Dayjs; endDate?: dayjs.Dayjs }>
  ) {
    console.log(`caught event at ${new Date().getTime()}`);
    dropOffDate = event.detail.startDate?.toISOString();
    pickUpDate = event.detail.endDate?.toISOString();

    console.log({ dropOffDate, pickUpDate });
  }

  const handleSubmit = async () => {
    let dropOffAt: string;
    let pickUpAt: string;

    try {
      let dropOffAtDatetime = new Date(`${dropOffDate}T${dropOffTime}:00`);
      let pickUpAtDatetime = new Date(`${pickUpDate}T${pickUpTime}:00`);
      dropOffAt = dropOffAtDatetime.toISOString();
      pickUpAt = pickUpAtDatetime.toISOString();
      console.log(dropOffAt, pickUpAt);
    } catch (err) {
      errorMessage = 'Invalid pick up/drop off dates ⌚';
      console.error(err);
      return;
    }

    try {
      errorMessage = '';
      const booking = await post({
        path: 'api/v1/bookings',
        data: {
          orgId,
          locId,
          pickUpAt: pickUpAt,
          dropOffAt: dropOffAt,
          bookingDetails: [
            {
              petId: petId,
            },
          ],
        },
        token: $session.token,
      });
      //await goto('/app');
    } catch (err) {
      errorMessage = 'Failed to create organization. Try again later.';
      console.log(err);
    }
  };
</script>

<h1>Create Booking</h1>
<form>
  {#if errorMessage}
    <p>{errorMessage}</p>
  {/if}
  <fieldset>
    <div>
      <label for="name">Who? 🐕‍🦺</label>
      <select name="pet" bind:value={petId}>
        {#each pets as pet}
          <option value={pet.id}>{pet.name}</option>
        {/each}
      </select>
    </div>
    <div>
      <label>When?</label>
      <DatePicker on:change={handleDateChange} />
    </div>
  </fieldset>
  <fieldset />

  <Button click={handleSubmit} {disabled}>{success ? '🚀' : 'Submit'}</Button>
</form>
