import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const accountPagePath = path.resolve(import.meta.dirname, '../../../src/pages/LaunchStudio/pages/Account.jsx');
const accountPageSource = fs.readFileSync(accountPagePath, 'utf8');

describe('Account page source', () => {
    it('should keep only profile, credits, and session sections', () => {
        expect(accountPageSource).toContain('Profile');
        expect(accountPageSource).toContain('Credits');
        expect(accountPageSource).toContain('Session');
        expect(accountPageSource).not.toContain('Subscription');
        expect(accountPageSource).not.toContain('Incoming Bookings');
        expect(accountPageSource).not.toContain('My Booking Requests');
    });

    it('should remove fake booking and upgrade actions', () => {
        expect(accountPageSource).not.toContain('Accept');
        expect(accountPageSource).not.toContain('Reject');
        expect(accountPageSource).not.toContain('Upgrade to Pro');
        expect(accountPageSource).not.toContain('handleUpdateBooking');
        expect(accountPageSource).not.toContain('useModelBookings');
        expect(accountPageSource).not.toContain('useBrandBookings');
        expect(accountPageSource).not.toContain('useUpdateBookingStatus');
    });
});
