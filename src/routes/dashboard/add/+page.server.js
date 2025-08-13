// src/routes/recruitment/add/+page.server.js
import { fail, redirect } from '@sveltejs/kit';
import { recruitmentService } from '$lib/services/recruitmentService';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
    // No need to load master_data since location is now a simple text input
    return {};
}

/** @type {import('./$types').Actions} */
export const actions = {
    // Create new job posting
    create: async ({ request }) => {
        let title, department, description, requirementsText, deadlineStr, location, salary, employment_type, min_education, experience;
        try {
            const formData = await request.formData();
            title = formData.get('title');
            department = formData.get('department');
            description = formData.get('description');
            requirementsText = formData.get('requirements');
            deadlineStr = formData.get('deadline');
            location = formData.get('location');
            salary = formData.get('salary');
            employment_type = formData.get('employment_type');
            min_education = formData.get('min_education');
            experience = formData.get('experience');

            console.log('Form data received:', {
                title, department, description, requirementsText, deadlineStr, location, salary, employment_type, min_education, experience
            });

            // Validate required fields
            if (!title || !department || !description || !requirementsText || !deadlineStr || !location) {
                return fail(400, {
                    error: 'All fields are required',
                    data: Object.fromEntries(formData)
                });
            }

            // Parse requirements (split by new line)
            const requirements = String(requirementsText)
                .split('\n')
                .map(item => item.trim())
                .filter(item => item.length > 0);

            // Create job posting object - pastikan field names sesuai dengan schema Directus
            const jobPostingData = {
                title: String(title),
                department: String(department),
                description: String(description),
                requirements: requirements.join('\n'), // Simpan sebagai string dengan newline sebagai separator
                deadline: new Date(String(deadlineStr)).toISOString(),
                date_created: new Date().toISOString(),
                location: String(location),
                salary: String(salary),
                employment_type: String(employment_type),
                min_education: String(min_education),
                experience: String(experience)
            };

            console.log('Sending job posting data:', jobPostingData);

            // Save to database
            const result = await recruitmentService.createJobPosting(jobPostingData);

            console.log('Job posting created successfully:', result);

            // Redirect back to recruitment page
            throw redirect(303, '/dashboard/list');

        } catch (error) {
            // Check if this is a redirect error (has status property)
            if (typeof error === 'object' && error !== null && 'status' in error && error.status === 303) {
                // This is our redirect, so pass it along
                throw error;
            }

            console.error('Error creating job posting:', error);

            return fail(500, {
                error: error instanceof Error ? error.message : 'Failed to create job posting',
                data: {
                    title: title?.toString() || '',
                    department: department?.toString() || '',
                    description: description?.toString() || '',
                    requirements: requirementsText?.toString() || '',
                    deadline: deadlineStr?.toString() || '',
                    location: location?.toString() || '',
                    salary: salary?.toString() || '',
                    employment_type: employment_type?.toString() || '',
                    min_education: min_education?.toString() || '',
                    experience: experience?.toString() || ''
                }
            });
        }
    }
};
