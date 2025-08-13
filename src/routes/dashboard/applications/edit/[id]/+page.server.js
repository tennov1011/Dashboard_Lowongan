// src/routes/recruitment/edit/+page.server.js
import { fail, redirect } from '@sveltejs/kit';
import { recruitmentService } from '$lib/services/recruitmentService';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
    try {
        // Fetch job posting data
        const jobPosting = await recruitmentService.getJobPostingById(params.id);
        
        if (!jobPosting?.data) {
            throw new Error('Job posting not found');
        }

        return {
            jobPosting: jobPosting.data,
            error: null
        };

    } catch (error) {
        console.error('Error loading data:', error);
        return {
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            jobPosting: null
        };
    }
}

/** @type {import('./$types').Actions} */
export const actions = {
    default: async ({ request, params }) => {
        try {
            const formData = await request.formData();
            
            // Log formData untuk debugging
            console.log('Form data received:', Object.fromEntries(formData));
            
            const jobPostingData = {
                title: formData.get('title'),
                department: formData.get('department'),
                description: formData.get('description'),
                requirements: formData.get('requirements'),
                deadline: new Date(String(formData.get('deadline'))).toISOString(),
                location: formData.get('location'),
                salary: formData.get('salary'),
                employment_type: formData.get('employment_type'),
                min_education: formData.get('min_education'),
                experience: formData.get('experience')
            };

            // Validate required fields
            for (const [key, value] of Object.entries(jobPostingData)) {
                if (!value) {
                    return fail(400, {
                        error: `${key} is required`,
                        data: Object.fromEntries(formData)
                    });
                }
            }

            // Update job posting
            const result = await recruitmentService.updateJobPosting(params.id, jobPostingData);
            
            console.log('Update result:', result);
            
            // Jika sampai di sini, berarti update berhasil
            throw redirect(303, '/dashboard/list');

        } catch (error) {
            // Jika error adalah redirect, lempar kembali
            if (typeof error === 'object' && error !== null && 'status' in error && error.status === 303) {
                throw error;
            }
            
            console.error('Error updating job posting:', error);
            return fail(500, {
                error: error instanceof Error ? error.message : 'Failed to update job posting'
            });
        }
    }
};
