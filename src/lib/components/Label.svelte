<script lang="ts">
  export let forName: string = '';
</script>

<label for={forName}><slot /></label>

<style>
  label {
    font-weight: bold;
    margin-right: 1rem;
    font-size: 1.4rem;
  }
</style>
