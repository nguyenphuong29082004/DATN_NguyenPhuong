export const APP_STORE_URL = 'https://apps.apple.com/us/app/ai-fashion-designer-try-on/id6748137509';

export function getAppDownloadDestination({ userAgent, hasMSStream }) {
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !hasMSStream;

  if (isIOS) {
    return { type: 'external', url: APP_STORE_URL };
  }

  return { type: 'internal', path: '/' };
}

export function navigateToAppDownload({ userAgent, hasMSStream, navigate, replaceLocation }) {
  const destination = getAppDownloadDestination({ userAgent, hasMSStream });

  if (destination.type === 'external') {
    replaceLocation(destination.url);
    return destination;
  }

  navigate(destination.path);
  return destination;
}

export function handleAppDownloadLinkClick(event, options) {
  const isPlainLeftClick =
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey;

  if (!isPlainLeftClick) {
    return false;
  }

  event.preventDefault();
  navigateToAppDownload(options);
  return true;
}
