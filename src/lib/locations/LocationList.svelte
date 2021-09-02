<script lang="ts">
  import { session } from "$app/stores";
  import LocationCard from "./LocationCard.svelte";

  export let orgId: number; 
  let organizations: any[] = $session.user.organization_user.map(org_user => org_user.organization);
  let organization = organizations.find(organization => organization.id == orgId);
  let locations: any[] = organization.location;
  console.log(locations);
</script>

<div>
  {#if locations.length > 0}
    {#each locations as location}
      <LocationCard orgId={organization.id} locId={location.id} name={location.name} />
    {/each}
  {:else}
    <p>This organization does have any locations yet.</p>
    <p><a href={`/app/createLocation?org_id=${orgId}`}>Create one</a></p>
    <p>A location represents the specific place in the world.</p>
  {/if}
</div>
