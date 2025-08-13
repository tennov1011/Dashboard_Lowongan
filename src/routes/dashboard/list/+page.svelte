<script>
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	// Import the date formatter utility
	import { formatDate } from '$lib/utils/dateUtils';

	/** @type {import('./$types').PageData} */
	export let data;
	/** @type {import('./$types').ActionData} */
	export let form;

	// Filter state
	let showActive = true;
	let jobPostings = [];

	$: {
		// Debug applicant count untuk setiap job
		if (data.jobPostings) {
			data.jobPostings.forEach((job) => {
				console.log(`Client - Job ${job.id} (${job.title}): ${job.applicantCount} applicants`);
			});
		}

		// Update job postings based on filter
		if (showActive) {
			jobPostings = data.activeJobPostings;
		} else {
			jobPostings = data.inactiveJobPostings;
		}
	}

	// Modal states
	let showDeleteConfirmModal = false;
	let selectedJobId = null;

	// Show delete confirmation modal
	function confirmDelete(id) {
		selectedJobId = id;
		showDeleteConfirmModal = true;
	}

	// Handle delete with enhance
	const handleDelete = () => {
		return async ({ result, update }) => {
			if (result.type === 'success') {
				showDeleteConfirmModal = false;
				// Reload the page to show updated data
				window.location.reload();
			} else if (result.type === 'failure') {
				console.error('Delete failed:', result.data);
				showDeleteConfirmModal = false;
			}
		};
	};

	// Check if job is expired by deadline
	function isExpiredByDeadline(deadline) {
		return new Date(deadline) <= new Date();
	}

	// Get effective status berdasarkan status field dan deadline
	function getEffectiveStatus(job) {
		// Sekarang status dalam database sudah terupdate otomatis untuk job yang expired
		// Jadi kita hanya perlu mengecek field status dari database
		if (job.status === 'inactive') {
			return 'inactive';
		}

		// Untuk job yang masih active, cek deadline sebagai backup
		if (isExpiredByDeadline(job.deadline)) {
			return 'expired';
		}

		// Default ke active
		return 'active';
	}

	// Format requirements for display
	function formatRequirements(requirements) {
		if (typeof requirements === 'string') {
			return requirements
				.split('\n')
				.map((item) => item.trim())
				.filter((item) => item.length > 0);
		}
		if (Array.isArray(requirements)) {
			return requirements.filter((item) => item && item.trim().length > 0);
		}
		return [];
	}

	// Count applicants
	function getApplicantCount(applications) {
		if (Array.isArray(applications)) {
			return applications.length;
		}
		return 0;
	}

	// Handle status toggle
	async function handleStatusToggle(jobId, currentStatus) {
		// Buat form dan submit
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '?/toggleStatus';

		const idInput = document.createElement('input');
		idInput.type = 'hidden';
		idInput.name = 'id';
		idInput.value = jobId;

		const statusInput = document.createElement('input');
		statusInput.type = 'hidden';
		statusInput.name = 'currentStatus';
		statusInput.value = currentStatus;

		form.appendChild(idInput);
		form.appendChild(statusInput);
		document.body.appendChild(form);

		// Submit form and reload page after successful submit
		form.addEventListener('submit', function(e) {
			e.preventDefault();
			
			const formData = new FormData(form);
			
			fetch('?/toggleStatus', {
				method: 'POST',
				body: formData,
				headers: {
					'x-sveltekit-action': 'true'
				}
			}).then(response => {
				if (response.ok) {
					window.location.reload();
				}
			}).catch(error => {
				console.error('Error toggling status:', error);
			});
		});

		form.requestSubmit();
		document.body.removeChild(form);
	}

	function getStatusColor(status) {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-700';
			case 'expired':
				return 'bg-yellow-100 text-yellow-700';
			case 'inactive':
				return 'bg-gray-100 text-gray-700';
			default:
				return 'bg-gray-100 text-gray-700';
		}
	}

	function getStatusText(status) {
		switch (status) {
			case 'active':
				return 'Aktif';
			case 'expired':
				return 'Berakhir';
			case 'inactive':
				return 'Nonaktif';
			default:
				return 'Unknown';
		}
	}
</script>

<svelte:head>
	<title>Daftar Lowongan Pekerjaan</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Header Section -->
	<div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Kelola Lowongan</h1>
			<p class="mt-2 text-gray-600">Kelola dan pantau semua lowongan pekerjaan</p>
		</div>

		<div class="mt-4 flex items-center space-x-4 sm:mt-0">
			<!-- Filter Toggle -->
			<div class="flex items-center rounded-xl border border-gray-200 bg-white p-1">
				<button
					class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {showActive
						? 'bg-blue-100 text-blue-700'
						: 'text-gray-600 hover:text-gray-900'}"
					on:click={() => (showActive = true)}
				>
					Aktif ({data.activeJobPostings?.length || 0})
				</button>
				<button
					class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {!showActive
						? 'bg-gray-100 text-gray-700'
						: 'text-gray-600 hover:text-gray-900'}"
					on:click={() => (showActive = false)}
				>
					Nonaktif ({data.inactiveJobPostings?.length || 0})
				</button>
			</div>

			<!-- Add New Button -->
			<a
				href="/dashboard/add"
				class="flex items-center rounded-xl bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mr-2 h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Tambah Lowongan
			</a>
		</div>
	</div>

	<!-- Status Messages -->
	{#if data.status === 'error'}
		<div class="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
			<div class="flex">
				<svg
					class="mt-0.5 mr-3 h-5 w-5 text-red-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
				<div>
					<p class="font-medium">Error</p>
					<p class="text-sm">{data.error || 'Failed to load job postings.'}</p>
				</div>
			</div>
		</div>
	{/if}

	{#if form?.status === 'error'}
		<div class="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
			<div class="flex">
				<svg
					class="mt-0.5 mr-3 h-5 w-5 text-red-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
				<div>
					<p class="font-medium">Error</p>
					<p class="text-sm">{form.message}</p>
				</div>
			</div>
		</div>
	{/if}

	{#if form?.status === 'success'}
		<div
			class="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700"
			role="alert"
		>
			<div class="flex">
				<svg
					class="mt-0.5 mr-3 h-5 w-5 text-green-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
				<div>
					<p class="font-medium">Berhasil</p>
					<p class="text-sm">{form.message}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Job Postings Grid -->
	{#if jobPostings && jobPostings.length > 0}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
			{#each jobPostings as job}
				{@const effectiveStatus = getEffectiveStatus(job)}
				<div
					class="rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
				>
					<!-- Card Header -->
					<div class="p-6 pb-4">
						<div class="mb-3 flex items-start justify-between">
							<h3 class="line-clamp-2 text-lg font-semibold text-gray-900">{job.title}</h3>
							<span
								class="rounded-full px-3 py-1 text-xs font-medium {getStatusColor(
									effectiveStatus
								)} ml-2 flex-shrink-0"
							>
								{getStatusText(effectiveStatus)}
							</span>
						</div>

						<div class="mb-4 space-y-2">
							<div class="flex items-center text-sm text-gray-600">
								<svg
									class="mr-2 h-4 w-4 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0V9a1 1 0 011-1h4a1 1 0 011 1v12"
									></path>
								</svg>
								{job.department}
							</div>

							<div class="flex items-center text-sm text-gray-600">
								<svg
									class="mr-2 h-4 w-4 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2"
									></path>
								</svg>
								Deadline: {formatDate(job.deadline)}
							</div>

							<div class="flex items-center text-sm text-gray-600">
								<svg
									class="mr-2 h-4 w-4 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
									></path>
								</svg>
								{job.applicantCount || 0} pelamar
							</div>
						</div>
					</div>

					<!-- Card Actions -->
					<div class="px-6 pb-6">
						<div class="flex items-center space-x-2">
							<a
								href="/dashboard/applications?jobId={job.id}"
								class="flex-1 rounded-xl bg-blue-50 px-3 py-2 text-center text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
							>
								Lihat Pelamar
							</a>

							<button
								on:click={() => handleStatusToggle(job.id, effectiveStatus)}
								class="rounded-xl px-3 py-2 text-sm font-medium transition-colors {effectiveStatus ===
								'active'
									? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
									: 'bg-green-50 text-green-700 hover:bg-green-100'}"
							>
								{effectiveStatus === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
							</button>

							<button
								on:click={() => confirmDelete(job.id)}
								class="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
							>
								Hapus
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Empty State -->
		<div class="py-12 text-center">
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
				<svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V8a2 2 0 00-2-2"
					></path>
				</svg>
			</div>
			<h3 class="mb-2 text-lg font-medium text-gray-900">
				{showActive ? 'Tidak ada lowongan aktif' : 'Tidak ada lowongan nonaktif'}
			</h3>
			<p class="mb-6 text-gray-600">
				{showActive
					? 'Belum ada lowongan yang aktif saat ini.'
					: 'Tidak ada lowongan yang nonaktif atau berakhir.'}
			</p>
			{#if showActive}
				<a
					href="/dashboard/add"
					class="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
				>
					<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"
						></path>
					</svg>
					Buat Lowongan Pertama
				</a>
			{/if}
		</div>
	{/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirmModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-grey-800 bg-opacity-50 backdrop-blur">
		<div class="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
			<div class="text-center">
				<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
					<svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"
						></path>
					</svg>
				</div>
				<h3 class="mb-2 text-lg font-medium text-gray-900">Hapus Lowongan</h3>
				<p class="mb-6 text-gray-600">
					Apakah Anda yakin ingin menghapus lowongan ini? Tindakan ini tidak dapat dibatalkan.
				</p>

				<div class="flex space-x-3">
					<button
						on:click={() => (showDeleteConfirmModal = false)}
						class="flex-1 rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
					>
						Batal
					</button>
					<form method="POST" action="?/delete" use:enhance={handleDelete} class="flex-1">
						<input type="hidden" name="id" value={selectedJobId} />
						<button
							type="submit"
							class="w-full rounded-xl bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
						>
							Hapus
						</button>
					</form>
				</div>
			</div>
		</div>
	</div>
{/if}
