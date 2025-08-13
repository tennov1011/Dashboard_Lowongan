// src/lib/service/account.js

import { browser } from '$app/environment';
import { writable } from 'svelte/store';

// Authentication store
export const isAuthenticated = writable(false);

/**
 * Account Service for authentication
 */
class AccountService {
	constructor() {
		// Access codes for dashboard
		this.validCodes = [
			'HRD2025',
			'ADMIN123',
			'DASHBOARD2025'
		];
	}

	/**
	 * Authenticate with access code
	 * @param {string} code - Access code to verify
	 */
	async authenticate(code) {
		if (!code) {
			throw new Error('Kode akses harus diisi');
		}

		// Check if code is valid
		const isValid = this.validCodes.includes(code.toUpperCase());
		
		if (isValid) {
			// Store authentication state
			if (browser) {
				localStorage.setItem('dashboard_auth', 'true');
				localStorage.setItem('dashboard_auth_time', Date.now().toString());
			}
			
			// Update store
			isAuthenticated.set(true);
			
			return {
				success: true,
				message: 'Berhasil masuk ke dashboard'
			};
		} else {
			throw new Error('Kode akses tidak valid');
		}
	}

	/**
	 * Check if user is authenticated
	 */
	checkAuthentication() {
		if (!browser) return false;

		const authStatus = localStorage.getItem('dashboard_auth');
		const authTime = localStorage.getItem('dashboard_auth_time');
		
		if (authStatus === 'true' && authTime) {
			// Check if authentication is still valid (24 hours)
			const currentTime = Date.now();
			const loginTime = parseInt(authTime);
			const hoursPassed = (currentTime - loginTime) / (1000 * 60 * 60);
			
			if (hoursPassed < 24) {
				isAuthenticated.set(true);
				return true;
			} else {
				// Authentication expired
				this.logout();
				return false;
			}
		}
		
		return false;
	}

	/**
	 * Logout user
	 */
	logout() {
		if (browser) {
			localStorage.removeItem('dashboard_auth');
			localStorage.removeItem('dashboard_auth_time');
		}
		
		isAuthenticated.set(false);
	}

	/**
	 * Get authentication status
	 */
	getAuthStatus() {
		return this.checkAuthentication();
	}
}

export const accountService = new AccountService();