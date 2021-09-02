<script lang="ts">
	import { page } from '$app/stores';
</script>

<header>
	<div class="corner">
		<a href="https://kit.svelte.dev">
			<span>🐕‍🦺</span>
		</a>

		<nav>
			<ul>
				<li class:active={$page.path === '/'}><a href="/">Home</a></li>
				<li class:active={$page.path === '/about'}><a href="/about">About</a></li>
				<li class:active={$page.path === '/login'}><a href="/login">Login</a></li>
				<li class:active={$page.path === '/signup'}><a href="/signup">Signup</a></li>
				<li class:active={$page.path === '/app'}><a href="/app">Dashboard</a></li>
			</ul>
		</nav>
	</div>

	<div class="corner">
		<!-- TODO put something else here? github link? -->
	</div>
</header>

<style>
	header {
		display: flex;
		justify-content: space-between;
		color: #153a33;
		position: absolute;
		height: 50px;
		width: 100%;
	}

	.corner {
		width: 3em;
		height: 3em;
		display: flex;
	}

	.corner a {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		text-decoration: none;
	}

	.corner a span {
		font-size: 1.8em;
		object-fit: contain;
	}


	nav {
		display: flex;
		justify-content: center;
	}

	ul {
		position: relative;
		padding: 0;
		margin: 0;
		height: 3em;
		display: flex;
		justify-content: center;
		align-items: center;
		list-style: none;
		background-size: contain;
	}

	li {
		position: relative;
		height: 100%;
	}

	li:hover {
		cursor: pointer;
		text-decoration: underline;
	}

	li.active::before {
		--size: 6px;
		content: '';
		width: 0;
		height: 0;
		position: absolute;
		top: 0;
		left: calc(50% - var(--size));
		border: var(--size) solid transparent;
		border-top: var(--size) solid var(--accent-color);
	}

	nav a {
		display: flex;
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

	a:hover {
		color: var(--accent-color);
	}
</style>
