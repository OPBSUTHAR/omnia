export const GITHUB_OWNER = 'OPBSUTHAR';
export const REPO_NAME = 'omnia';
export const REPO_URL = `https://github.com/${GITHUB_OWNER}/${REPO_NAME}`;
export const RELEASES_URL = `${REPO_URL}/releases`;
export const RELEASES_LATEST_URL = `${REPO_URL}/releases/latest`;
export const ISSUES_URL = `${REPO_URL}/issues`;

/** The full app lives on Vercel. GitHub Pages is the install guide. */
export const APP_WEB_URL = 'https://omnia-suthara.vercel.app/';
export const DOCS_URL = `https://${GITHUB_OWNER.toLowerCase()}.github.io/${REPO_NAME}/`;
export const WEB_URL = APP_WEB_URL;

/** Release assets use fixed names so "latest/download" links never rot. */
export const LATEST_APK_URL = `${REPO_URL}/releases/latest/download/omnia.apk`;
export const LATEST_WINDOWS_URL = `${REPO_URL}/releases/latest/download/omnia-windows.exe`;
export const LATEST_LINUX_URL = `${REPO_URL}/releases/latest/download/omnia-linux.AppImage`;

export const UPDATE_FEED_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${REPO_NAME}/main/public/updates/latest.json`;
export const APP_STORE_URL = RELEASES_URL;
