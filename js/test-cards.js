/**
 * Test suite for card loading and management
 * Run with: node js/test-cards.js
 */

const fs = require('fs');
const path = require('path');

// Load cards.json
const cardsPath = path.join(__dirname, 'cards.json');
const cardPool = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

// Helper functions from utils.js
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function drawCard(cardPool, exclude = []) {
  const available = cardPool.filter(card => !exclude.includes(card.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function getNextThreeCards(cardPool, previousCards = []) {
  if (!cardPool || cardPool.length === 0) {
    return [];
  }

  const excludeIds = previousCards.map(c => c.id);
  const nextCards = [];

  for (let i = 0; i < 3; i++) {
    const card = drawCard(cardPool, excludeIds);
    if (card) {
      nextCards.push(card);
      excludeIds.push(card.id);
    }
  }

  return nextCards;
}

// Test 1: Verify cards.json structure
console.log('Test 1: Verify cards.json structure');
console.log(`  Total cards: ${cardPool.length}`);
let structureValid = true;
cardPool.forEach((card, idx) => {
  if (!card.id || !card.title || !card.desc || !card.effects || card.variance === undefined) {
    console.log(`  ✗ Card ${idx} has invalid structure`);
    structureValid = false;
  }
});
if (structureValid) console.log('  ✓ All cards have valid structure');

// Test 2: Verify 30+ cards
console.log('\nTest 2: Verify 30+ cards');
if (cardPool.length >= 30) {
  console.log(`  ✓ PASS: ${cardPool.length} cards (requirement: 30+)`);
} else {
  console.log(`  ✗ FAIL: ${cardPool.length} cards (requirement: 30+)`);
}

// Test 3: Verify 5+ negative effect cards
console.log('\nTest 3: Verify 5+ negative effect cards');
const negativeCards = cardPool.filter(c => {
  const effects = Object.values(c.effects);
  return effects.every(e => e <= 0);
});
if (negativeCards.length >= 5) {
  console.log(`  ✓ PASS: ${negativeCards.length} negative cards (requirement: 5+)`);
} else {
  console.log(`  ✗ FAIL: ${negativeCards.length} negative cards (requirement: 5+)`);
}

// Test 4: Verify 8+ mixed effect cards
console.log('\nTest 4: Verify 8+ mixed effect cards');
const mixedCards = cardPool.filter(c => {
  const effects = Object.values(c.effects);
  const hasNeg = effects.some(e => e < 0);
  const hasPos = effects.some(e => e > 0);
  return hasNeg && hasPos;
});
if (mixedCards.length >= 8) {
  console.log(`  ✓ PASS: ${mixedCards.length} mixed cards (requirement: 8+)`);
} else {
  console.log(`  ✗ FAIL: ${mixedCards.length} mixed cards (requirement: 8+)`);
}

// Test 5: Card uniqueness per turn (Property 2)
console.log('\nTest 5: Card Selection Uniqueness (Property 2)');
let uniquenessPass = true;
for (let turn = 0; turn < 100; turn++) {
  const cards = getNextThreeCards(cardPool, []);
  const ids = cards.map(c => c.id);
  const uniqueIds = new Set(ids);
  
  if (ids.length !== uniqueIds.size) {
    console.log(`  ✗ Turn ${turn}: Duplicate cards found`);
    uniquenessPass = false;
    break;
  }
}
if (uniquenessPass) {
  console.log('  ✓ PASS: 100 turns tested, no duplicates found');
}

// Test 6: Card effects are within valid range
console.log('\nTest 6: Card effects within valid range');
let effectsValid = true;
cardPool.forEach((card, idx) => {
  for (const [key, value] of Object.entries(card.effects)) {
    if (typeof value !== 'number' || isNaN(value)) {
      console.log(`  ✗ Card ${idx} (${card.id}): ${key} is not a valid number`);
      effectsValid = false;
    }
  }
});
if (effectsValid) {
  console.log('  ✓ PASS: All card effects are valid numbers');
}

// Test 7: Variance is valid
console.log('\nTest 7: Card variance is valid');
let varianceValid = true;
cardPool.forEach((card, idx) => {
  if (typeof card.variance !== 'number' || card.variance < 0) {
    console.log(`  ✗ Card ${idx} (${card.id}): variance is invalid`);
    varianceValid = false;
  }
});
if (varianceValid) {
  console.log('  ✓ PASS: All card variances are valid');
}

// Test 8: getNextThreeCards returns exactly 3 cards
console.log('\nTest 8: getNextThreeCards returns exactly 3 cards');
const testCards = getNextThreeCards(cardPool, []);
if (testCards.length === 3) {
  console.log(`  ✓ PASS: Returned ${testCards.length} cards`);
} else {
  console.log(`  ✗ FAIL: Returned ${testCards.length} cards (expected 3)`);
}

// Test 9: getNextThreeCards excludes previous cards
console.log('\nTest 9: getNextThreeCards excludes previous cards');
const previousCards = getNextThreeCards(cardPool, []);
const nextCards = getNextThreeCards(cardPool, previousCards);
const previousIds = previousCards.map(c => c.id);
const nextIds = nextCards.map(c => c.id);
const overlap = nextIds.filter(id => previousIds.includes(id));
if (overlap.length === 0) {
  console.log('  ✓ PASS: No overlap between previous and next cards');
} else {
  console.log(`  ✗ FAIL: Found ${overlap.length} overlapping cards`);
}

console.log('\n✓ All tests completed');
