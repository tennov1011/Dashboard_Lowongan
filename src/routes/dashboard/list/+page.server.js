// src/routes/dashboard/list/+page.server.js
import { fail } from '@sveltejs/kit';
import { recruitmentService } from '$lib/services/recruitmentService.js';
import { applicantService } from '$lib/services/applicantService.js';

/** @type {import('../$types').PageServerLoad} */
export async function load() {
    try {
        // OPTIMIZED: Single fetch instead of 4 separate fetches
        const [jobPostingsResponse, applicantCounts] = await Promise.all([
            recruitmentService.getAllJobPostings(),
            applicantService.getApplicantCounts() // Only get counts, not full data
        ]);
        
        const allJobs = jobPostingsResponse?.data || [];
        const now = new Date();
        
        // OPTIMIZED: Filter in memory instead of separate API calls
        const jobPostingsWithCount = allJobs.map((/** @type {any} */ job) => {
            // Add applicant count
            const applicantCount = applicantCounts[job.id] || 0;
            
            return {
                ...job,
                applicantCount
            };
        });
        
        // OPTIMIZED: Client-side filtering instead of separate API calls
        const activeJobPostingsWithCount = jobPostingsWithCount.filter((/** @type {any} */ job) => {
            const isActive = job.status === 'active' || job.status === null;
            const notExpired = new Date(job.deadline) > now;
            return isActive && notExpired;
        });
        
        const inactiveJobPostingsWithCount = jobPostingsWithCount.filter((/** @type {any} */ job) => {
            const isInactive = job.status === 'inactive';
            const isExpired = new Date(job.deadline) <= now;
            return isInactive || isExpired;
        });
        
        return {
            jobPostings: jobPostingsWithCount,
            activeJobPostings: activeJobPostingsWithCount,
            inactiveJobPostings: inactiveJobPostingsWithCount,
            status: 'success'
        };
    } catch (error) {
        console.error('Error loading job postings:', error);
        return {
            jobPostings: [],
            activeJobPostings: [],
            inactiveJobPostings: [],
            status: 'error',
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/** @type {import('../$types').Actions} */
export const actions = {
    // Toggle job posting status
    toggleStatus: async ({ request }) => {
        try {
            const formData = await request.formData();
            const id = formData.get('id');
            const currentStatus = formData.get('currentStatus');
            
            if (!id || !currentStatus) {
                return fail(400, { 
                    status: 'error',
                    message: 'ID lowongan dan status saat ini diperlukan' 
                });
            }
            
            // Toggle status
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            
            await recruitmentService.toggleJobStatus(String(id), newStatus);
            
            return {
                status: 'success'
            };
        } catch (error) {
            console.error('Error toggling job status:', error);
            return fail(500, {
                status: 'error',
                message: error instanceof Error ? error.message : 'Gagal mengubah status lowongan'
            });
        }
    },

    // Create new job posting
    create: async ({ request }) => {
        try {
            const formData = await request.formData();
            
            // Extract form data
            const title = formData.get('title');
            const department = formData.get('department');
            const description = formData.get('description');
            const requirementsText = formData.get('requirements');
            const deadlineStr = formData.get('deadline');
            const location = formData.get('location');
            const salary = formData.get('salary');
            const employment_type = formData.get('employment_type');
            const min_education = formData.get('min_education');
            const experience = formData.get('experience');
            
            // Validate required fields
            if (!title || !department || !description || !requirementsText || !deadlineStr || !location || !salary || !employment_type || !min_education || !experience) {
                return fail(400, {
                    error: 'Semua field diperlukan',
                    data: Object.fromEntries(formData)
                });
            }
            
            // Parse requirements (split by new line)
            const requirements = requirementsText
                .toString()
                .split('\n')
                .map(item => item.trim())
                .filter(item => item.length > 0);
            
            // Create job posting object dengan field status default 'active'
            const jobPostingData = {
                title,
                department,
                description,
                requirements: requirements.join('\n'),
                deadline: new Date(String(deadlineStr)).toISOString(),
                date_created: new Date().toISOString(),
                location,
                salary,
                employment_type,
                min_education,
                experience,
                status: 'active' // Default status
            };
            
            // Save to database
            const response = await recruitmentService.createJobPosting(jobPostingData);
            
            return {
                status: 'success',
                message: 'Lowongan pekerjaan berhasil dibuat',
                job: response?.data
            };
        } catch (error) {
            console.error('Error creating job posting:', error);
            return fail(500, {
                status: 'error',
                message: error instanceof Error ? error.message : 'Gagal membuat lowongan pekerjaan'
            });
        }
    },
    
    // Delete job posting
    delete: async ({ request }) => {
        try {
            const formData = await request.formData();
            const id = formData.get('id');
            
            if (!id) {
                return fail(400, { error: 'ID lowongan pekerjaan diperlukan' });
            }
            
            await recruitmentService.deleteJobPosting(String(id));
            
            return {
                status: 'success',
                message: 'Lowongan pekerjaan berhasil dihapus'
            };
        } catch (error) {
            console.error('Error deleting job posting:', error);
            return fail(500, {
                status: 'error',
                message: error instanceof Error ? error.message : 'Gagal menghapus lowongan pekerjaan'
            });
        }
    }
};
