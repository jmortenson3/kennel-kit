<script lang="ts">
  import { goto } from '$app/navigation';

  import { session } from '$app/stores';
  import Button from '$components/Button.svelte';
  import InputText from '$components/InputText.svelte';
  import { post } from '$lib/api';

  let orgName = '';
  let errorMessage = '';
  let disabled = false;
  let success: boolean = undefined;

  const handleSubmit = async () => {
    try {
      disabled = true;
      errorMessage = '';
      const res = await post({
        path: 'api/v1/organizations',
        data: { name: orgName, ownerId: $session.user.id },
        token: $session.token,
      });
      const orgId = res.data.id;
      success = true;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await goto(`/app`);
    } catch (err) {
      errorMessage = 'Failed to create organization. Try again later.';
      console.log(err);
    } finally {
      disabled = false;
    }
  };
</script>

<h1>Create your organization</h1>
<form>
  {#if errorMessage}
    <p>{errorMessage}</p>
  {/if}
  <fieldset {disabled}>
    <InputText name="name" bind:value={orgName} label="Organization name" />
  </fieldset>
  <Button click={handleSubmit} {disabled}>{success ? '🚀' : 'Submit'}</Button>
</form>
