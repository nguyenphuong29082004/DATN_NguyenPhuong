import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  APP_STORE_URL,
  getAppDownloadDestination,
  handleAppDownloadLinkClick,
} from '../../../src/utils/appDownloadRedirect.js';

const appSourcePath = path.resolve(import.meta.dirname, '../../../src/App.jsx');
const headerSourcePath = path.resolve(import.meta.dirname, '../../../src/components/landing/LandingHeader/LandingHeader.jsx');
const footerSourcePath = path.resolve(import.meta.dirname, '../../../src/components/landing/LandingFooter/LandingFooter.jsx');

const appSource = fs.readFileSync(appSourcePath, 'utf8');
const headerSource = fs.readFileSync(headerSourcePath, 'utf8');
const footerSource = fs.readFileSync(footerSourcePath, 'utf8');

describe('app download routing', () => {
  it('sends iOS devices to the App Store but keeps non-iOS users on the homepage flow', () => {
    expect(
      getAppDownloadDestination({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
        hasMSStream: false,
      }),
    ).toEqual({ type: 'external', url: APP_STORE_URL });

    expect(
      getAppDownloadDestination({
        userAgent: 'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; iPhone)',
        hasMSStream: true,
      }),
    ).toEqual({ type: 'internal', path: '/' });

    expect(
      getAppDownloadDestination({
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
        hasMSStream: false,
      }),
    ).toEqual({ type: 'internal', path: '/' });
  });

  it('handles plain link clicks immediately so the browser does not render the /app page first', () => {
    const event = {
      button: 0,
      metaKey: false,
      altKey: false,
      ctrlKey: false,
      shiftKey: false,
      defaultPrevented: false,
      preventDefaultCalled: false,
      preventDefault() {
        this.preventDefaultCalled = true;
      },
    };
    const navigateCalls = [];
    const externalCalls = [];

    const handled = handleAppDownloadLinkClick(event, {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
      hasMSStream: false,
      navigate: (path) => navigateCalls.push(path),
      replaceLocation: (url) => externalCalls.push(url),
    });

    expect(handled).toBe(true);
    expect(event.preventDefaultCalled).toBe(true);
    expect(navigateCalls).toEqual([]);
    expect(externalCalls).toEqual([APP_STORE_URL]);
  });

  it('leaves modified clicks alone so /app still works as a fallback URL', () => {
    const event = {
      button: 0,
      metaKey: true,
      altKey: false,
      ctrlKey: false,
      shiftKey: false,
      defaultPrevented: false,
      preventDefaultCalled: false,
      preventDefault() {
        this.preventDefaultCalled = true;
      },
    };

    const handled = handleAppDownloadLinkClick(event, {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
      hasMSStream: false,
      navigate: () => {},
      replaceLocation: () => {},
    });

    expect(handled).toBe(false);
    expect(event.preventDefaultCalled).toBe(false);
  });

  it('wires header, footer, and router through the shared /app route', () => {
    expect(appSource).toContain('const AppDownloadPage = lazy(() => import(\'./pages/AppDownload/AppDownloadPage\'));');
    expect(appSource).toContain('<Route path="/app" element={<AppDownloadPage />} />');
    expect(headerSource).toContain('<Link to="/app" className="nav-app-link" onClick={handleGetAppClick}>');
    expect(headerSource).toContain('onClick={handleGetAppClick}');
    expect(footerSource).toContain('<Link to="/app" onClick={handleGetAppClick}>Download the App</Link>');
    expect(footerSource).toContain('onClick={handleGetAppClick}');
  });
});
