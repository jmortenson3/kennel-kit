<script lang="ts">
  import { session } from "$app/stores";
  import { setAppContext } from '$lib/stores/appContext';

  export let orgId: number;
  let organizations: any[];
  let organization: any;
  let locations: any[];
  let selectedLocation: number;
  
  $:{
    organizations = $session.user.organization_user.map(org_user => org_user.organization);
    organization = organizations.find(o => o.id == orgId);
    locations = organization?.location;
  }

  $:{
    setAppContext({orgId: orgId, locId: selectedLocation});
  }
</script>

<form>
  {#if locations?.length > 0}
  <label for="location">Location, currently {selectedLocation}</label>
  <!-- svelte-ignore a11y-no-onchange -->
  <select name="location" bind:value={selectedLocation}>
    {#each locations as location}
      <option value={location.id}>{location.name}</option>
    {/each}
  </select>
  {/if}
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
  }
</style>