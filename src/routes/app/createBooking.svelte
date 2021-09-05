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
      const selectedLocation: Location = org.location.find(
        (l) => l.id === locId
      );

      return {
        props: {
          org,
          selectedLocation,
          selectedLocationId: selectedLocation.id,
          allLocations: org.location,
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
  import InputDropdown from '$lib/components/InputDropdown.svelte';
  import InputTime from '$lib/components/InputTime.svelte';

  export let org: Organization;
  export let selectedLocation: Location;
  let selectedLocationId: string | number;
  export let allLocations: Location[];

  let errorMessage = '';
  let disabled: boolean = false;
  let success: boolean;
  let pets: any[] = $session.user.pet;
  let petId = pets?.[0].id ?? '';
  let dropOffDate: dayjs.Dayjs;
  let dropOffHour: number;
  let dropOffMinute: number;
  let dropOffAmpm: string;
  let pickUpDate: dayjs.Dayjs;
  let pickUpHour: number;
  let pickUpMinute: number;
  let pickUpAmpm: string;
  let selectedPetsString: string[] = [];

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

  $: selectedPets = selectedPetsString.map((p) => JSON.parse(p));
  $: petNames = selectedPets.map((p) => p.name);
  $: petSummary = joinNames(petNames);
  $: dropOffDateSummary = dropOffDate ? dropOffDate.format('ddd, MMM D') : '';
  $: pickUpDateSummary = pickUpDate ? pickUpDate.format('ddd, MMM D') : '';
  $: selectedLocation = allLocations.find(
    (x) => x.id === (selectedLocationId as number)
  );
  $: locationSummary = selectedLocation;

  function handleDateChange(
    event: CustomEvent<{ startDate?: dayjs.Dayjs; endDate?: dayjs.Dayjs }>
  ) {
    dropOffDate = event.detail.startDate?.startOf('day');
    pickUpDate = event.detail.endDate?.startOf('day');
  }

  const handleSubmit = async () => {
    let dropOffAtISO: string;
    let pickUpAtISO: string;

    try {
      let dropOffDatetime = dropOffDate
        .hour(dropOffHour + (dropOffAmpm.toUpperCase() === 'PM' ? 12 : 0))
        .minute(dropOffMinute)
        .second(0);
      let pickUpDatetime = pickUpDate
        .hour(pickUpHour + (pickUpAmpm.toUpperCase() === 'PM' ? 12 : 0))
        .minute(pickUpMinute)
        .second(0);

      //TODO timezone? this seems to adjust know what utc offset to use.
      dropOffAtISO = dropOffDatetime.toISOString();
      pickUpAtISO = pickUpDatetime.toISOString();
      console.log(dropOffAtISO, pickUpAtISO);
    } catch (err) {
      errorMessage = 'Invalid pick up/drop off dates ⌚';
      console.error(err);
      return;
    }

    let bookingDetails: any[];

    try {
      bookingDetails = selectedPets.map((p) => {
        return {
          petId: p.id,
        };
      });
    } catch (err) {
      errorMessage = 'Error gathering pet details 😿.';
      console.log(err);
      return;
    }

    try {
      disabled = true;
      errorMessage = '';

      let data = {
        orgId: org.id,
        locId: selectedLocation.id,
        pickUpAt: pickUpAtISO,
        dropOffAt: dropOffAtISO,
        bookingDetails,
      };

      const booking = await post({
        path: 'api/v1/bookings',
        data,
        token: $session.token,
      });
      //await goto('/app');
    } catch (err) {
      errorMessage = 'Failed to create organization. Try again later.';
      console.log(err);
    } finally {
      disabled = false;
    }
  };
</script>

<h1>Create Booking</h1>
<form>
  {#if errorMessage}
    <p class="error">{errorMessage}</p>
  {/if}
  <fieldset>
    <Input disabled value={org.name} name="where" label="Where?" />
    <InputDropdown
      {disabled}
      bind:value={selectedLocationId}
      options={allLocations}
      name="location"
    />
    <!-- TODO add map here of the location -->
  </fieldset>
  <fieldset>
    <InputChips
      bind:group={selectedPetsString}
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
    {#if petSummary}
      <span class="tertiary">{petSummary}</span>
    {/if}
  </p>
  <p class="summary">
    {locationSummary && !petSummary && dropOffDateSummary ? '...' : ''}
    {#if locationSummary && (petSummary || dropOffDateSummary)}
      will be staying at <span class="quaternary">{locationSummary.name}</span>
    {/if}
  </p>
  <p class="summary">
    {#if dropOffDateSummary}
      from <span class="secondary">{dropOffDateSummary}</span>
      <InputTime
        bind:hour={dropOffHour}
        bind:minute={dropOffMinute}
        bind:ampm={dropOffAmpm}
      />
    {/if}
    {petSummary && dropOffDateSummary && !pickUpDateSummary ? '...' : ''}
  </p>
  <p class="summary">
    {#if pickUpDateSummary}
      to <span class="secondary">{pickUpDateSummary}</span>
      <InputTime
        bind:hour={pickUpHour}
        bind:minute={pickUpMinute}
        bind:ampm={pickUpAmpm}
      />
    {/if}
  </p>

  <Button click={handleSubmit} {disabled}>{success ? '🚀' : 'Submit'}</Button>
</form>

<style>
  fieldset {
    margin-bottom: 2rem;
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

  .summary span.quaternary {
    background-color: var(--textHighlightQuaternary);
  }

  .summary span.secondary {
    background-color: var(--textHighlightSecondary);
  }

  .summary span.tertiary {
    background-color: var(--textHighlightTertiary);
  }

  .error {
    color: var(--errorColor);
  }
</style>
