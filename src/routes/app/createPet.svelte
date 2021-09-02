<script>
  import { goto } from '$app/navigation';
  import { session } from '$app/stores';
  import { post } from '$lib/api';

  let petName = '';
  let errorMessage = '';

  const handleSubmit = async () => {
    try {
      errorMessage = '';
      await post({
        path: 'api/v1/pets',
        data: { name: petName },
        token: $session.token,
      });
      await goto('/app');
    } catch (err) {
      errorMessage = 'Failed to create pet. Try again later.';
      console.log(err);
    }
  };
</script>

<h1>Create Pet</h1>
<form>
  {#if errorMessage}
    <p>{errorMessage}</p>
  {/if}
  <fieldset>
    <label for="name">Pet name</label>
    <input type="text" name="name" bind:value={petName} />
  </fieldset>
  <button type="button" on:click|stopPropagation={handleSubmit}>Submit</button>
</form>
