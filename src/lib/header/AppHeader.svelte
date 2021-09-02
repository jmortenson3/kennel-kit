<script lang="ts">
  import { page, session } from '$app/stores';
  import ThemeSwitcher from '$lib/ThemeSwitcher.svelte';
  import { onMount } from 'svelte';
  import { get } from '$lib/api';
  import OrganizationPicker from '$lib/organizations/OrganizationPicker.svelte';
  import type { Organization, Location } from '$lib/types';

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
    console.log(typeof $page.params.orgId);
    selectedOrg = organizations.find(
      (o) => o.id === parseInt($page.params.orgId)
    );
    locations = selectedOrg.location;
  });
</script>

<header>
  <div class="corner">
    <a href="/app">
      <span>🐕‍🦺</span>
    </a>
    <OrganizationPicker {organizations} />
  </div>
  <nav>
    <h3>Locations</h3>
    <ul>
      {#each locations as location}
        <li
          class:active={$page.path ===
            `/app/o/${selectedOrg.id}/l/${location.id}`}
        >
          <a href={`/app/o/${selectedOrg.id}/l/${location.id}`}>
            {location.name}
          </a>
        </li>
      {/each}
      <li>
        <a href={`/app/o/${selectedOrg?.id}/createLocation`}
          >+ Create location</a
        >
      </li>
    </ul>
  </nav>

  <div class="corner">
    <!-- TODO put something else here? github link? -->
    <a href="/app/logout">Logout ✌</a>
    <ThemeSwitcher />
  </div>
</header>

<style>
  header {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: var(--navbar);
    color: white;
    margin-right: 1rem;
    width: 240px;
  }

  .corner {
    display: flex;
    flex-direction: column;
    padding: 1rem;
  }

  .corner a {
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    text-decoration: none;
    margin-bottom: 1rem;
  }

  .corner span {
    font-size: 1.8em;
    object-fit: contain;
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
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 10%;
    text-decoration: none;
    transition: color 0.2s linear;
  }

  nav ul li:last-child {
    color: var(--navHeaderColor);
  }
</style>
