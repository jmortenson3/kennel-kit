<script lang="ts">
  import { page, session } from "$app/stores";
  import ThemeSwitcher from "$lib/ThemeSwitcher.svelte";
  import { onMount } from "svelte";
  import { get } from "$lib/api";
  import OrganizationPicker from "$lib/organizations/OrganizationPicker.svelte";
  import type { Organization, Location } from "$lib/types";

  const isClient =
    $session.user.user_settings.find((us) => (us.key = "isClient"))?.value ===
    "true";
  let organizations: Organization[] = [];
  let locations: Location[] = [];
  let selectedOrg: Organization;

  const fetchOrgs = async () => {
    try {
      const orgRes = await get({
        path: `api/v1/organizations?userId=${$session.user.id}`,
        token: $session.token,
      });
      return orgRes.data;
    } catch (err) {
      console.log(err);
    }
  };

  onMount(async () => {
    organizations = await fetchOrgs();
    selectedOrg = organizations?.find(
      (o) => o.id === parseInt($page.params.orgId)
    );
    console.log(selectedOrg);
    locations = selectedOrg?.location ?? [];
  });
</script>

<header>
  <div class="corner">
    <a href="/app">🌿 Pupper</a>
    <OrganizationPicker {organizations} />
  </div>
  <nav>
    {#if isClient}
      <h3>Locations</h3>
      <ul>
        {#each locations as location}
          <li
            class:active={$page.path ===
              `/app/o/${selectedOrg.id}/l/${location.id}`}>
            <a href={`/app/o/${selectedOrg.id}/l/${location.id}`}>
              {location.name}
            </a>
          </li>
        {/each}
        <li>
          <a href={`/app/o/${selectedOrg?.id}/createLocation`}
            >+ Create location</a>
        </li>
      </ul>
    {:else}
      <ul>
        <li><a href="/app">Dashboard</a></li>
        <li><a href="/app/pets">Pets</a></li>
        <li><a href="/app/bookings">Bookings</a></li>
      </ul>
    {/if}
  </nav>

  <div class="corner">
    <!-- TODO put something else here? github link? -->
    <a href="/app/logout">Logout ✌</a>
    <ThemeSwitcher />
  </div>
</header>

<style>
  header {
    position: fixed;
    flex: 0 0 100px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: var(--navbar);
    color: var(--navbarFontColor);
    margin-right: 1rem;
    width: 225px;
    box-shadow: 2px 0px 15px -10px var(--shadowColor);
    height: 100%;
  }

  .corner {
    display: flex;
    flex-direction: column;
    padding: 1rem;
  }

  .corner a {
    color: var(--navbarFontColor);
    font-family: var(--fontFamilyDisplay);
    font-size: 1.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    text-decoration: none;
    margin-bottom: 1rem;
  }

  nav {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  nav h3 {
    margin: 0;
    margin-bottom: 0.5rem;
    padding-left: 1rem;
    font-family: var(--fontFamilyDisplay);
    font-weight: normal;
    letter-spacing: 2px;
    color: var(--navHeaderColor);
    /* text-transform: uppercase; */
    font-size: 1rem;
  }

  nav ul {
    position: relative;
    padding: 0;
    margin: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    list-style: none;
    background-size: contain;
  }

  li {
    position: relative;
    height: 100%;
    width: 100%;
    padding: 0.5rem 0;
  }

  li:hover {
    text-decoration: underline;
  }

  li.active {
    background-color: var(--navbarSelected);
    color: var(--navbarSelectedFont);
  }

  nav ul li a {
    height: 100%;
    align-items: center;
    padding: 0 1em;
    color: var(--heading-color);
    font-weight: 700;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 10%;
    text-decoration: none;
    transition: color 0.2s linear;
  }

  nav ul li:last-child {
    color: var(--navHeaderColor);
  }
</style>
