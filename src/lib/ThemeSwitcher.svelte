<script lang="ts">
  import { theme, themes } from '$lib/stores/theme';
</script>

<select bind:value={$theme}>
  {#each themes as { name, label, icon }}
    <option value={name}>{label} <span>{icon}</span></option>
  {/each}
</select>

<style>
  select {
    font-family: var(--fontFamilySansSerif);
    font-size: 1rem;
  }
</style>
