<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { recruitmentService } from '$lib/services/recruitmentService.js';
	import { applicantService } from '$lib/services/applicantService.js';

	const dispatch = createEventDispatcher();

	// Props dari parent component
	export let showRekapModal = false;

	// State variables
	let isLoading = false;
	let rekapData = {
		monthlyApplicants: [],
		monthlyJobPostings: [],
		applicantsByStatus: [],
		jobsByDepartment: [],
		totalApplicants: 0,
		totalJobPostings: 0,
		currentMonth: '',
		previousMonth: ''
	};

	// Format date function
	function formatDate(dateStr) {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		const hours = String(d.getHours()).padStart(2, '0');
		const minutes = String(d.getMinutes()).padStart(2, '0');
		return `${day}/${month}/${year} ${hours}:${minutes}`;
	}

	// Format status pelamar
	function getStatusLabel(status) {
		const statusMap = {
			'pending': 'Menunggu',
			'reviewed': 'Ditinjau',
			'interview': 'Wawancara',
			'test': 'Tes',
			'accepted': 'Diterima',
			'rejected': 'Ditolak'
		};
		return statusMap[status] || status;
	}

	// Function to open rekap modal
	export async function openRekapModal() {
		isLoading = true;
		showRekapModal = true;

		try {
			// Fetch data pelamar dan lowongan
			const [applicantsResponse, jobPostingsResponse] = await Promise.all([
				applicantService.getAllApplicants(),
				recruitmentService.getAllJobPostings()
			]);

			if (applicantsResponse?.data && jobPostingsResponse?.data) {
				calculateRekapData(applicantsResponse.data, jobPostingsResponse.data);
			}
		} catch (error) {
			console.error('Error fetching data for rekap:', error);
			alert('Gagal mengambil data untuk rekapitulasi');
		} finally {
			isLoading = false;
		}
	}

	function calculateRekapData(applicants, jobPostings) {
		const now = new Date();
		const currentMonth = now.getMonth();
		const currentYear = now.getFullYear();
		
		// Data bulan ini dan bulan lalu
		const thisMonthStart = new Date(currentYear, currentMonth, 1);
		const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
		const lastMonthEnd = new Date(currentYear, currentMonth, 0);
		
		// Filter data berdasarkan tanggal
		const applicantsThisMonth = applicants.filter(app => {
			const appDate = new Date(app.date_created);
			return appDate >= thisMonthStart;
		});
		
		const applicantsLastMonth = applicants.filter(app => {
			const appDate = new Date(app.date_created);
			return appDate >= lastMonthStart && appDate <= lastMonthEnd;
		});
		
		const jobPostingsThisMonth = jobPostings.filter(job => {
			const jobDate = new Date(job.date_created);
			return jobDate >= thisMonthStart;
		});
		
		const jobPostingsLastMonth = jobPostings.filter(job => {
			const jobDate = new Date(job.date_created);
			return jobDate >= lastMonthStart && jobDate <= lastMonthEnd;
		});
		
		// Hitung rekapitulasi per status pelamar
		const statusCounts = {};
		applicantsThisMonth.forEach(app => {
			const status = app.applicationStatus || 'pending';
			statusCounts[status] = (statusCounts[status] || 0) + 1;
		});
		
		// Hitung rekapitulasi per departemen
		const departmentCounts = {};
		jobPostingsThisMonth.forEach(job => {
			const dept = job.department || 'Tidak Diketahui';
			departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
		});
		
		// Update rekapData
		rekapData = {
			monthlyApplicants: [
				{
					month: lastMonthStart.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }),
					count: applicantsLastMonth.length,
					applicants: applicantsLastMonth
				},
				{
					month: thisMonthStart.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }),
					count: applicantsThisMonth.length,
					applicants: applicantsThisMonth
				}
			],
			monthlyJobPostings: [
				{
					month: lastMonthStart.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }),
					count: jobPostingsLastMonth.length,
					jobs: jobPostingsLastMonth
				},
				{
					month: thisMonthStart.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }),
					count: jobPostingsThisMonth.length,
					jobs: jobPostingsThisMonth
				}
			],
			applicantsByStatus: Object.entries(statusCounts).map(([status, count]) => ({
				status: status,
				count: count
			})),
			jobsByDepartment: Object.entries(departmentCounts).map(([department, count]) => ({
				department: department,
				count: count
			})),
			totalApplicants: applicantsThisMonth.length,
			totalJobPostings: jobPostingsThisMonth.length,
			currentMonth: thisMonthStart.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }),
			previousMonth: lastMonthStart.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
		};
	}

	// Auto update untuk bulan berikutnya
	function checkMonthUpdate() {
		const now = new Date();
		const lastUpdate = localStorage.getItem('lastRekapUpdate');
		
		if (!lastUpdate || new Date(lastUpdate).getMonth() !== now.getMonth()) {
			// Update data jika sudah ganti bulan
			localStorage.setItem('lastRekapUpdate', now.toISOString());
			// Trigger refresh data jika modal terbuka
			if (showRekapModal) {
				openRekapModal();
			}
		}
	}

	function closeRekapModal() {
		showRekapModal = false;
		rekapData = {
			monthlyApplicants: [],
			monthlyJobPostings: [],
			applicantsByStatus: [],
			jobsByDepartment: [],
			totalApplicants: 0,
			totalJobPostings: 0,
			currentMonth: '',
			previousMonth: ''
		};
		dispatch('close');
	}

	// Export functions
	function exportToCSV() {
		const csvData = [
			['Rekapitulasi Dashboard Lowongan'],
			['Periode: ' + rekapData.currentMonth],
			[''],
			['Summary'],
			['Total Pelamar Bulan Ini', rekapData.totalApplicants],
			['Total Lowongan Bulan Ini', rekapData.totalJobPostings],
			[''],
			['Status Pelamar'],
			['Status', 'Jumlah'],
			...rekapData.applicantsByStatus.map(item => [getStatusLabel(item.status), item.count]),
			[''],
			['Departemen'],
			['Departemen', 'Jumlah Lowongan'],
			...rekapData.jobsByDepartment.map(item => [item.department, item.count])
		];

		const csvContent = csvData.map(row => row.join(',')).join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', `rekapitulasi-${rekapData.currentMonth.replace(' ', '-')}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function printReport() {
		window.print();
	}

	// Panggil saat component dimount
	onMount(() => {
		checkMonthUpdate();
		// Set interval untuk check setiap hari
		const interval = setInterval(checkMonthUpdate, 24 * 60 * 60 * 1000);
		return () => clearInterval(interval);
	});
</script>

<!-- Modal Rekapitulasi Pelamar dan Lowongan -->
{#if showRekapModal}
	<div
		class="fixed inset-0 flex items-center justify-center z-50"
		on:click={closeRekapModal}
		role="button"
		tabindex="0"
		on:keydown={(e) => e.key === 'Escape' && closeRekapModal()}
	>
		<div
			class="bg-white rounded-lg p-6 max-w-8xl w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto"
			on:click|stopPropagation
			on:keydown={(e) => e.key === 'Enter' && e.stopPropagation()}
			role="dialog"
			tabindex="-1"
			aria-labelledby="rekap-title"
		>
			<div class="flex justify-between items-center mb-6">
				<h3 id="rekap-title" class="text-2xl font-bold text-gray-800">
					📊 Rekapitulasi Pelamar dan Lowongan
				</h3>
				<div class="flex gap-2">
					<button
						type="button"
						class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
						on:click={exportToCSV}
					>
						📥 Export CSV
					</button>
					<button
						type="button"
						class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
						on:click={printReport}
					>
						🖨️ Print
					</button>
				</div>
			</div>

			{#if isLoading}
				<div class="flex justify-center items-center py-8">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					<span class="ml-2 text-gray-600">Memuat data...</span>
				</div>
			{:else}
				<!-- Summary Cards -->
				<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
					<div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
						<h4 class="font-semibold text-blue-800 mb-2">👥 Total Pelamar Bulan Ini</h4>
						<p class="text-2xl font-bold text-blue-600">{rekapData.totalApplicants}</p>
					</div>
					<div class="bg-green-50 p-4 rounded-lg border border-green-200">
						<h4 class="font-semibold text-green-800 mb-2">📋 Total Lowongan Bulan Ini</h4>
						<p class="text-2xl font-bold text-green-600">{rekapData.totalJobPostings}</p>
					</div>
					<div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
						<h4 class="font-semibold text-purple-800 mb-2">📊 Bulan Aktif</h4>
						<p class="text-lg font-bold text-purple-600">{rekapData.currentMonth}</p>
					</div>
					<div class="bg-orange-50 p-4 rounded-lg border border-orange-200">
						<h4 class="font-semibold text-orange-800 mb-2">📈 Perbandingan</h4>
						<p class="text-sm text-orange-600">vs {rekapData.previousMonth}</p>
					</div>
				</div>

				<!-- Rekapitulasi Per Bulan -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
					<!-- Rekapitulasi Pelamar Per Bulan -->
					<div>
						<h4 class="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">
							👥 Rekapitulasi Pelamar Per Bulan
						</h4>
						{#if rekapData.monthlyApplicants.length > 0}
							<div class="overflow-x-auto">
								<table class="w-full border-collapse border border-gray-300">
									<thead>
										<tr class="bg-gray-100">
											<th class="border border-gray-300 px-4 py-2 text-left">Bulan</th>
											<th class="border border-gray-300 px-4 py-2 text-center">Jumlah Pelamar</th>
										</tr>
									</thead>
									<tbody>
										{#each rekapData.monthlyApplicants as month}
											<tr class="hover:bg-gray-50">
												<td class="border border-gray-300 px-4 py-2 font-medium">
													{month.month}
												</td>
												<td class="border border-gray-300 px-4 py-2 text-center">
													{month.count} pelamar
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:else}
							<p class="text-gray-500 text-center py-4">Tidak ada data pelamar</p>
						{/if}
					</div>

					<!-- Rekapitulasi Lowongan Per Bulan -->
					<div>
						<h4 class="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">
							📋 Rekapitulasi Lowongan Per Bulan
						</h4>
						{#if rekapData.monthlyJobPostings.length > 0}
							<div class="overflow-x-auto">
								<table class="w-full border-collapse border border-gray-300">
									<thead>
										<tr class="bg-gray-100">
											<th class="border border-gray-300 px-4 py-2 text-left">Bulan</th>
											<th class="border border-gray-300 px-4 py-2 text-center">Jumlah Lowongan</th>
										</tr>
									</thead>
									<tbody>
										{#each rekapData.monthlyJobPostings as month}
											<tr class="hover:bg-gray-50">
												<td class="border border-gray-300 px-4 py-2 font-medium">
													{month.month}
												</td>
												<td class="border border-gray-300 px-4 py-2 text-center">
													{month.count} lowongan
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:else}
							<p class="text-gray-500 text-center py-4">Tidak ada data lowongan</p>
						{/if}
					</div>
				</div>

				<!-- Status Pelamar dan Departemen -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
					<!-- Status Pelamar -->
					<div>
						<h4 class="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">
							📊 Status Pelamar Bulan Ini
						</h4>
						{#if rekapData.applicantsByStatus.length > 0}
							<div class="overflow-x-auto">
								<table class="w-full border-collapse border border-gray-300">
									<thead>
										<tr class="bg-gray-100">
											<th class="border border-gray-300 px-4 py-2 text-left">Status</th>
											<th class="border border-gray-300 px-4 py-2 text-center">Jumlah</th>
										</tr>
									</thead>
									<tbody>
										{#each rekapData.applicantsByStatus as status}
											<tr class="hover:bg-gray-50">
												<td class="border border-gray-300 px-4 py-2">
													<span
														class="px-2 py-1 rounded-full text-xs font-semibold"
														class:bg-yellow-200={status.status === 'pending'}
														class:text-yellow-800={status.status === 'pending'}
														class:bg-blue-200={status.status === 'reviewed'}
														class:text-blue-800={status.status === 'reviewed'}
														class:bg-purple-200={status.status === 'interview'}
														class:text-purple-800={status.status === 'interview'}
														class:bg-orange-200={status.status === 'test'}
														class:text-orange-800={status.status === 'test'}
														class:bg-green-200={status.status === 'accepted'}
														class:text-green-800={status.status === 'accepted'}
														class:bg-red-200={status.status === 'rejected'}
														class:text-red-800={status.status === 'rejected'}
													>
														{getStatusLabel(status.status)}
													</span>
												</td>
												<td class="border border-gray-300 px-4 py-2 text-center">
													{status.count}
												</td>
											</tr>
										{/each}
									</tbody>
									<tfoot>
										<tr class="bg-blue-100 font-bold">
											<td class="border border-gray-300 px-4 py-2">Total</td>
											<td class="border border-gray-300 px-4 py-2 text-center">
												{rekapData.applicantsByStatus.reduce((sum, status) => sum + status.count, 0)}
											</td>
										</tr>
									</tfoot>
								</table>
							</div>
						{:else}
							<p class="text-gray-500 text-center py-4">Tidak ada data status pelamar</p>
						{/if}
					</div>
					
					<!-- Lowongan Per Departemen -->
					<div>
						<h4 class="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">
							🏢 Lowongan Per Departemen Bulan Ini
						</h4>
						{#if rekapData.jobsByDepartment.length > 0}
							<div class="overflow-x-auto">
								<table class="w-full border-collapse border border-gray-300">
									<thead>
										<tr class="bg-gray-100">
											<th class="border border-gray-300 px-4 py-2 text-left">Departemen</th>
											<th class="border border-gray-300 px-4 py-2 text-center">Jumlah Lowongan</th>
										</tr>
									</thead>
									<tbody>
										{#each rekapData.jobsByDepartment as dept}
											<tr class="hover:bg-gray-50">
												<td class="border border-gray-300 px-4 py-2 font-medium">
													{dept.department}
												</td>
												<td class="border border-gray-300 px-4 py-2 text-center">
													{dept.count}
												</td>
											</tr>
										{/each}
									</tbody>
									<tfoot>
										<tr class="bg-green-100 font-bold">
											<td class="border border-gray-300 px-4 py-2">Total</td>
											<td class="border border-gray-300 px-4 py-2 text-center">
												{rekapData.jobsByDepartment.reduce((sum, dept) => sum + dept.count, 0)}
											</td>
										</tr>
									</tfoot>
								</table>
							</div>
						{:else}
							<p class="text-gray-500 text-center py-4">Tidak ada data departemen</p>
						{/if}
					</div>
				</div>

				<!-- Detail Pelamar Bulan Ini -->
				{#if rekapData.monthlyApplicants.length > 0 && rekapData.monthlyApplicants[1]?.applicants?.length > 0}
					<div class="mb-8">
						<h4 class="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">
							📋 Detail Pelamar {rekapData.currentMonth}
						</h4>
						<div class="overflow-x-auto">
							<table class="w-full border-collapse border border-gray-300 text-sm">
								<thead>
									<tr class="bg-gray-100">
										<th class="border border-gray-300 px-2 py-1 text-left">Tanggal</th>
										<th class="border border-gray-300 px-2 py-1 text-left">Nama</th>
										<th class="border border-gray-300 px-2 py-1 text-left">Email</th>
										<th class="border border-gray-300 px-2 py-1 text-left">ID Lowongan</th>
										<th class="border border-gray-300 px-2 py-1 text-center">Status</th>
									</tr>
								</thead>
								<tbody>
									{#each rekapData.monthlyApplicants[1].applicants as applicant}
										<tr class="hover:bg-gray-50">
											<td class="border border-gray-300 px-2 py-1">
												{formatDate(applicant.date_created)}
											</td>
											<td class="border border-gray-300 px-2 py-1 font-medium">
												{applicant.fullName || '-'}
											</td>
											<td class="border border-gray-300 px-2 py-1">
												{applicant.email || '-'}
											</td>
											<td class="border border-gray-300 px-2 py-1">
												{applicant.appliedJobId || '-'}
											</td>
											<td class="border border-gray-300 px-2 py-1 text-center">
												<span
													class="px-2 py-1 rounded-full text-xs font-semibold"
													class:bg-yellow-200={applicant.applicationStatus === 'pending'}
													class:text-yellow-800={applicant.applicationStatus === 'pending'}
													class:bg-blue-200={applicant.applicationStatus === 'reviewed'}
													class:text-blue-800={applicant.applicationStatus === 'reviewed'}
													class:bg-purple-200={applicant.applicationStatus === 'interview'}
													class:text-purple-800={applicant.applicationStatus === 'interview'}
													class:bg-orange-200={applicant.applicationStatus === 'test'}
													class:text-orange-800={applicant.applicationStatus === 'test'}
													class:bg-green-200={applicant.applicationStatus === 'accepted'}
													class:text-green-800={applicant.applicationStatus === 'accepted'}
													class:bg-red-200={applicant.applicationStatus === 'rejected'}
													class:text-red-800={applicant.applicationStatus === 'rejected'}
												>
													{getStatusLabel(applicant.applicationStatus || 'pending')}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}

				<!-- Detail Lowongan Bulan Ini -->
				{#if rekapData.monthlyJobPostings.length > 0 && rekapData.monthlyJobPostings[1]?.jobs?.length > 0}
					<div class="mb-8">
						<h4 class="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">
							📋 Detail Lowongan {rekapData.currentMonth}
						</h4>
						<div class="overflow-x-auto">
							<table class="w-full border-collapse border border-gray-300 text-sm">
								<thead>
									<tr class="bg-gray-100">
										<th class="border border-gray-300 px-2 py-1 text-left">Tanggal</th>
										<th class="border border-gray-300 px-2 py-1 text-left">Judul</th>
										<th class="border border-gray-300 px-2 py-1 text-left">Departemen</th>
										<th class="border border-gray-300 px-2 py-1 text-left">Lokasi</th>
										<th class="border border-gray-300 px-2 py-1 text-center">Status</th>
									</tr>
								</thead>
								<tbody>
									{#each rekapData.monthlyJobPostings[1].jobs as job}
										<tr class="hover:bg-gray-50">
											<td class="border border-gray-300 px-2 py-1">
												{formatDate(job.date_created)}
											</td>
											<td class="border border-gray-300 px-2 py-1 font-medium">
												{job.title || '-'}
											</td>
											<td class="border border-gray-300 px-2 py-1">
												{job.department || '-'}
											</td>
											<td class="border border-gray-300 px-2 py-1">
												{job.location || '-'}
											</td>
											<td class="border border-gray-300 px-2 py-1 text-center">
												<span
													class="px-2 py-1 rounded-full text-xs font-semibold"
													class:bg-green-200={job.status === 'active'}
													class:text-green-800={job.status === 'active'}
													class:bg-red-200={job.status === 'inactive'}
													class:text-red-800={job.status === 'inactive'}
													class:bg-blue-200={!job.status}
													class:text-blue-800={!job.status}
												>
													{job.status === 'active' ? 'Aktif' : job.status === 'inactive' ? 'Tidak Aktif' : 'Aktif'}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}
			{/if}

			<div class="flex justify-end mt-6 pt-4 border-t border-gray-200">
				<button
					type="button"
					class="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
					on:click={closeRekapModal}
				>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}
