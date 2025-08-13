import { applicantService } from '$lib/services/applicantService.js';
import { recruitmentService } from '$lib/services/recruitmentService.js';
import { error, fail } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
    try {
        const { id } = params;
        
        if (!id) {
            throw error(400, 'ID pelamar diperlukan');
        }
        
        // Create a function to get applicant detail with more comprehensive fields
        /** @param {string} applicantId - The ID of the applicant */
        async function getApplicantDetail(applicantId) {
            try {
                // Try using the service method first
                const endpoint = `/items/job_applications/${applicantId}`;
                console.log('Using applicantService.request for:', endpoint);
                const response = await applicantService.request(endpoint);
                return response.data;
            } catch (err) {
                console.error('Error with service method, trying direct fetch:', err);
                
                // Fallback to direct fetch with minimal fields
                const endpoint = `/items/job_applications/${applicantId}`;
                const url = `${applicantService.baseURL}${endpoint}`;
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${applicantService.token}`
                    }
                };

                console.log('Fetching applicant with URL:', url);
                console.log('Token being used:', applicantService.token ? 'Token exists' : 'No token');
                const response = await fetch(url, config);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Error fetching applicant (${response.status}):`, errorText);
                    
                    if (response.status === 404) {
                        throw error(404, 'Data pelamar tidak ditemukan');
                    } else if (response.status === 403) {
                        throw error(403, 'Tidak memiliki akses untuk melihat data pelamar ini');
                    }
                    throw new Error(`HTTP error ${response.status}: ${errorText}`);
                }
                
                const data = await response.json();
                return data.data;
            }
        }
        
        // OPTIMIZED: Only fetch job title for the specific job instead of all jobs
        async function getJobTitle(jobId) {
            if (!jobId) return null;
            
            const endpoint = `/items/job_postings/${jobId}?fields=id,title`;
            
            const url = `${recruitmentService.baseURL}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${recruitmentService.token}`
                }
            };
            
            try {
                const response = await fetch(url, config);
                
                if (!response.ok) {
                    console.error(`Error fetching job posting: HTTP error ${response.status}`);
                    return null;
                }
                
                const data = await response.json();
                return data.data?.title || null;
            } catch (err) {
                console.error('Error fetching job posting:', err);
                return null;
            }
        }
        
        // Fetch the applicant details first
        const applicant = await getApplicantDetail(id);
        
        if (!applicant) {
            throw error(404, 'Data pelamar tidak ditemukan');
        }
        
        // OPTIMIZED: Only fetch job title for this specific applicant's job
        const jobTitle = await getJobTitle(applicant.appliedJobId);

        // Process file URLs untuk foto profil dan dokumen
        if (applicant.profilePhoto) {
            if (typeof applicant.profilePhoto === 'object' && applicant.profilePhoto.id) {
                applicant.profilePhotoUrl = `${applicantService.baseURL}/assets/${applicant.profilePhoto.id}`;
            } else if (typeof applicant.profilePhoto === 'string') {
                applicant.profilePhotoUrl = `${applicantService.baseURL}/assets/${applicant.profilePhoto}`;
            }
        }

        // Process URLs untuk dokumen - handle both direct URLs and Directus file objects
        // For resumeFileUrl
        if (applicant.resumeFileUrl) {
            if (typeof applicant.resumeFileUrl === 'object' && applicant.resumeFileUrl.id) {
                applicant.resumeFileUrl = `${applicantService.baseURL}/assets/${applicant.resumeFileUrl.id}`;
            }
            // If it's already a string URL (like Google Drive), keep it as is
        }
        
        // For degreeCertificateUrl
        if (applicant.degreeCertificateUrl) {
            if (typeof applicant.degreeCertificateUrl === 'object' && applicant.degreeCertificateUrl.id) {
                applicant.degreeCertificateUrl = `${applicantService.baseURL}/assets/${applicant.degreeCertificateUrl.id}`;
            }
            // If it's already a string URL (like Google Drive), keep it as is
        }
        
        // For transcriptUrl
        if (applicant.transcriptUrl) {
            if (typeof applicant.transcriptUrl === 'object' && applicant.transcriptUrl.id) {
                applicant.transcriptUrl = `${applicantService.baseURL}/assets/${applicant.transcriptUrl.id}`;
            }
            // If it's already a string URL (like Google Drive), keep it as is
        }

        return {
            applicant,
            jobTitle
        };
    } catch (err) {
        // Check if it's an SvelteKit error (status code available)
        if (err && typeof err === 'object' && 'status' in err) {
            throw err;
        }
        
        console.error('Error loading applicant data:', err);
        throw error(500, 'Gagal memuat data pelamar');
    }
}

export const actions = {
    updateStatus: async ({ request, params }) => {
        const data = await request.formData();
        const status = data.get('status');
        const note = data.get('note');
        
        console.log('Form data received:', { status, note });
        
        try {
            const applicantId = params.id;
            
            if (!status) {
                return fail(400, {
                    error: true,
                    message: 'Status is required'
                });
            }
            
            // Convert frontend status values to database status values
            const statusMap = {
                'diproses': 'reviewed',
                'interview': 'interview',
                'lolos': 'accepted',
                'ditolak': 'rejected'
            };
            
            // @ts-ignore - Ignore TypeScript checking for statusMap access
            const dbStatus = statusMap[String(status)] || String(status);
            
            // Use the enhanced applicantService.updateApplicantStatus method
            await applicantService.updateApplicantStatus(String(applicantId), dbStatus);
            
            // Create success message with special notice for accepted status
            let message = 'Status kandidat berhasil diperbarui';
            if (dbStatus === 'accepted') {
                message = 'Status kandidat berhasil diperbarui menjadi LOLOS! Data karyawan telah otomatis dibuat dalam sistem register.';
            }
            
            return {
                success: true,
                message: message,
                updatedStatus: status,
                updatedNote: note
            };
        } catch (err) {
            console.error('Error updating applicant status:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            return fail(400, {
                error: true,
                message: `Gagal memperbarui status kandidat: ${errorMessage}`
            });
        }
    }
};
