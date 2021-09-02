<script lang="ts">
  import Label from '$lib/components/Label.svelte';

  export let name: string;
  export let label: string = name;
  export let value: any;
  export let disabled: boolean = false;
  export let placeholder: string = '';
</script>

<Label forName={name}>{label}</Label>
<input type="text" {name} bind:value {disabled} {placeholder} />

<style>
  input {
    border: none;
    padding: 10px;
  }
</style>
