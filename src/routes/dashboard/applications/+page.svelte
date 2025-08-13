<script>
	import { formatDate } from '$lib/utils/dateUtils';

	/** @type {import('./$types').PageData} */
	export let data;
	/** @type {import('./$types').ActionData} */
	export let form;

	$: selectedJob = data.selectedJob;
	$: applications = data.applications || [];
	$: jobPostings = data.jobPostings || [];

	// Helper function to get status color
	function getStatusColor(status) {
		switch (status) {
			case 'pending': return 'bg-yellow-100 text-yellow-700';
			case 'reviewed': return 'bg-blue-100 text-blue-700';
			case 'interview': return 'bg-purple-100 text-purple-700';
			case 'test': return 'bg-indigo-100 text-indigo-700';
			case 'accepted': return 'bg-green-100 text-green-700';
			case 'rejected': return 'bg-red-100 text-red-700';
			default: return 'bg-gray-100 text-gray-700';
		}
	}

	// Helper function to get status text
	function getStatusText(status) {
		switch (status) {
			case 'pending': return 'Menunggu';
			case 'reviewed': return 'Direview';
			case 'interview': return 'Wawancara';
			case 'test': return 'Tes';
			case 'accepted': return 'Diterima';
			case 'rejected': return 'Ditolak';
			default: return status || 'Unknown';
		}
	}

	// Format requirements for display
	function formatRequirements(requirements) {
		if (typeof requirements === 'string') {
			// Jika requirements adalah string, split berdasarkan newline
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

	// Function to check if job is inactive
	// Jobs are automatically marked as inactive when they pass their deadline
	function isJobInactive(job) {
		return job.status === 'inactive';
	}
</script>

<svelte:head>
	<title>Job Applications</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	{#if !selectedJob}
		<!-- Job Selection Screen -->
		<div>
			<div class="mb-8">
				<h1 class="text-3xl font-bold text-gray-900 mb-2">Pilih Lowongan</h1>
				<p class="text-gray-600">Pilih lowongan untuk melihat daftar pelamar</p>
			</div>

			{#if jobPostings.length === 0}
				<div class="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
					<div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V8a2 2 0 00-2-2"></path>
						</svg>
					</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">Belum ada lowongan</h3>
					<p class="text-gray-600 mb-6">Belum ada lowongan yang tersedia saat ini.</p>
					<a href="/dashboard/add" class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl transition-colors">
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
						</svg>
						Buat Lowongan
					</a>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each jobPostings as job}
						<a
							href={`/dashboard/applications?jobId=${job.id}`}
							class="block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
						>
							<div class="flex items-start justify-between mb-4">
								<h3 class="font-semibold text-gray-900 text-lg line-clamp-2 group-hover:text-blue-600 transition-colors" class:line-through={isJobInactive(job)}>
									{job.title}
								</h3>
								<span class="px-3 py-1 text-xs font-medium rounded-full {job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'} ml-2 flex-shrink-0">
									{job.status === 'active' ? 'Aktif' : 'Nonaktif'}
								</span>
							</div>
							
							<div class="space-y-2 mb-4">
								<div class="flex items-center text-sm text-gray-600">
									<svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0V9a1 1 0 011-1h4a1 1 0 011 1v12"></path>
									</svg>
									{job.department}
								</div>
								
								<div class="flex items-center text-sm text-gray-600">
									<svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2"></path>
									</svg>
									Deadline: {formatDate(job.deadline)}
								</div>
							</div>

							<div class="flex items-center justify-between">
								<div class="flex items-center text-sm font-medium text-blue-600">
									<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
									</svg>
									{job.applicantCount || 0} pelamar
								</div>
								<div class="flex items-center text-blue-600 group-hover:translate-x-1 transition-transform">
									<span class="text-sm font-medium mr-1">Lihat</span>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
									</svg>
								</div>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<!-- Job Applications View -->
		<div>
			<!-- Header with navigation -->
			<div class="mb-8">
				<div class="flex items-center mb-4">
					<a href="/dashboard/applications" class="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors" aria-label="Kembali ke daftar aplikasi">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
						</svg>
					</a>
					<div>
						<h1 class="text-3xl font-bold text-gray-900">{selectedJob.title}</h1>
						<p class="text-gray-600 mt-1">Kelola pelamar untuk posisi ini</p>
					</div>
				</div>
			</div>

			<!-- Status Messages -->
			{#if form?.status === 'success'}
				<div class="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6" role="alert">
					<div class="flex">
						<svg class="w-5 h-5 text-green-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						<div>
							<p class="font-medium">Berhasil</p>
							<p class="text-sm">{form.message}</p>
							{#if form.message && form.message.includes('accepted')}
								<p class="text-sm mt-1">💼 Pelamar yang diterima akan otomatis ditambahkan ke database register sebagai karyawan baru.</p>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			{#if form?.status === 'error'}
				<div class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6" role="alert">
					<div class="flex">
						<svg class="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						<div>
							<p class="font-medium">Error</p>
							<p class="text-sm">{form.error || form.message}</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Job Details Card -->
			<div class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
				<div class="flex items-center justify-between border-b border-gray-200 px-6 py-5">
					<h2 class="text-lg font-semibold text-gray-900">Detail Lowongan</h2>
					<a
						href={`/dashboard/applications/edit/${selectedJob.id}`}
						class="inline-flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-xl transition-colors"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13z" />
						</svg>
						Edit Lowongan
					</a>
				</div>
				<div class="p-6">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<div>
							<dt class="text-sm font-medium text-gray-500 mb-1">Posisi</dt>
							<dd class="text-sm text-gray-900 font-medium">{selectedJob.title}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500 mb-1">Departemen</dt>
							<dd class="text-sm text-gray-900">{selectedJob.department}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500 mb-1">Lokasi</dt>
							<dd class="text-sm text-gray-900">{selectedJob.location}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500 mb-1">Gaji</dt>
							<dd class="text-sm text-gray-900">{selectedJob.salary || 'Tidak disebutkan'}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500 mb-1">Tipe Pekerjaan</dt>
							<dd class="text-sm text-gray-900">
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
									{selectedJob.employment_type || 'Tidak disebutkan'}
								</span>
							</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500 mb-1">Deadline</dt>
							<dd class="text-sm text-gray-900">{formatDate(selectedJob.deadline)}</dd>
						</div>
					</div>
					
					<div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<dt class="text-sm font-medium text-gray-500 mb-2">Deskripsi Pekerjaan</dt>
							<dd class="text-sm text-gray-900 whitespace-pre-wrap">{selectedJob.description}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500 mb-2">Persyaratan</dt>
							<dd class="text-sm text-gray-900">
								{#if selectedJob.requirements}
									<ul class="list-disc list-inside space-y-1">
										{#each formatRequirements(selectedJob.requirements) as requirement}
											<li>{requirement}</li>
										{/each}
									</ul>
								{:else}
									<span class="text-gray-500">Tidak ada persyaratan khusus</span>
								{/if}
							</dd>
						</div>
					</div>
				</div>
			</div>

			<!-- Applications List -->
			{#if applications.length > 0}
				<div class="bg-white rounded-2xl shadow-sm border border-gray-100">
					<div class="border-b border-gray-200 px-6 py-5">
						<h2 class="text-lg font-semibold text-gray-900">
							Daftar Pelamar
							<span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
								{applications.length} pelamar
							</span>
						</h2>
					</div>
					<div class="overflow-x-auto">
						<table class="min-w-full">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Pelamar</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengalaman</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pendidikan</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each applications as application}
									<tr class="hover:bg-gray-50">
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="text-sm font-medium text-gray-900">{application.fullName || 'Nama tidak tersedia'}</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="text-sm text-gray-900">{application.email || '-'}</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<span class="px-3 py-1 text-xs font-medium rounded-full {getStatusColor(application.applicationStatus)}">
												{getStatusText(application.applicationStatus)}
											</span>
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{application.workExperienceYears || 0} tahun
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{application.highestEducation || '-'}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{formatDate(application.date_created)}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm">
											<div class="flex items-center space-x-2">
												{#if application.resumeFileUrl}
													<a
														href={application.resumeFileUrl}
														target="_blank"
														rel="noopener noreferrer"
														class="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
													>
														<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
														</svg>
														CV
													</a>
												{/if}
												
												<a
													href={`/dashboard/candidates/${application.id}`}
													class="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
												>
													Detail
												</a>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{:else}
				<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
					<div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
					</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">Belum ada pelamar</h3>
					<p class="text-gray-600">Belum ada yang melamar untuk posisi ini.</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
