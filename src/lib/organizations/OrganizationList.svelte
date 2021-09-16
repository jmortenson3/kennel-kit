<script lang="ts">
  import OrganizationCard from '$lib/organizations/OrganizationCard.svelte';

  export let organizations: any[] = [];
</script>

<div>
  {#if organizations?.length > 0}
    {#each organizations as organization}
      <OrganizationCard name={organization.name} id={organization.id} />
    {/each}
  {:else}
    <p>You're not in any organizations</p>
    <p><a href="/app/createOrganization">Create one</a></p>
  {/if}
</div>
