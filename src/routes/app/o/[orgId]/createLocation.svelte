<script lang="ts">
  import { goto } from '$app/navigation';
  import { session, page } from '$app/stores';
  import { post } from '$lib/api';
  import InputText from '$lib/components/InputText.svelte';
  import Button from '$lib/components/Button.svelte';

  let name = '';
  let errorMessage = '';
  let disabled = false;
  let success: boolean = undefined;

  const handleSubmit = async () => {
    try {
      disabled = true;
      errorMessage = '';
      const loc = await post({
        path: `api/v1/organizations/${$page.params.orgId}/locations`,
        data: { name },
        token: $session.token,
      });
      success = true;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await goto(`/app/o/${$page.params.orgId}`);
    } catch (err) {
      errorMessage = 'Failed to create Location. Try again later.';
      console.log(err);
    } finally {
      disabled = false;
    }
  };
</script>

<h1>Create Location</h1>
<p>
  A <strong>location</strong> represents a physical location that your organization
  manages. Many business owners just have one location. Some people name it after
  the address or street name.
</p>
<p>For example: <strong>Vine Street Kennel</strong></p>

<form>
  {#if errorMessage}
    <p>{errorMessage}</p>
  {/if}
  <fieldset {disabled}>
    <InputText name="name" bind:value={name} label="Location name" />
  </fieldset>
  <Button click={handleSubmit} {disabled}>{success ? '🚀' : 'Submit'}</Button>
</form>
