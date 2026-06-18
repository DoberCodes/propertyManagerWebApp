/**
 * useClickOutside Hook
 * Detects clicks outside a given element and triggers a callback
 * Generic utility hook suitable for modals, dropdowns, menus, etc.
 */

import { useEffect, RefObject } from 'react';

/**
 * Hook to detect clicks outside a referenced element
 *
 * @param ref - Reference to the element to track
 * @param callback - Function to call when click outside is detected
 * @param enabled - Whether to enable the listener (default: true)
 */
export const useClickOutside = (
	ref: RefObject<HTMLElement>,
	callback: () => void,
	enabled: boolean = true,
): void => {
	useEffect(() => {
		if (!enabled) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				callback();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [ref, callback, enabled]);
};
