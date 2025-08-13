<script>
    /** @type {import('./$types').PageData} */
    export let data;
    
    // Destructure the data
    const { applicants, jobPostings, error } = data;
    
    // Search and filter functionality
    let searchQuery = '';
    let selectedJobId = '';
    let selectedStatus = '';
    let selectedSource = ''; // New filter for howDidYouHear
    let filteredApplicants = [];
    
    // Create a mapping of job IDs to job titles and status
    let jobTitleMap = new Map();
    let jobStatusMap = new Map();
    
    // Reactive statement to update maps when data changes
    $: {
        jobTitleMap = new Map();
        jobStatusMap = new Map();
        if (jobPostings && jobPostings.length > 0) {
            jobPostings.forEach(job => {
                // Store with string ID for consistent comparison
                jobTitleMap.set(String(job.id), job.title);
                jobStatusMap.set(String(job.id), job.status || 'active');
            });
        }
    }
    
    // Get unique sources (howDidYouHear) and count applicants per source
    $: sources = applicants && applicants.length > 0 
        ? [...new Set(applicants
            .filter(app => app.howDidYouHear)
            .map(app => app.howDidYouHear))]
        : [];
        
    // Count applicants per source
    $: sourceCounts = applicants && applicants.length > 0 
        ? applicants.reduce((acc, app) => {
            const source = app.howDidYouHear || 'unknown';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
          }, {})
        : {};
    
    // Function to get job title from job ID
    function getJobTitle(jobId) {
        if (!jobId) return 'Tidak ada posisi';
        
        // Convert jobId to string for consistent comparison
        const stringJobId = String(jobId);
        
        // Get title directly from Map - more efficient
        const title = jobTitleMap.get(stringJobId);
        
        // Return title if found, otherwise provide a better fallback
        return title || `Posisi tidak ditemukan (ID: ${jobId})`;
    }
    
    // Function to check if job is inactive
    function isJobInactive(jobId) {
        if (!jobId) return false;
        const stringJobId = String(jobId);
        return jobStatusMap.get(stringJobId) === 'inactive';
    }
    
    // Initialize filteredApplicants based on search query, selected job and status
    $: {
        if (applicants && applicants.length > 0) {
            // Filter by selected job if one is selected
            let filtered = applicants;
            if (selectedJobId) {
                filtered = filtered.filter(applicant => String(applicant.appliedJobId) === String(selectedJobId));
            }
            
            // Filter by status if one is selected
            if (selectedStatus) {
                filtered = filtered.filter(applicant => applicant.applicationStatus === selectedStatus);
            }
            
            // Filter by source if one is selected (new filter)
            if (selectedSource) {
                filtered = filtered.filter(applicant => applicant.howDidYouHear === selectedSource);
            }
            
            // Filter by search query
            if (searchQuery.trim() !== '') {
                const query = searchQuery.toLowerCase();
                filtered = filtered.filter(applicant => 
                    applicant.fullName && applicant.fullName.toLowerCase().includes(query)
                );
            }
            
            filteredApplicants = filtered;
        } else {
            filteredApplicants = [];
        }
    }
    
    // Handle search input change
    function handleSearchInput(event) {
        searchQuery = event.target.value;
    }
    
    // Handle job filter change
    function handleJobFilterChange(event) {
        selectedJobId = event.target.value;
    }
    
    // Handle status filter change
    function handleStatusFilterChange(event) {
        selectedStatus = event.target.value;
    }
    
    // Handle source filter change (new handler)
    function handleSourceFilterChange(event) {
        selectedSource = event.target.value;
    }
    
    // Function to format date
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    // Function to get status badge color
    function getStatusClass(status) {
        if (!status) return 'bg-slate-100 text-slate-800 border border-slate-200';
        
        // Convert to lowercase for consistent matching
        const normalizedStatus = status.toLowerCase();
        
        switch (normalizedStatus) {
            case 'diproses':
            case 'processing':
                return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'interview':
            case 'wawancara':
                return 'bg-purple-100 text-purple-800 border border-purple-200';
            case 'lolos':
            case 'passed':
            case 'accepted':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'ditolak':
            case 'rejected':
            case 'reject':
                return 'bg-red-100 text-red-800 border border-red-200';
            case 'pending':
            case 'menunggu':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'review':
            case 'reviewing':
                return 'bg-orange-100 text-orange-800 border border-orange-200';
            case 'scheduled':
            case 'terjadwal':
                return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
            case 'hired':
            case 'diterima':
                return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
            case 'withdrawn':
            case 'dibatalkan':
                return 'bg-gray-100 text-gray-800 border border-gray-200';
            default:
                return 'bg-slate-100 text-slate-800 border border-slate-200';
        }
    }
</script>
<svelte:head>
    <title>Daftar Pelamar</title>
</svelte:head>

<div class="px-6 py-8 bg-gray-50 min-h-screen max-w-7xl mx-auto">
    <div class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-3xl font-bold text-gray-900">Daftar Pelamar</h1>
            <p class="text-gray-600 mt-1">Kelola semua kandidat yang melamar</p>
        </div>
        
        <!-- Refresh Button -->
        <button 
            on:click={() => window.location.reload()}
            class="inline-flex items-center px-4 py-2 bg-white border border-gray-200 shadow-sm text-sm font-medium rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            title="Refresh data"
        >
            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
        </button>
    </div>
    
    {#if error}
        <div class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6" role="alert">
            <div class="flex">
                <svg class="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                    <p class="font-medium">Error</p>
                    <p class="text-sm">Terjadi kesalahan: {error}</p>
                </div>
            </div>
        </div>
    {/if}
    
    <!-- Search and Filters -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div class="flex flex-wrap gap-4">
            <div class="relative flex-1 min-w-64">
                <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg class="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                    </svg>
                </div>
                <input 
                    type="text" 
                    value={searchQuery}
                    on:input={handleSearchInput}
                    placeholder="Cari pelamar berdasarkan nama..." 
                    class="pl-10 pr-10 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                />
                {#if searchQuery}
                    <button 
                        on:click={() => searchQuery = ''} 
                        class="absolute inset-y-0 right-0 flex items-center pr-3"
                        aria-label="Hapus pencarian"
                    >
                        <svg class="w-4 h-4 text-gray-500 hover:text-gray-700" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 12 12M1 13 13 1"/>
                        </svg>
                    </button>
                {/if}
            </div>
            
            <select 
                class="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={selectedJobId}
                on:change={handleJobFilterChange}
            >
                <option value="">Semua Lowongan</option>
                {#if jobPostings && jobPostings.length > 0}
                    {#each jobPostings as job}
                        <option value={job.id}>{job.title}</option>
                    {/each}
                {/if}
            </select>
            
            <select 
                class="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={selectedStatus}
                on:change={handleStatusFilterChange}
            >
                <option value="">Semua Status</option>
                <option value="Diproses">Diproses</option>
                <option value="Interview">Interview</option>
                <option value="Lolos">Lolos</option>
                <option value="Ditolak">Ditolak</option>
            </select>
            
            <select 
                class="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={selectedSource}
                on:change={handleSourceFilterChange}
            >
                <option value="">Semua Platform</option>
                {#each sources as source}
                    <option value={source}>{source} ({sourceCounts[source] || 0})</option>
                {/each}
            </select>
        </div>
        
        <!-- Display active filters and counts -->
        <div class="mt-4 flex items-center justify-between">
            <span class="text-sm text-gray-600">
                <span class="font-medium">{filteredApplicants.length}</span> pelamar 
                {#if selectedJobId || selectedStatus || selectedSource || searchQuery}
                    ditemukan
                    {#if selectedSource}
                        dari sumber "{selectedSource}"
                    {/if}
                {/if}
            </span>
            
            <!-- Reset filters button when any filter is active -->
            {#if selectedJobId || selectedStatus || selectedSource || searchQuery}
                <button 
                    on:click={() => {
                        selectedJobId = '';
                        selectedStatus = '';
                        selectedSource = '';
                        searchQuery = '';
                    }} 
                    class="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    Reset Filter
                </button>
            {/if}
        </div>
    </div>
    
    <!-- Applicants Table -->
    {#if filteredApplicants.length > 0}
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posisi</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengalaman</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sumber</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CV</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        {#each filteredApplicants as applicant (applicant.id)}
                            <tr class="hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">{applicant.fullName}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-600">{applicant.email}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">
                                        {#if applicant.appliedJobId}
                                            <span class:line-through={isJobInactive(applicant.appliedJobId)} class:text-gray-500={isJobInactive(applicant.appliedJobId)}>
                                                {jobTitleMap.get(String(applicant.appliedJobId)) || 'Posisi tidak tersedia'}
                                            </span>
                                        {:else}
                                            -
                                        {/if}
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-600">
                                        {#if applicant.workExperienceYears}
                                            {applicant.workExperienceYears} tahun
                                        {:else}
                                            -
                                        {/if}
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-600">
                                        {applicant.howDidYouHear || '-'}
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-3 py-1 text-xs font-medium rounded-full {getStatusClass(applicant.applicationStatus)}">
                                        {applicant.applicationStatus || 'Diproses'}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {formatDate(applicant.date_created)}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm">
                                    {#if applicant.resumeFileUrl}
                                        <a href={applicant.resumeFileUrl} target="_blank" class="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors">
                                            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            CV
                                        </a>
                                    {:else}
                                        <span class="text-gray-400">-</span>
                                    {/if}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm">
                                    <a href="/dashboard/candidates/{applicant.id}" class="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
                                        Detail
                                    </a>
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
            {#if (searchQuery || selectedJobId || selectedStatus || selectedSource) && applicants && applicants.length > 0}
                <h3 class="text-lg font-medium text-gray-900 mb-2">Tidak ada pelamar ditemukan</h3>
                <div class="text-gray-600 space-y-1">
                    <p>Tidak ada pelamar yang sesuai dengan filter yang dipilih:</p>
                    {#if selectedSource}
                        <p class="text-sm">• Sumber: <span class="font-medium">"{selectedSource}"</span></p>
                    {/if}
                    {#if selectedJobId}
                        <p class="text-sm">• Posisi: <span class="font-medium">"{jobPostings.find(j => j.id === selectedJobId)?.title || 'Tidak diketahui'}"</span></p>
                    {/if}
                    {#if selectedStatus}
                        <p class="text-sm">• Status: <span class="font-medium">{selectedStatus}</span></p>
                    {/if}
                    {#if searchQuery}
                        <p class="text-sm">• Nama: <span class="font-medium">"{searchQuery}"</span></p>
                    {/if}
                </div>
            {:else}
                <h3 class="text-lg font-medium text-gray-900 mb-2">Belum ada pelamar</h3>
                <p class="text-gray-600">Belum ada data pelamar yang tersedia saat ini.</p>
            {/if}
        </div>
    {/if}
</div>
