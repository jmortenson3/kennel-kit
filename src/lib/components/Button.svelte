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
    background-color: var(--btnPrimary);
    color: var(--btnPrimayFont);
    border: none;
  }

  button:hover {
    cursor: pointer;
    background-color: var(--btnPrimaryHover);
  }
</style>
