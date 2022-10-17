/**
 * Check whether localStorage is supported and available
 * @param type Web Storage type, sessionStorage or localStorage
 * @returns
 */
export function storageAvailable(
  type: "sessionStorage" | "localStorage"
): boolean {
  let storage;
  try {
    storage = window[type];
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return (
      e instanceof DOMException &&
      // everything except Firefox
      (e.name === "QuotaExceededError" ||
        // Firefox
        e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage !== undefined &&
      storage.length !== 0
    );
  }
}

/**
 * Return a random number between min and max.
 * @param min Smallest value number can take (inclusive).
 * @param max Largest value number can take (exclusive).
 * @returns A random number between min and max.
 */
export function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
