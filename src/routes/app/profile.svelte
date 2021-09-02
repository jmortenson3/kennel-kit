<script context="module" lang="ts">
  import type { LoadInput } from '@sveltejs/kit';

  export function load({ session }: LoadInput) {
    return {
      props: {
        user: session.user,
      },
    };
  }
</script>

<script>
  import { patch } from '$lib/api';
  import { session } from '$app/stores';
  export let user;
  let errorMessage = '';

  async function handleSubmit(e) {
    try {
      errorMessage = '';
      console.log('handling submit ⚡');
      const res = await patch({
        path: `api/v1/users/${user.id}`,
        data: { firstName: user.first_name, lastName: user.last_name },
        token: $session.token,
      });
      console.log(res);
    } catch (err) {
      console.log('should be here');
      errorMessage = 'Update failed, try again later.';
    }
  }
</script>

<h1>This is the profile page</h1>

{#if errorMessage}
  <p class="danger">{errorMessage}</p>
{/if}
<form>
  <fieldset>
    <label for="email">Email</label>
    <input type="text" name="firstName" value={user.email} disabled />
  </fieldset>
  <fieldset>
    <label for="firstName">First Name</label>
    <input type="text" name="firstName" bind:value={user.first_name} />
  </fieldset>
  <fieldset>
    <label for="lastName">Last Name</label>
    <input type="text" name="lastName" bind:value={user.last_name} />
  </fieldset>
  <button type="button" on:click|stopPropagation={handleSubmit}>Submit</button>
</form>

<style>
  input {
    padding: 1px;
  }

  .danger {
    color: red;
  }
</style>
