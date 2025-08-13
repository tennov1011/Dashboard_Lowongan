/**
 * Format date to Indonesian locale
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
	if (!dateString) return 'Tidak ada tanggal';
	
	const date = new Date(dateString);
	
	// Check if date is valid
	if (isNaN(date.getTime())) return 'Format tanggal tidak valid';
	
	return date.toLocaleDateString('id-ID', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

/**
 * Format date to short format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export function formatDateShort(dateString) {
	if (!dateString) return 'N/A';
	
	const date = new Date(dateString);
	
	if (isNaN(date.getTime())) return 'Invalid';
	
	return date.toLocaleDateString('id-ID', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

/**
 * Format datetime to Indonesian locale
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(dateString) {
	if (!dateString) return 'Tidak ada tanggal';
	
	const date = new Date(dateString);
	
	if (isNaN(date.getTime())) return 'Format tanggal tidak valid';
	
	return date.toLocaleString('id-ID', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

/**
 * Check if date is in the past
 * @param {string} dateString - ISO date string
 * @returns {boolean} True if date is in the past
 */
export function isPastDate(dateString) {
	if (!dateString) return false;
	
	const date = new Date(dateString);
	const now = new Date();
	
	return date < now;
}

/**
 * Get relative time string (e.g., "2 hari lalu")
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string
 */
export function getRelativeTime(dateString) {
	if (!dateString) return 'Tidak diketahui';
	
	const date = new Date(dateString);
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
	
	if (diffInSeconds < 60) {
		return 'Baru saja';
	} else if (diffInSeconds < 3600) {
		const minutes = Math.floor(diffInSeconds / 60);
		return `${minutes} menit lalu`;
	} else if (diffInSeconds < 86400) {
		const hours = Math.floor(diffInSeconds / 3600);
		return `${hours} jam lalu`;
	} else if (diffInSeconds < 604800) {
		const days = Math.floor(diffInSeconds / 86400);
		return `${days} hari lalu`;
	} else {
		return formatDateShort(dateString);
	}
}
