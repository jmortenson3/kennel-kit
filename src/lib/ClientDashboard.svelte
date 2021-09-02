<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from '$lib/api';
  import { session } from '$app/stores';
  import OrganizationList from '$lib/organizations/OrganizationList.svelte';

  let organizations: any[];

  onMount(async () => {
    try {
      const res = await get({
        path: `api/v1/organizations?userId=${$session.user.id}`,
        token: $session.token,
      });
      organizations = res.data;
    } catch (err) {
      console.log(err);
    }
  });
</script>

<h1>Welcome! Let's get to work! 💪</h1>
{#if organizations !== undefined && organizations.length > 0}
  <p>Which organization are you working with?</p>
  <OrganizationList {organizations} />
{:else}
  <p>
    But first...let's <a href="/app/o/createOrganization"
      >create an organization!</a
    >
  </p>
{/if}
