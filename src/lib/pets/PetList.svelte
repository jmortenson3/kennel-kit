<script lang="ts">
  import PetCard from '$lib/pets/PetCard.svelte';
  import { get } from '$lib/api';
  import { session } from '$app/stores';
  import { onMount } from 'svelte';

  export let pets: any[] = undefined;

  onMount(async () => {
    if (pets !== undefined) {
      return;
    }

    try {
      const res = await get({
        path: `api/v1/pets?userId=${$session.user.id}`,
        token: $session.token,
      });

      pets = res.data;
    } catch (err) {
      console.log(err);
    }
  });
</script>

<div>
  {#if pets && pets.length > 0}
    <a href="/app/createPet"><h3>Add Pet</h3></a>
    {#each pets as pet}
      <PetCard name={pet.name} id={pet.id} />
    {/each}
  {:else}
    <p><a href="/app/createPet">Let's add your pets!</a></p>
  {/if}
</div>

<style>
</style>
