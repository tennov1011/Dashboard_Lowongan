<script>
	import { onMount } from 'svelte';
	import { recruitmentService } from '$lib/services/recruitmentService.js';
	import { applicantService } from '$lib/services/applicantService.js';
	import RekapitulasiLaporan from '$lib/components/RekapitulasiLaporan.svelte';

	let stats = {
		totalJobs: 0,
		activeJobs: 0,
		totalApplications: 0,
		pendingApplications: 0
	};
	let isLoading = true;
	let recentJobs = [];
	let recentApplications = [];
	let showRekapModal = false;
	let rekapitulasiComponent;

	onMount(async () => {
		await loadDashboardData();
	});

	async function loadDashboardData() {
		try {
			isLoading = true;

			// Load job postings
			const [allJobsResponse, activeJobsResponse] = await Promise.all([
				recruitmentService.getAllJobPostings(),
				recruitmentService.getActiveJobPostings()
			]);

			const allJobs = allJobsResponse?.data || [];
			const activeJobs = activeJobsResponse?.data || [];

			// Get applicant counts
			const applicantCounts = await applicantService.getApplicantCounts();

			// Calculate statistics
			const totalApplications = Object.values(applicantCounts).reduce(
				(sum, count) => sum + count,
				0
			);

			stats = {
				totalJobs: allJobs.length,
				activeJobs: activeJobs.length,
				totalApplications: totalApplications,
				pendingApplications: Math.floor(totalApplications * 0.6) // Estimate pending applications
			};

			// Get recent jobs (latest 5)
			recentJobs = allJobs.slice(0, 5).map((job) => ({
				...job,
				applicantCount: applicantCounts[job.id] || 0
			}));
		} catch (error) {
			console.error('Error loading dashboard data:', error);
		} finally {
			isLoading = false;
		}
	}

	function formatDate(dateString) {
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getJobStatus(job) {
		if (job.status === 'inactive') return 'inactive';
		if (new Date(job.deadline) <= new Date()) return 'expired';
		return 'active';
	}

	function getStatusColor(status) {
		switch (status) {
			case 'active':
				return 'text-green-600 bg-green-100';
			case 'expired':
				return 'text-yellow-600 bg-yellow-100';
			case 'inactive':
				return 'text-gray-600 bg-gray-100';
			default:
				return 'text-gray-600 bg-gray-100';
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

	// Function untuk membuka modal rekapitulasi
	function openRekapModal() {
		if (rekapitulasiComponent) {
			rekapitulasiComponent.openRekapModal();
		}
	}
</script>

<svelte:head>
	<title>Dashboard - HRD System</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Header dengan tombol rekapitulasi -->
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Dashboard HRD</h1>
			<p class="mt-2 text-gray-600">Kelola lowongan kerja dan pelamar</p>
		</div>
		<button
			type="button"
			class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
			on:click={openRekapModal}
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
			</svg>
			📊 Lihat Rekapitulasi
		</button>
	</div>

	{#if isLoading}
		<!-- Loading State -->
		<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			{#each Array(4) as _}
				<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
					<div class="animate-pulse">
						<div class="mb-4 h-4 w-3/4 rounded bg-gray-200"></div>
						<div class="h-8 w-1/2 rounded bg-gray-200"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Statistics Cards -->
		<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<!-- Total Jobs -->
			<div
				class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
			>
				<div class="flex items-center">
					<div class="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
						<svg
							class="h-6 w-6 text-blue-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V8a2 2 0 00-2-2"
							></path>
						</svg>
					</div>
					<div>
						<p class="text-sm font-medium text-gray-600">Total Lowongan</p>
						<p class="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
					</div>
				</div>
			</div>

			<!-- Active Jobs -->
			<div
				class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
			>
				<div class="flex items-center">
					<div class="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
						<svg
							class="h-6 w-6 text-green-600"
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
					</div>
					<div>
						<p class="text-sm font-medium text-gray-600">Lowongan Aktif</p>
						<p class="text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
					</div>
				</div>
			</div>

			<!-- Total Applications -->
			<div
				class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
			>
				<div class="flex items-center">
					<div class="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
						<svg
							class="h-6 w-6 text-purple-600"
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
					</div>
					<div>
						<p class="text-sm font-medium text-gray-600">Total Pelamar</p>
						<p class="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
					</div>
				</div>
			</div>

			<!-- Pending Applications -->
			<div
				class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
			>
				<div class="flex items-center">
					<div class="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
						<svg
							class="h-6 w-6 text-yellow-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
					</div>
					<div>
						<p class="text-sm font-medium text-gray-600">Menunggu Review</p>
						<p class="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Quick Actions -->
	<div class="mb-8 space-y-8">
		<!-- Quick Actions Card -->
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Aksi Cepat</h2>
			<div class="grid grid-cols-2 gap-4">
				<a
					href="/dashboard/add"
					class="group flex items-center rounded-xl bg-blue-50 p-4 transition-colors hover:bg-blue-100"
				>
					<div
						class="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 transition-transform group-hover:scale-105"
					>
						<svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							></path>
						</svg>
					</div>
					<span class="text-sm font-medium text-gray-900">Tambah Lowongan</span>
				</a>

				<a
					href="/dashboard/list"
					class="group flex items-center rounded-xl bg-green-50 p-4 transition-colors hover:bg-green-100"
				>
					<div
						class="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 transition-transform group-hover:scale-105"
					>
						<svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
							></path>
						</svg>
					</div>
					<span class="text-sm font-medium text-gray-900">Kelola Lowongan</span>
				</a>

				<a
					href="/dashboard/applications"
					class="group flex items-center rounded-xl bg-purple-50 p-4 transition-colors hover:bg-purple-100"
				>
					<div
						class="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600 transition-transform group-hover:scale-105"
					>
						<svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							></path>
						</svg>
					</div>
					<span class="text-sm font-medium text-gray-900">Review Aplikasi</span>
				</a>

				<a
					href="/dashboard/candidates"
					class="group flex items-center rounded-xl bg-yellow-50 p-4 transition-colors hover:bg-yellow-100"
				>
					<div
						class="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-600 transition-transform group-hover:scale-105"
					>
						<svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
							></path>
						</svg>
					</div>
					<span class="text-sm font-medium text-gray-900">Data Kandidat</span>
				</a>
			</div>
		</div>

		<!-- Recent Jobs Card -->
		<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900">Lowongan Terbaru</h2>
				<a href="/dashboard/list" class="text-sm font-medium text-blue-600 hover:text-blue-700">
					Lihat Semua
				</a>
			</div>
			<div class="space-y-3">
				{#if recentJobs.length === 0}
					<p class="text-sm text-gray-500">Belum ada lowongan</p>
				{:else}
					{#each recentJobs as job}
						{@const status = getJobStatus(job)}
						<div
							class="flex items-center justify-between rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100"
						>
							<div class="flex-1">
								<h3 class="text-sm font-medium text-gray-900">{job.title}</h3>
								<p class="text-xs text-gray-600">
									{job.department} • {formatDate(job.date_created)}
								</p>
							</div>
							<div class="flex items-center space-x-2">
								<span class="text-xs font-medium text-gray-600">
									{job.applicantCount} pelamar
								</span>
								<span class="rounded-lg px-2 py-1 text-xs font-medium {getStatusColor(status)}">
									{getStatusText(status)}
								</span>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Komponen Rekapitulasi -->
<RekapitulasiLaporan 
	bind:this={rekapitulasiComponent}
	bind:showRekapModal
	on:close={() => showRekapModal = false}
/>
