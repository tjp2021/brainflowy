/**
 * Generate a consistent ID for new items that will be recognized by the sync system
 * Format: item_XXXXXXXXXXXXX (exactly 13 digits)
 */

let counter = 0;

export function generateNewItemId(): string {
  // Use timestamp + counter to ensure uniqueness
  const timestamp = Date.now().toString();
  const counterStr = String(counter++).padStart(3, '0');
  
  // Combine and ensure exactly 13 digits
  const combined = timestamp + counterStr;
  const id = combined.slice(-13); // Take last 13 digits
  
  return `item_${id}`;
}

/**
 * Check if an ID represents a new item (not yet saved to backend)
 */
export function isNewItemId(id: string): boolean {
  // New items have exactly 13 digits after item_
  // Backend IDs have additional suffixes like item_1755834646913665_366
  return /^item_\d{13}$/.test(id);
}