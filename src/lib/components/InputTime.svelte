<script lang="ts">
  export let hours: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  export let minutes: number[] = [0, 15, 30, 45];
  export let ampms: string[] = ['am', 'pm'];
  export let hour: number;
  export let minute: number;
  export let ampm: string;
</script>

<select name="hour" bind:value={hour}>
  {#each hours as _hour}
    <option value={_hour}>{_hour}</option>
  {/each}
</select>

<select name="minute" bind:value={minute}>
  {#each minutes as _minute}
    <option value={_minute}>{_minute.toString().padStart(2, '0')}</option>
  {/each}
</select>

<select name="ampm" bind:value={ampm}>
  {#each ampms as _ampm}
    <option value={_ampm}>{_ampm.toUpperCase()}</option>
  {/each}
</select>

<style>
  select {
    border: none;
    padding: 10px;
    font-size: 1rem;
  }

  select:hover {
    cursor: pointer;
  }
</style>
