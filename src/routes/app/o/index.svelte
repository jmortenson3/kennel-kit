<script context="module" lang="ts">
  import type { LoadInput, LoadOutput } from "@sveltejs/kit";
  import { get } from "$lib/api";

  export async function load({ session }: LoadInput): Promise<LoadOutput> {
    try {
      const res = await get({
        path: `api/v1/organizations?userId=${session.user.id}`,
        token: session.token,
      });

      if (res.data?.length > 0) {
        return {
          status: 302,
          redirect: `/app/o/${res.data[0].id}`,
        };
      } else {
        return {};
      }
    } catch (error) {
      console.log(error);
      return { error };
    }
  }
</script>

<h1>Welcome! Let's get to work! 💪</h1>
<p>
  But first...let's <a href="/app/o/createOrganization"
    >create an organization!</a>
</p>
