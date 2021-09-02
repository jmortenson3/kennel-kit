<script lang="ts">
  import { session } from '$app/stores';
  import UserDashboard from '$lib/UserDashboard.svelte';
  import ClientDashboard from '$lib/ClientDashboard.svelte';

  const isClient =
    $session.user.user_settings.find((us) => (us.key = 'isClient'))?.value ===
    'true';
</script>

{#if isClient}
  <ClientDashboard />
{:else}
  <UserDashboard />
{/if}
