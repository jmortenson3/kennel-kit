<script context="module" lang="ts">
  import Header from '$lib/header/AppHeader.svelte';
  import type { LoadInput, LoadOutput } from '@sveltejs/kit';
  import { me } from '$lib/stores/auth';

  export async function load({ session }: LoadInput): Promise<LoadOutput> {
    if (!session.token) {
      return {
        status: 303,
        redirect: '/',
      };
    }

    const user = await me(session.token);

    if (user) {
      session.user = user;
      return { props: { ...user } };
    } else {
      return {
        status: 302,
        redirect: '/login',
      };
    }
  }
</script>

<script lang="ts">
  import { theme } from '$lib/stores/theme';
</script>

<svelte:head>
  <meta
    name="color-scheme"
    content={$theme === 'system' ? 'light dark' : $theme}
  />
  <link rel="stylesheet" href={`/theme/${$theme}.css`} />
</svelte:head>

<div>
  <Header />
  <main>
    <slot />
  </main>
</div>

<style>
  div {
    display: flex;
    min-height: 100vh;
    background-color: hsla(var(--bgColor));
  }
</style>
