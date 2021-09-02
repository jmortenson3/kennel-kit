<script context="module">
  import { goto } from '$app/navigation';

  export async function load({ fetch }) {
    console.log('logout.svelte running');
    await fetch('/auth/logout', {
      method: 'post',
    });
    return goto('/login');
  }
</script>
