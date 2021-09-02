<script context="module" lang="ts">
  import type { LoadInput, LoadOutput } from '@sveltejs/kit';
  import { get } from '$lib/api';

  export async function load({
    session,
    page,
  }: LoadInput): Promise<LoadOutput> {
    if (!session.token) {
      return {
        status: 303,
        redirect: '/',
      };
    }

    if (page.params.id) {
      const { data } = await get({
        path: `api/v1/pets/${page.params.id}`,
        token: session.token,
      });
      return {
        props: {
          pet: data,
        },
      };
    }

    return {
      props: {
        pet: null,
      },
    };
  }
</script>

<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import ButtonLink from '$lib/components/ButtonLink.svelte';
  import Input from '$lib/components/InputText.svelte';
  import { patch } from '$lib/api';
  import { session, page } from '$app/stores';

  export let pet: any;
  let disabled = false;

  async function handleSubmit() {
    try {
      disabled = true;
      const data = {
        name: pet.name,
        userId: $session.user.id,
      };
      await patch({
        path: `api/v1/pets/${$page.params.id}`,
        data,
        token: $session.token,
      });
    } catch (err) {
      console.log(err);
    } finally {
      disabled = false;
    }
  }
</script>

<h1>Pet Details</h1>
<form action="post">
  <fieldset {disabled}>
    <Input name="name" label="Name" bind:value={pet.name} />
  </fieldset>
  <div>
    <ButtonLink href="/app">Cancel</ButtonLink>
    <Button click={handleSubmit} {disabled}>Save</Button>
  </div>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  form div {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
  }

  fieldset {
    padding: 10px 0;
  }
</style>
