import { applicantService } from '$lib/services/applicantService.js';
import { recruitmentService } from '$lib/services/recruitmentService.js';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
    try {
        // OPTIMIZED: Fetch only essential fields for listing page
        async function getAllApplicants() {
            // Only fetch essential fields for list view
            const endpoint = '/items/job_applications?fields=id,fullName,email,appliedJobId,applicationStatus,date_created,howDidYouHear&sort=-date_created';
            
            const url = `${applicantService.baseURL}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${applicantService.token}`
                }
            };

            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            
            const data = await response.json();
            return data.data;
        }
        
        // OPTIMIZED: Fetch only id and title for dropdown filter
        async function getAllJobPostings() {
            const endpoint = '/items/job_postings?fields=id,title&sort=-date_created';
            
            const url = `${recruitmentService.baseURL}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${recruitmentService.token}`
                }
            };
            
            const response = await fetch(url, config);
            
            if (!response.ok) {
                console.error(`Error fetching job postings: HTTP error ${response.status}`);
                return [];
            }
            
            const data = await response.json();
            return data.data || [];
        }

        // OPTIMIZED: Parallel fetch instead of sequential
        const [applicants, jobPostings] = await Promise.all([
            getAllApplicants(),
            getAllJobPostings()
        ]);
        
        return {
            applicants,
            jobPostings
        };
    } catch (error) {
        console.error('Error loading candidates data:', error);
        return {
            applicants: [],
            jobPostings: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
