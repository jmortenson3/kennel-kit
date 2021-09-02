<script lang="ts">
  export let href: string;
</script>

<a {href}>
  <slot />
</a>

<style>
  a {
    box-sizing: border-box;
    padding: 0.5rem 1rem;
    font-family: var(--fontFamilySansSerif);
    background-color: hsl(var(--btnSecondary));
    color: hsl(var(--fontColor));
    border: 2px solid hsl(var(--btnSecondaryFont));
    text-decoration: none;
  }

  a:hover {
    cursor: pointer;
    background-color: hsl(var(--btnSecondary), 0.8);
  }
</style>
