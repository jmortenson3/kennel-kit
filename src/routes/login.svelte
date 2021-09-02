<script lang="ts" context="module">
  import type { LoadInput, LoadOutput } from '@sveltejs/kit';
  import { me } from '$lib/stores/auth';

  export async function load({ session }: LoadInput): Promise<LoadOutput> {
    if (!session.token) {
      return {};
    }

    const user = await me(session.token);

    if (!user) {
      return {};
    } else {
      return {
        status: 302,
        redirect: '/app',
      };
    }
  }
</script>

<script lang="ts">
  import { goto } from '$app/navigation';
  import { post } from '$lib/api';
  import { session } from '$app/stores';
  import { COOKIE_AUTH_KEY_NAME } from '$lib/config';
  import Cookie from 'universal-cookie';
  const dogUrl =
    'https://images.unsplash.com/photo-1561037404-61cd46aa615b?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=750&q=80';

  const cookie = new Cookie();
  let username = 'josiah.mortenson@gmail.com';
  let password = 'P@ssw0rd';
  let error = '';

  const submit = async (event) => {
    error = '';
    try {
      const body = { username, password };
      const res = await post({ path: `api/v1/auth/login`, data: body });
      cookie.set(COOKIE_AUTH_KEY_NAME, res.data.access_token, { path: '/' });
      $session.token = res.data.access_token;
      goto('/app');
    } catch (err) {
      console.log(err);
      error = 'Login failed';
    }
  };
</script>

<svelte:head>
  <title>Login</title>
</svelte:head>
<div class="split-content">
  <article>
    <h1>Login</h1>
    {#if error}
      <p>{error}</p>
    {/if}
    <form on:submit|preventDefault={submit} method="post">
      <fieldset>
        <label for="username">Email</label>
        <input
          type="text"
          name="username"
          placeholder="ginny@woof.com"
          bind:value={username}
        />
      </fieldset>
      <fieldset>
        <label for="password">Password</label>
        <input
          type="password"
          name="password"
          placeholder="******"
          bind:value={password}
        />
      </fieldset>
      <p>New here? <a href="/signup">Signup today!</a></p>
      <button type="submit">Submit</button>
    </form>
  </article>
  <img
    src={dogUrl}
    alt="Dog staring intently at you with pale pink background."
  />
</div>

<style>
  .split-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 50px;
    height: 100%;
  }

  h1,
  p {
    text-align: center;
  }

  h1 {
    margin-top: 150px;
  }

  form {
    display: flex;
    flex-direction: column;
  }

  fieldset {
    padding: 0;
    display: flex;
    width: 200px;
    align-self: center;
    flex-direction: column;
    margin-top: 1rem;
    border: none;
  }

  input {
    border: none;
    background-color: #f0f0f0;
    padding: 8px;
  }

  button {
    padding: 8px;
    margin-top: 1rem;
    width: 200px;
    align-self: center;
    background-color: #153a33;
    border: none;
    border-radius: 5px;
    color: white;
    font-weight: bold;
    letter-spacing: 1.3px;
  }

  img {
    /* height: 100%; */
    object-fit: cover;
    object-position: center;
    height: 100%;
    max-width: 100%;
  }
</style>
