<script lang="ts">
  export let click: any;
  export let disabled: boolean = false;
</script>

<button type="button" on:click|stopPropagation={click} {disabled}>
  <slot />
</button>

<style>
  button {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    font-family: var(--fontFamilySansSerif);
    background-color: hsl(var(--btnPrimary));
    color: hsl(var(--btnPrimayFont));
    border: none;
  }

  button:hover {
    cursor: pointer;
    background-color: hsl(var(--btnPrimary), 0.8);
  }
</style>
