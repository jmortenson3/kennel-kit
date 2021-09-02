<script lang="ts">
  import { goto } from "$app/navigation";

  export let orgId: number;
  export let locId: number;
  export let name: string;

  const handleGoto = async () => {
    await goto(`/app?org_id=${orgId}&loc_id=${locId}`);
  }

</script>

<div on:click={handleGoto}>
  <h3>{name}</h3>
</div>

<style>
  div:hover {
    cursor: pointer;
  }

  div {
    height: 100px;
    width: 100px;
    line-height: 100px;
    text-align: center;
    border-radius: 5px;
    background-color: wheat;
  }
</style>
