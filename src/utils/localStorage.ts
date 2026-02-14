export function getLocalStorageItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setLocalStorageItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeLocalStorageItem(key: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function clearLocalStorage(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    window.localStorage.clear();
    return true;
  } catch {
    return false;
  }
}
