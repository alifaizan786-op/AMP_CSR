import type { PaymentMethod } from '../types';

// Mirrors server/utils/cardExpiry.ts: a card works through the last day of its expiry month
export const isCardExpired = (card: PaymentMethod, now = new Date()): boolean =>
	now.getUTCFullYear() * 12 + now.getUTCMonth() >
	card.expYear * 12 + (card.expMonth - 1);

// e.g. "04/2026"
export const formatExpiry = (card: PaymentMethod): string =>
	`${String(card.expMonth).padStart(2, '0')}/${card.expYear}`;
