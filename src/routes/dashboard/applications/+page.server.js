// src/routes/recruitment/applications/+page.server.js
import { error, fail } from '@sveltejs/kit';
import { recruitmentService } from '$lib/services/recruitmentService.js';
import { applicantService } from '$lib/services/applicantService.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
    try {
        // Get job ID from query parameter
        const jobId = url.searchParams.get('jobId');
        
        // Get applicant ID if we're viewing a single applicant
        const applicantId = url.searchParams.get('applicantId');
        
        if (!jobId) {
            // OPTIMIZED: Single fetch with applicant counts
            const [jobPostingsResponse, applicantCounts] = await Promise.all([
                recruitmentService.getAllJobPostings(),
                applicantService.getApplicantCounts() // Only get counts
            ]);
            
            // OPTIMIZED: Add counts without fetching all applicant data
            const jobPostingsWithCount = (jobPostingsResponse?.data || []).map((/** @type {any} */ job) => ({
                ...job,
                applicantCount: applicantCounts[job.id] || 0
            }));
            
            return {
                jobPostings: jobPostingsWithCount,
                selectedJob: null,
                applications: [],
                applicant: null,
                supportingDocuments: null
            };
        }
        
        // Get specific job posting
        const jobResponse = await recruitmentService.getJobPostingById(jobId);
        
        if (!jobResponse?.data) {
            throw error(404, 'Job posting not found');
        }
        
        // OPTIMIZED: Get applications for this job (no master data needed)
        const applicationsResponse = await applicantService.getApplicantsByJobId(jobId);
        
        let applicant = null;
        let supportingDocuments = null;
        
        // If viewing a specific applicant, get their details and documents
        if (applicantId) {
            const applicantResponse = await applicantService.getApplicantById(applicantId);
            applicant = applicantResponse?.data;
            
            if (applicant) {
                const documentsResponse = await applicantService.getSupportingDocuments(applicantId);
                supportingDocuments = documentsResponse?.data || [];
            }
        }
        
        // Tambahkan jumlah pelamar ke objek lowongan yang dipilih
        const selectedJob = jobResponse.data;
        selectedJob.applicantCount = (applicationsResponse?.data || []).length;
        
        return {
            selectedJob,
            applications: applicationsResponse?.data || [],
            applicant,
            supportingDocuments
        };
    } catch (err) {
        console.error('Error loading applications:', err);
        throw error(500, {
            message: err instanceof Error ? err.message : 'Failed to load applications'
        });
    }
}

/** @type {import('./$types').Actions} */
export const actions = {
    // Upload supporting document
    uploadDocument: async ({ request }) => {
        try {
            const formData = await request.formData();
            const applicantId = formData.get('applicantId');
            const documentType = formData.get('documentType');
            const file = formData.get('document');
            const jobId = formData.get('jobId');
            
            if (!applicantId || !documentType || !file || !jobId) {
                return fail(400, { 
                    error: 'Missing required fields',
                    success: false
                });
            }
            
            // Check if file is actually a file
            if (!(file instanceof File)) {
                return fail(400, { 
                    error: 'Invalid file',
                    success: false
                });
            }
            
            // @ts-ignore - Mengabaikan TypeScript error untuk addSupportingDocument
            await applicantService.addSupportingDocument(
                String(applicantId),
                file,
                String(documentType)
            );
            
            return {
                success: true,
                message: 'Document uploaded successfully'
            };
        } catch (err) {
            console.error('Error uploading document:', err);
            return fail(500, {
                error: err instanceof Error ? err.message : 'Failed to upload document',
                success: false
            });
        }
    }
};
