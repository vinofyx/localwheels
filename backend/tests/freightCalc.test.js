/**
 * Unit tests for freightCalc.js
 * Run: node backend/tests/freightCalc.test.js
 * No external dependencies — uses Node built-in assert.
 */
const assert = require('assert');
const {
  DEFAULT_CATALOG,
  estimateDistance,
  calcVolumetricWeight,
  selectVehicle,
  computePrice,
  getTransitDays,
} = require('../src/utils/freightCalc');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(`        ${e.message}`);
    failed++;
  }
}

// ── estimateDistance ──────────────────────────────────────────────────────────
console.log('\nestimateDistance');

test('identical pincodes → 15 km', () => {
  assert.strictEqual(estimateDistance('400001', '400001'), 15);
});

test('same 4-digit prefix → 35 km', () => {
  assert.strictEqual(estimateDistance('400001', '400099'), 35);
});

test('same 3-digit prefix → 100 km', () => {
  assert.strictEqual(estimateDistance('400001', '400999'), 100);
});

test('same 2-digit prefix → 250 km', () => {
  // '40' === '40', but '400' !== '401'
  assert.strictEqual(estimateDistance('400001', '401999'), 250);
});

test('same first digit → 650 km', () => {
  assert.strictEqual(estimateDistance('400001', '499999'), 650);
});

test('different first digit → 1400 km', () => {
  assert.strictEqual(estimateDistance('110001', '600001'), 1400);
});

test('missing pincodes → 300 km fallback', () => {
  assert.strictEqual(estimateDistance(null, null), 300);
  assert.strictEqual(estimateDistance('', ''), 300);
});

// ── calcVolumetricWeight ──────────────────────────────────────────────────────
console.log('\ncalcVolumetricWeight');

test('100 × 50 × 50 → 50 kg', () => {
  assert.strictEqual(calcVolumetricWeight(100, 50, 50), 50);
});

test('60 × 40 × 30 → 14.4 kg', () => {
  assert.strictEqual(calcVolumetricWeight(60, 40, 30), 14.4);
});

test('null dimensions → 0', () => {
  assert.strictEqual(calcVolumetricWeight(null, null, null), 0);
  assert.strictEqual(calcVolumetricWeight(0, 100, 100), 0);
});

// ── selectVehicle ─────────────────────────────────────────────────────────────
console.log('\nselectVehicle');

test('5 kg → smallest sufficient vehicle', () => {
  const v = selectVehicle(5, DEFAULT_CATALOG);
  assert.ok(v.capacity_kg >= 5, `capacity ${v.capacity_kg} should be >= 5`);
});

test('100 kg → vehicle with capacity ≥ 100 kg', () => {
  const v = selectVehicle(100, DEFAULT_CATALOG);
  assert.ok(v.capacity_kg >= 100, `capacity ${v.capacity_kg} should be >= 100`);
});

test('750 kg → exactly matches 750 kg vehicle or next up', () => {
  const v = selectVehicle(750, DEFAULT_CATALOG);
  assert.ok(v.capacity_kg >= 750);
});

test('overweight → largest vehicle', () => {
  const v   = selectVehicle(999999, DEFAULT_CATALOG);
  const max = Math.max(...DEFAULT_CATALOG.map(c => c.capacity_kg));
  assert.strictEqual(v.capacity_kg, max);
});

// ── computePrice ──────────────────────────────────────────────────────────────
console.log('\ncomputePrice');

test('grand_total > 0 for basic shipment', () => {
  const v = selectVehicle(100, DEFAULT_CATALOG);
  const p = computePrice(v, 200, {});
  assert.ok(p.grand_total > 0, `grand_total was ${p.grand_total}`);
});

test('grand_total = subtotal + gst + insurance + loading + unloading', () => {
  const v = selectVehicle(500, DEFAULT_CATALOG);
  const p = computePrice(v, 350, { insurance: true, declared_value: 100000, loading: true, unloading: true });
  const expected = p.subtotal + p.gst_amount + p.insurance_amount + p.loading_charges + p.unloading_charges;
  assert.strictEqual(p.grand_total, expected, `expected ${expected}, got ${p.grand_total}`);
});

test('insurance adds cost when declared value provided', () => {
  const v       = selectVehicle(100, DEFAULT_CATALOG);
  const without = computePrice(v, 200, { declared_value: 50000 });
  const with_ins = computePrice(v, 200, { insurance: true, declared_value: 50000 });
  assert.ok(with_ins.grand_total > without.grand_total, 'Insurance should increase total');
  assert.ok(with_ins.insurance_amount > 0, 'Insurance amount should be > 0');
});

test('no insurance when declared_value is 0', () => {
  const v = selectVehicle(100, DEFAULT_CATALOG);
  const p = computePrice(v, 200, { insurance: true, declared_value: 0 });
  assert.strictEqual(p.insurance_amount, 0);
});

test('express priority increases total vs standard', () => {
  const v    = selectVehicle(100, DEFAULT_CATALOG);
  const std  = computePrice(v, 200, { priority: 'standard' });
  const expr = computePrice(v, 200, { priority: 'express' });
  assert.ok(expr.grand_total > std.grand_total, `express ${expr.grand_total} should > standard ${std.grand_total}`);
});

test('premium priority > express > standard', () => {
  const v    = selectVehicle(100, DEFAULT_CATALOG);
  const std  = computePrice(v, 200, { priority: 'standard' });
  const expr = computePrice(v, 200, { priority: 'express' });
  const prem = computePrice(v, 200, { priority: 'premium' });
  assert.ok(prem.grand_total > expr.grand_total);
  assert.ok(expr.grand_total > std.grand_total);
});

test('state_tax applied for distance > 200 km', () => {
  const v   = selectVehicle(100, DEFAULT_CATALOG);
  const far = computePrice(v, 201, {});
  const near = computePrice(v, 100, {});
  assert.ok(far.state_tax > 0, 'Should have state tax for 201 km');
  assert.strictEqual(near.state_tax, 0, 'No state tax for 100 km');
});

test('dynamic fuel_surcharge_pct overrides rule default', () => {
  const v       = selectVehicle(100, DEFAULT_CATALOG);
  const base    = computePrice(v, 200, {});
  const highFuel = computePrice({ ...v, fuel_surcharge_pct: 20 }, 200, {});
  assert.ok(highFuel.fuel_surcharge > base.fuel_surcharge, 'Higher fuel % should give higher surcharge');
});

// ── getTransitDays ────────────────────────────────────────────────────────────
console.log('\ngetTransitDays');

test('returns a non-empty string', () => {
  const t = getTransitDays(500, 'standard');
  assert.strictEqual(typeof t, 'string');
  assert.ok(t.length > 0);
});

test('express is faster than standard', () => {
  const std  = getTransitDays(600, 'standard');
  const expr = getTransitDays(600, 'express');
  assert.notStrictEqual(std, expr, 'Express and standard transit should differ at 600 km');
});

test('same day for very short distance', () => {
  const t = getTransitDays(30, 'standard');
  assert.strictEqual(t, 'Same day');
});

// ── DEFAULT_CATALOG ───────────────────────────────────────────────────────────
console.log('\nDEFAULT_CATALOG');

test('has exactly 9 vehicle types', () => {
  assert.strictEqual(DEFAULT_CATALOG.length, 9);
});

test('capacity_kg is strictly increasing', () => {
  const caps = DEFAULT_CATALOG.map(v => v.capacity_kg);
  for (let i = 1; i < caps.length; i++) {
    assert.ok(caps[i] > caps[i - 1], `capacity_kg at index ${i} (${caps[i]}) should > index ${i - 1} (${caps[i - 1]})`);
  }
});

test('all required rate fields present', () => {
  DEFAULT_CATALOG.forEach(v => {
    ['base_rate', 'per_km_rate', 'fuel_surcharge_pct', 'gst_rate', 'insurance_rate'].forEach(f => {
      assert.ok(v[f] !== undefined, `${v.vehicle_type} missing field: ${f}`);
    });
  });
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
