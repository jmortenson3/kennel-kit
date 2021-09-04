<script lang="ts">
  export let name: string = '';
  export let options: ({ id: number | string; name: string } | string)[];
  export let value: any;
  export let disabled = false;
</script>

<select {disabled} {name} bind:value>
  {#each options as option}
    {#if typeof option === 'string'}
      <option value={option}>{option}</option>
    {:else}
      <option value={option.id}>{option.name}</option>
    {/if}
  {/each}
</select>

<style>
  select {
    border: none;
    padding: 10px;
  }

  select:hover {
    cursor: pointer;
  }
</style>
