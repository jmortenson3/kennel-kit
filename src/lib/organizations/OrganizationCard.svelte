<script lang="ts">
  export let id: number;
  export let name: string;
  const url = `/app/o/${id}`;
</script>

<li>
  <a href={url}>
    <h3>{name}</h3>
  </a>
</li>

<style>
  li {
    list-style-type: none;
    text-align: center;
    border-radius: 5px;
    background-color: var(--bgCardColor);
    transition: all 0.1s;
  }

  li a {
    display: flex;
    padding: 0.25rem 1rem;
    text-decoration: none;
    color: var(--fontColor);
  }

  li:hover {
    background-color: var(--colorSecondary);
  }
</style>
