<script lang="ts">
  export let name: string;
  export let group: string[] = []; // { id: string | number; name: string }[];
  export let options: { id: string | number; name: string }[];
  export let disabled: boolean = false;
  export let label: string = '';
</script>

<legend>{label}</legend>
{#each options as item}
  <input
    type="checkbox"
    bind:group
    {name}
    value={JSON.stringify(item)}
    id={item.id.toString()}
    {disabled}
  />
  <label for={item.id.toString()}>{item.name}</label>
{/each}

<style>
  legend {
    font-weight: bold;
    float: left;
  }

  input[type='checkbox'] {
    appearance: none;
  }

  input:checked {
  }

  label {
    font-weight: bold;
    padding: 5px 12px;
    background-color: var(--bgCardColor);
    box-shadow: 1px 1px 2px var(--shadowColor);
    border-radius: 20px;
  }

  input:hover,
  label:hover {
    cursor: pointer;
  }

  input:checked + label {
    background-color: var(--selectedChipColor);
    color: var(--selectedChipFontColor);
  }
</style>
