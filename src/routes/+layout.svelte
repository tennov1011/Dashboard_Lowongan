<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { accountService, isAuthenticated } from '$lib/services/account.js';
	import AuthModal from '$lib/components/AuthModal.svelte';

	let showAuthModal = false;

	onMount(() => {
		// Check authentication status on mount
		const isAuth = accountService.checkAuthentication();
		if (!isAuth) {
			showAuthModal = true;
		}
	});

	// Subscribe to authentication changes
	$: {
		if (!$isAuthenticated) {
			showAuthModal = true;
		} else {
			showAuthModal = false;
		}
	}
</script>

<main>
	{#if $isAuthenticated}
		<slot />
	{:else}
		<!-- Show loading or placeholder while checking auth -->
		<div class="min-h-screen bg-gray-50 flex items-center justify-center">
			<div class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
				<p class="text-gray-600">Checking authentication...</p>
			</div>
		</div>
	{/if}
</main>

{#if showAuthModal}
	<AuthModal bind:showModal={showAuthModal} />
{/if}