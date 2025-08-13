<script>
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	/** @type {import('./$types').PageData} */
	export let data;
	/** @type {import('./$types').ActionData} */
	export let form;

	// Form values (pre-fill if form data exists from a failed submit)
	let title = form?.data?.title || '';
	let department = form?.data?.department || '';
	let description = form?.data?.description || '';
	let requirements = form?.data?.requirements || '';
	let deadline = form?.data?.deadline || '';
	let location = form?.data?.location || '';
	let salary = form?.data?.salary || '';
	let employment_type = form?.data?.employment_type || '';
	let min_education = form?.data?.min_education || '';
	let experience = form?.data?.experience || '';

	// Set minimum date for deadline to today
	let minDate;

	onMount(() => {
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		minDate = `${year}-${month}-${day}`;

		if (!deadline) {
			deadline = minDate;
		}
	});
</script>

<svelte:head>
	<title>Tambah Lowongan</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="mb-4 flex items-center">
			<a
				href="/dashboard/list"
				class="mr-4 rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
						clip-rule="evenodd"
					/>
				</svg>
			</a>
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Tambah Lowongan</h1>
				<p class="mt-1 text-gray-600">Buat lowongan pekerjaan baru untuk perusahaan Anda</p>
			</div>
		</div>
	</div>

	<!-- Status Messages -->
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
					<p class="text-sm">{form.message || form.error}</p>
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

	<!-- Form Card -->
	<div class="rounded-2xl border border-gray-100 bg-white shadow-sm">
		<form method="POST" action="?/create" use:enhance class="space-y-8 p-8">
			<!-- Basic Information -->
			<div>
				<h2 class="mb-6 text-lg font-semibold text-gray-900">Informasi Dasar</h2>
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div>
						<label for="title" class="mb-2 block text-sm font-medium text-gray-700">Posisi *</label>
						<input
							type="text"
							id="title"
							name="title"
							bind:value={title}
							required
							placeholder="e.g. Software Engineer"
							class="w-full rounded-xl border border-gray-300 px-4 py-3 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="department" class="mb-2 block text-sm font-medium text-gray-700"
							>Departemen *</label
						>
						<input
							type="text"
							id="department"
							name="department"
							bind:value={department}
							required
							placeholder="e.g. IT Department"
							class="w-full rounded-xl border border-gray-300 px-4 py-3 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="location" class="mb-2 block text-sm font-medium text-gray-700"
							>Lokasi *</label
						>
						<input
							type="text"
							id="location"
							name="location"
							bind:value={location}
							required
							placeholder="e.g. Ciketing, Jln Raya No. 123"
							class="w-full rounded-xl border border-gray-300 px-4 py-3 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="employment_type" class="mb-2 block text-sm font-medium text-gray-700"
							>Tipe Pekerjaan *</label
						>
						<select
							id="employment_type"
							name="employment_type"
							bind:value={employment_type}
							required
							class="w-full rounded-xl border border-gray-300 px-4 py-3 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						>
							<option value="">Pilih Tipe</option>
							<option value="Full-time">Full-time</option>
							<option value="Part-time">Part-time</option>
							<option value="Contract">Contract</option>
							<option value="Internship">Internship</option>
							<option value="Freelance">Freelance</option>
						</select>
					</div>

					<div>
						<label for="salary" class="mb-2 block text-sm font-medium text-gray-700">Gaji *</label>
						<input
							type="text"
							id="salary"
							name="salary"
							bind:value={salary}
							required
							placeholder="e.g. Rp. 3.500.000 - Rp. 5.000.000"
							class="w-full rounded-xl border border-gray-300 px-4 py-3 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="deadline" class="mb-2 block text-sm font-medium text-gray-700"
							>Deadline *</label
						>
						<input
							type="date"
							id="deadline"
							name="deadline"
							bind:value={deadline}
							min={minDate}
							required
							class="w-full rounded-xl border border-gray-300 px-4 py-3 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>
			</div>

			<!-- Requirements -->
			<div>
				<h2 class="mb-6 text-lg font-semibold text-gray-900">Persyaratan</h2>
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div>
						<label for="min_education" class="mb-2 block text-sm font-medium text-gray-700"
							>Pendidikan Minimal *</label
						>
						<select
							id="min_education"
							name="min_education"
							bind:value={min_education}
							required
							class="w-full rounded-xl border border-gray-300 px-4 py-3 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						>
							<option value="">Pilih Pendidikan</option>
							<option value="SMA/SMK">SMA/SMK</option>
							<option value="D3">D3</option>
							<option value="S1">S1</option>
							<option value="S2">S2</option>
							<option value="S3">S3</option>
						</select>
					</div>

					<div>
						<label for="experience" class="mb-2 block text-sm font-medium text-gray-700"
							>Pengalaman *</label
						>
						<select
							id="experience"
							name="experience"
							bind:value={experience}
							required
							class="w-full rounded-xl border border-gray-300 px-4 py-3 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						>
							<option value="">Pilih Pengalaman</option>
							<option value="0-1 tahun">0-1 tahun</option>
							<option value="1-3 tahun">1-3 tahun</option>
							<option value="3-5 tahun">3-5 tahun</option>
							<option value="5+ tahun">5+ tahun</option>
							<option value="10+ tahun">10+ tahun</option>
						</select>
					</div>
				</div>

				<div class="mt-6">
					<label for="requirements" class="mb-2 block text-sm font-medium text-gray-700"
						>Persyaratan / Kualifikasi *</label
					>
					<textarea
						id="requirements"
						name="requirements"
						bind:value={requirements}
						required
						rows="6"
						placeholder="Masukkan persyaratan, satu per baris&#10;Contoh:&#10;- Minimal S1 Teknik Informatika&#10;- Pengalaman 2+ tahun dengan React&#10;- Mampu bekerja dalam tim"
						class="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
					></textarea>
					<p class="mt-2 text-sm text-gray-500">Tulis setiap persyaratan dalam baris terpisah</p>
				</div>
			</div>

			<!-- Job Description -->
			<div>
				<div>
					<label for="description" class="mb-2 block text-sm font-medium text-gray-700"
						>Deskripsi *</label
					>
					<textarea
						id="description"
						name="description"
						bind:value={description}
						required
						rows="8"
						placeholder="Deskripsikan tugas dan tanggung jawab untuk posisi ini..."
						class="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
					></textarea>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="flex items-center justify-end space-x-4 border-t border-gray-200 pt-6">
				<a
					href="/dashboard/list"
					class="rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200"
				>
					Batal
				</a>
				<button
					type="submit"
					class="flex items-center rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
				>
					<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"
						></path>
					</svg>
					Buat Lowongan
				</button>
			</div>
		</form>
	</div>
</div>