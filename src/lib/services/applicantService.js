// src/lib/services/applicantService.js

import { browser } from '$app/environment';

// Get Directus configuration from environment
const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL;
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN;

/**
 * Applicant Service for job applications
 */
class ApplicantService {
	constructor() {
		this.baseURL = DIRECTUS_URL;
		this.token = DIRECTUS_TOKEN;
		// Simple in-memory cache
		this.cache = new Map();
		this.cacheTimeout = 2 * 60 * 1000; // 2 minutes cache
	}

	/**
	 * Make authenticated request to Directus
	 */
	async request(endpoint, options = {}) {
		if (!browser) {
			// Jika di server, gunakan fetch langsung
			const url = `${this.baseURL}${endpoint}`;
			const config = {
				headers: {
					'Content-Type': 'application/json',
					...(this.token && { Authorization: `Bearer ${this.token}` }),
					...(options.headers || {})
				},
				...options
			};

			console.log('Making server request to:', url);
			console.log('Request config:', config);

			try {
				const response = await fetch(url, config);

				console.log('Response status:', response.status);

				if (!response.ok) {
					const errorText = await response.text();
					console.error('API Error Response:', errorText);
					throw new Error(`API Error: ${response.status} - ${errorText}`);
				}

				const data = await response.json();
				console.log('Response data:', data);
				return data;
			} catch (error) {
				console.error('Request error:', error);
				throw error;
			}
		}

		// Browser code tetap sama
		const url = `${this.baseURL}${endpoint}`;
		const config = {
			headers: {
				'Content-Type': 'application/json',
				...(this.token && { Authorization: `Bearer ${this.token}` }),
				...(options.headers || {})
			},
			...options
		};

		try {
			const response = await fetch(url, config);

			if (!response.ok) {
				throw new Error(`HTTP error ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Browser request error:', error);
			throw error;
		}
	}

	/**
	 * Get all applicants for a specific job posting
	 * @param {number|string} jobId - Job posting ID
	 */
	async getApplicantsByJobId(jobId) {
		console.log('Fetching applicants for job ID:', jobId);
		try {
			const endpoint = `/items/job_applications?filter[appliedJobId][_eq]=${jobId}&sort=-date_created`;
			console.log('API endpoint:', endpoint);
			const result = await this.request(endpoint);
			console.log('Applicants response:', result);
			return result;
		} catch (error) {
			console.error('Error fetching applicants:', error);
			throw error;
		}
	}

	/**
	 * Get an applicant by ID
	 * @param {number|string} id - Applicant ID
	 */
	async getApplicantById(id) {
		console.log('Fetching applicant by ID:', id);
		const result = await this.request(`/items/job_applications/${id}`);
		console.log('Applicant response:', result);
		return result;
	}

	/**
	 * Update an applicant's status
	 * @param {number|string} id - Applicant ID
	 * @param {string} status - New status (pending, reviewed, interview, test, accepted, rejected)
	 */
	async updateApplicantStatus(id, status) {
		console.log('Updating applicant status:', { id, status });
		
		// Clear cache when status changes
		this.cache.delete('applicant_counts');
		
		// Update applicant status
		return this.request(`/items/job_applications/${id}`, {
			method: 'PATCH',
			body: JSON.stringify({
				applicationStatus: status
			})
		});
	}

	/**
	 * Create notification for new applicant
	 * @param {string} applicantId - ID of the applicant
	 * @param {string} jobId - ID of the job posting
	 * @param {string} applicantName - Name of the applicant
	 * @param {string} jobTitle - Title of the job
	 */
	async createNewApplicantNotification(applicantId, jobId, applicantName, jobTitle) {
		try {
			console.log('Creating notification for new applicant:', { applicantId, jobId, applicantName, jobTitle });
			
			// Create notification with schema that matches database
			const notificationData = {
				type: 'new_application',
				message: `Pelamar baru "${applicantName}" telah mendaftar untuk posisi "${jobTitle}"`,
				job_id: String(jobId),
				applicant_id: String(applicantId),
				redirect_url: `/recruitment/applications?jobId=${jobId}`,
				is_read: false,
				created_at: new Date().toISOString()
			};

			// Save notification to database
			const result = await this.request('/items/hrd_notifications', {
				method: 'POST',
				body: JSON.stringify(notificationData)
			});
			
			console.log('✅ Notification created successfully for new applicant:', result);
			return result;
		} catch (error) {
			console.error('❌ Error creating notification for new applicant:', error);
			// Don't throw error to prevent application creation from failing
			return null;
		}
	}
	/**
	 * Upload a document (resume or supporting document)
	 * @param {File} file - File to upload
	 */
	async uploadDocument(file) {
		if (!browser) return null;

		const url = `${this.baseURL}/files`;
		const formData = new FormData();
		formData.append('file', file);

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					...(this.token && { Authorization: `Bearer ${this.token}` })
				},
				body: formData
			});

			if (!response.ok) {
				throw new Error(`HTTP error ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Upload Error:', error);
			throw error;
		}
	}

	/**
	 * Get supporting documents for an applicant
	 * @param {number|string} applicantId - Applicant ID
	 */
	async getSupportingDocuments(applicantId) {
		return this.request(`/items/application_documents?filter[application_id][_eq]=${applicantId}&fields=*,document_id.*`);
	}

	/**
	 * Get applicant count for all job postings - CACHED
	 */
	async getApplicantCounts() {
		console.log('Getting applicant counts...');
		
		// Check cache first
		const cacheKey = 'applicant_counts';
		const cached = this.cache.get(cacheKey);
		
		if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
			console.log('Returning cached applicant counts');
			return cached.data;
		}
		
		try {
			const response = await this.request('/items/job_applications?fields=appliedJobId&limit=-1');
			console.log('Applicant counts response:', response);
			
			const applications = response?.data || [];
			console.log('Applications for counting:', applications);
			
			// Hitung per job ID
			const counts = {};
			applications.forEach((/** @type {any} */ app) => {
				const jobId = String(app.appliedJobId);
				counts[jobId] = (counts[jobId] || 0) + 1;
			});
			
			console.log('Applicant counts by job ID:', counts);
			
			// Cache the result
			this.cache.set(cacheKey, {
				data: counts,
				timestamp: Date.now()
			});
			
			return counts;
		} catch (error) {
			console.error('Error getting applicant counts:', error);
			return {};
		}
	}

	/**
	 * Get all applicants (simplified for reporting)
	 */
	async getAllApplicants() {
		console.log('Getting all applicants for reporting...');
		
		try {
			const endpoint = '/items/job_applications?fields=id,fullName,email,appliedJobId,applicationStatus,date_created&sort=-date_created&limit=-1';
			const result = await this.request(endpoint);
			console.log('All applicants response:', result);
			return result;
		} catch (error) {
			console.error('Error fetching all applicants:', error);
			throw error;
		}
	}
}

export const applicantService = new ApplicantService();
