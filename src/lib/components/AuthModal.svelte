<script>
	import { accountService } from '$lib/services/account.js';

	export let showModal = false;

	let code = '';
	let isLoading = false;
	let errorMessage = '';

	async function handleSubmit() {
		if (!code.trim()) {
			errorMessage = 'Kode akses harus diisi';
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			await accountService.authenticate(code);
			showModal = false;
			code = '';
		} catch (error) {
			errorMessage = error.message;
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(event) {
		if (event.key === 'Enter') {
			handleSubmit();
		}
	}
</script>

{#if showModal}
	<!-- Modal backdrop -->
	<div class="fixed inset-0 bg-orange-200 bg-opacity-50 flex items-center justify-center z-50">
		<!-- Modal content -->
		<div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8">
			<!-- Header -->
			<div class="text-center mb-8">
				<div class="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
					</svg>
				</div>
				<h2 class="text-2xl font-bold text-gray-900 mb-2">Dashboard Access</h2>
				<p class="text-gray-600">Masukkan kode akses untuk menggunakan dashboard</p>
			</div>

			<!-- Error message -->
			{#if errorMessage}
				<div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
					<div class="flex">
						<svg class="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						<p class="text-red-700 text-sm">{errorMessage}</p>
					</div>
				</div>
			{/if}

			<!-- Form -->
			<form on:submit|preventDefault={handleSubmit} class="space-y-6">
				<div>
					<label for="access-code" class="block text-sm font-medium text-gray-700 mb-2">
						Kode Akses
					</label>
					<input
						id="access-code"
						type="password"
						bind:value={code}
						on:keydown={handleKeydown}
						placeholder="Masukkan kode akses"
						class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
						disabled={isLoading}
						autocomplete="off"
					/>
				</div>

				<button
					type="submit"
					disabled={isLoading || !code.trim()}
					class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center"
				>
					{#if isLoading}
						<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Memverifikasi...
					{:else}
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
						</svg>
						Masuk Dashboard
					{/if}
				</button>
			</form>

			<!-- Help text -->
			<div class="mt-6 text-center">
				<p class="text-sm text-gray-500">
					Hubungi administrator untuk mendapatkan kode akses
				</p>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Additional styling for modal if needed */
</style>
