<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { accountService } from '$lib/services/account.js';

	onMount(() => {
		// Check if authenticated, if yes redirect to dashboard
		if (accountService.getAuthStatus()) {
			goto('/dashboard');
		} else {
			// If not authenticated, redirect to dashboard (will show auth modal)
			goto('/dashboard');
		}
	});
</script>

<svelte:head>
	<title>HRD Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
	<div class="text-center">
		<div class="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
			<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V8a2 2 0 00-2-2"></path>
			</svg>
		</div>
		<h1 class="text-4xl font-bold text-gray-900 mb-4">Dashboard HRD</h1>
		<p class="text-xl text-gray-600 mb-8">Sistem Manajemen Lowongan Pekerjaan</p>
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
		<p class="text-gray-500 mt-4">Redirecting...</p>
	</div>
</div>