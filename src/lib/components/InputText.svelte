<script lang="ts">
  export let name: string;
  export let label: string = name;
  export let value: any;
  export let disabled: boolean = false;
  export let placeholder: string = '';
</script>

<label for={name}>{label}</label>
<input type="text" {name} bind:value {disabled} {placeholder} />

<style>
  input {
    border: none;
    padding: 10px;
  }
</style>
