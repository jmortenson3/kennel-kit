<script context="module" lang="ts">
  import type { LoadInput, LoadOutput } from '@sveltejs/kit';
  import PetList from '$lib/pets/PetList.svelte';
  import BookingsList from '$lib/bookings/BookingsList.svelte';

  export async function load({ session }: LoadInput): Promise<LoadOutput> {
    const isClient =
      session.user.user_settings.find((us) => (us.key = 'isClient'))?.value ===
      'true';

    if (isClient) {
      let organizations: any[] = session.user.organization_user.map(
        (org_user) => org_user.organization
      );
      return {
        redirect: `/app/o/${organizations[0].id}`,
        status: 302,
      };
    } else {
      return {};
    }
  }
</script>

<h5>Your furry friends</h5>
<PetList />
<h5>Upcoming Bookings</h5>
<BookingsList />
