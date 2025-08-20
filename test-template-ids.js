// Test what IDs the template generates
const generateId = () => {
  let idCounter = 1;
  const timestamp = Date.now();
  const id = `item_${timestamp}${String(idCounter++).padStart(3, '0')}`;
  console.log('Generated ID:', id);
  console.log('ID length:', id.length);
  console.log('Timestamp part:', timestamp);
  console.log('Full ID format:', id);
  
  // Check if it matches the pattern
  const isNewItem = id.match(/^item_\d{13}$/);
  console.log('Matches 13-digit pattern?', isNewItem ? 'YES' : 'NO');
  
  // Check if it starts with item_
  console.log('Starts with item_?', id.startsWith('item_'));
  
  return id;
};

generateId();