<script context="module" lang="ts">
  import Header from '$lib/header/Header.svelte';

  export async function load({ page, fetch, session, context }) {
    return {};
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

<Header />

<main>
  <slot />
</main>

<style>
  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }
</style>
