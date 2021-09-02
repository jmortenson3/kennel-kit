<script lang="ts">
  export let organizations: any[] = [];
  let defaultOrg = organizations?.[0];
  let selectedOrganization = defaultOrg?.id;
</script>

<form>
  {#if organizations.length > 0}
    <!-- svelte-ignore a11y-no-onchange -->
    <select name="organization" bind:value={selectedOrganization}>
      {#each organizations as organization}
        <option value={organization.id}>{organization.name}</option>
      {/each}
    </select>
  {/if}
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
  }

  form select {
    background-color: transparent;
    color: hsl(var(--btnPrimayFont));
    font-size: 1.4rem;
    border: none;
  }

  form select:hover {
    cursor: pointer;
  }
</style>
