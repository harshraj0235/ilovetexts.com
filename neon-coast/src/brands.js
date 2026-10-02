export const BRANDS = [
  { id: 'zomato', name: 'Zomato', color: '#ff2b45', ink: '#ffffff', category: 'Food' },
  { id: 'swiggy', name: 'Swiggy', color: '#ff5200', ink: '#ffffff', category: 'Food' },
  { id: 'zepto', name: 'Zepto', color: '#8018c6', ink: '#ffffff', category: 'Groceries' },
  { id: 'amazon', name: 'Amazon', color: '#ff9900', ink: '#15202b', category: 'Shopping' },
  { id: 'flipkart', name: 'Flipkart', color: '#2874f0', ink: '#ffffff', category: 'Shopping' },
  { id: 'swish', name: 'Swish', color: '#2fbd60', ink: '#ffffff', category: 'Food' },
  { id: 'flipkart-minutes', name: 'Flipkart Minutes', color: '#ad1748', ink: '#fff000', category: 'Groceries' },
  { id: 'amazon-now', name: 'Amazon Now', color: '#00c4eb', ink: '#12202b', category: 'Groceries' },
  { id: 'blinkit', name: 'Blinkit', color: '#f8cb46', ink: '#216a3b', category: 'Groceries' },
  { id: 'eatsure', name: 'EatSure', color: '#4d3fc0', ink: '#ffffff', category: 'Food' },
  { id: 'bigbasket', name: 'BigBasket', color: '#84c225', ink: '#183d21', category: 'Groceries' },
  { id: 'uber-eats', name: 'Uber Eats', color: '#06c167', ink: '#102721', category: 'Food' },
  { id: 'dominos', name: "Domino's", color: '#0078ae', ink: '#ffffff', category: 'Food' },
  { id: 'doordash', name: 'DoorDash', color: '#eb1700', ink: '#ffffff', category: 'Food' },
].map(brand => ({ ...brand, logo: `${import.meta.env?.BASE_URL || '/'}brands/${brand.id}.png` }));

export function getBrand(id) { return BRANDS.find(brand => brand.id === id) || BRANDS[0]; }

export function randomBrand(currentId, random = Math.random) {
  const choices = BRANDS.filter(brand => brand.id !== currentId);
  return choices[Math.floor(random() * choices.length)];
}

export function shuffledFleet(count, random = Math.random) {
  const fleet = [];
  while (fleet.length < count) {
    const bag = [...BRANDS];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    fleet.push(...bag);
  }
  return fleet.slice(0, count);
}

export function loadSelectedBrand(storage) {
  try { return getBrand(storage.getItem('neon-coast-brand-v1')); }
  catch { return BRANDS[0]; }
}
