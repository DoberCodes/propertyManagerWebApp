/**
 * useAdminNotes Hook
 * Manages internal notes and resolution notes state
 */

import { useState } from 'react';

export interface UseAdminNotesReturn {
	noteByTicket: Record<string, string>;
	resolutionByTicket: Record<string, string>;
	setNoteByTicket: (value: Record<string, string>) => void;
	setResolutionByTicket: (value: Record<string, string>) => void;
	updateNote: (ticketId: string, value: string) => void;
	updateResolution: (ticketId: string, value: string) => void;
	getNote: (ticketId: string) => string;
	getResolution: (ticketId: string) => string;
}

export const useAdminNotes = (): UseAdminNotesReturn => {
	const [noteByTicket, setNoteByTicket] = useState<Record<string, string>>({});
	const [resolutionByTicket, setResolutionByTicket] = useState<Record<string, string>>({});

	const updateNote = (ticketId: string, value: string) => {
		setNoteByTicket((prev) => ({ ...prev, [ticketId]: value }));
	};

	const updateResolution = (ticketId: string, value: string) => {
		setResolutionByTicket((prev) => ({ ...prev, [ticketId]: value }));
	};

	const getNote = (ticketId: string): string => noteByTicket[ticketId] || '';

	const getResolution = (ticketId: string): string => resolutionByTicket[ticketId] || '';

	return {
		noteByTicket,
		resolutionByTicket,
		setNoteByTicket,
		setResolutionByTicket,
		updateNote,
		updateResolution,
		getNote,
		getResolution,
	};
};
