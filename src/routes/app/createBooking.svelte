<script lang="ts" context="module">
  import type { LoadInput, LoadOutput } from '@sveltejs/kit';
  import { get, post } from '$lib/api';
  import type { Location, Organization } from '$lib/types';

  export async function load({
    page,
    session,
  }: LoadInput): Promise<LoadOutput> {
    let orgId: number = parseInt(page.query.get('org_id') ?? '0');
    let locId: number = parseInt(page.query.get('loc_id') ?? '0');
    try {
      const res = await get({
        path: `api/v1/organizations/${orgId}`,
        token: session.token,
      });

      const org: Organization = res.data;
      const loc: Location = org.location.find((l) => l.id === locId);

      return {
        props: {
          org,
          loc,
        },
      };
    } catch (err) {
      console.log(err);
      return {};
    }
  }
</script>

<script lang="ts">
  import type dayjs from 'dayjs/esm';
  import { session } from '$app/stores';
  import DatePicker from '$lib/components/DatePicker.svelte';
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/InputText.svelte';
  import InputChips from '$lib/components/InputChips.svelte';
  import Label from '$lib/components/Label.svelte';
  import About from '../about.svelte';
  import AppHeader from '../../lib/header/AppHeader.svelte';
  import BookingCard from '../../lib/bookings/BookingCard.svelte';
  import BookingsList from '../../lib/bookings/BookingsList.svelte';

  export let org: Organization;
  export let loc: Location;

  let errorMessage = '';
  let disabled: boolean = false;
  let success: boolean;
  let pets: any[] = $session.user.pet;
  let petId = pets?.[0].id ?? '';
  let dropOffDate: dayjs.Dayjs; // '2021-08-23';
  let dropOffTime: string; // '17:00';
  let pickUpDate: dayjs.Dayjs; // '2021-08-31';
  let pickUpTime: string; // '08:00';
  let selectedPets: string[] = [];

  let summary = '';

  function joinNames(names: string[]) {
    if (names.length === 0) {
      return '';
    }
    if (names.length === 1) {
      return names[0];
    }
    if (names.length === 2) {
      return `${names[0]} and ${names[1]}`;
    }
    if (names.length > 2) {
      return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
    }
  }

  $: petNames = selectedPets.map((p) => JSON.parse(p).name);
  $: petSummary = joinNames(petNames);
  $: dropOffDateSummary = dropOffDate ? dropOffDate.format('ddd, MMM D') : '';
  $: pickUpDateSummary = pickUpDate ? pickUpDate.format('ddd, MMM D') : '';

  function handleDateChange(
    event: CustomEvent<{ startDate?: dayjs.Dayjs; endDate?: dayjs.Dayjs }>
  ) {
    dropOffDate = event.detail.startDate?.startOf('day');
    pickUpDate = event.detail.endDate?.startOf('day');
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
          orgId: org.id,
          locId: loc.id,
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
    <Input disabled value={org.name} name="where" label="Where?" />
    <Input disabled value={loc.name} name="" label="" />
  </fieldset>
  <fieldset>
    <InputChips
      bind:group={selectedPets}
      options={pets}
      name="pets"
      label="Who?"
      {disabled}
    />
  </fieldset>
  <fieldset>
    <Label>When?</Label>
    <DatePicker on:change={handleDateChange} />
  </fieldset>

  <p class="summary">
    {dropOffDate && !petSummary ? '...' : ''}
    {#if petSummary}
      <span class="tertiary">{petSummary}</span>
    {/if}
  </p>
  <p class="summary">
    {petSummary && !dropOffDateSummary ? '...' : ''}
    {#if dropOffDateSummary}
      will be dropped off on <span class="secondary">{dropOffDateSummary}</span>
    {/if}
  </p>
  <p class="summary">
    {petSummary && dropOffDateSummary && !pickUpDateSummary ? '...' : ''}
    {#if pickUpDateSummary}
      and picked up on <span class="secondary">{pickUpDateSummary}</span>
    {/if}
  </p>

  <Button click={handleSubmit} {disabled}>{success ? '🚀' : 'Submit'}</Button>
</form>

<style>
  fieldset {
    margin-bottom: 2rem;
  }
  input[type='time'] {
    background-color: var(--bgCardColor);
    border: none;
    font-family: var(--fontFamilySansSerif);
    padding: 8px;
  }

  .dateInput {
    font-weight: bold;
  }

  .summary {
    font-size: 1.4rem;
    max-width: 400px;
    font-weight: bold;
  }

  .summary span {
    padding-left: 5px;
    padding-right: 5px;
    font-weight: normal;
    font-family: var(--fontFamilyDisplay);
  }

  .summary span.secondary {
    background-color: var(--textHighlightSecondary);
  }

  .summary span.tertiary {
    background-color: var(--textHighlightTertiary);
  }
</style>
