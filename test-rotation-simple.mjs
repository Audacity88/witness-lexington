// Simple rotation measurement test
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader']
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });

console.log('Loading page...');
await page.goto('http://127.0.0.1:8765/manual-globe-test.html', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 3000));

// Test by calling the test function with different u values
console.log('\nMeasuring rotation at various points...');

const measurements = [];
const steps = 100;

for (let i = 0; i <= steps; i++) {
  const u = i / steps;
  const result = await page.evaluate((u) => {
    try {
      // Call test function which calls W.globe.place(u)
      window.test(u);
      
      // Get the globe rotation
      const globe = window.W.globe.scene.children.find(c => c.type === 'Group');
      if (globe) {
        const angleDeg = globe.rotation.y * (180 / Math.PI);
        return { u, angle: angleDeg, success: true };
      }
      return { u, success: false, error: 'Globe not found' };
    } catch (e) {
      return { u, success: false, error: e.message };
    }
  }, u);
  
  if (result.success) {
    measurements.push(result);
  } else {
    console.log(`Warning at u=${u}:`, result.error);
  }
}

console.log(`\nCollected ${measurements.length} measurements`);

// Analyze for reversals
let reversals = 0;
let lastDelta = null;
let maxDelta = 0;
const deltas = [];

for (let i = 1; i < measurements.length; i++) {
  let delta = measurements[i].angle - measurements[i - 1].angle;
  
  // Normalize delta (handle wrapping)
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  
  deltas.push(delta);
  
  const absDelta = Math.abs(delta);
  if (absDelta > maxDelta) maxDelta = absDelta;
  
  // Check for reversal
  if (lastDelta !== null) {
    const lastSign = Math.sign(lastDelta);
    const currSign = Math.sign(delta);
    if (lastSign !== 0 && currSign !== 0 && lastSign !== currSign) {
      reversals++;
    }
  }
  
  lastDelta = delta;
}

console.log('\n=== ANALYSIS ===');
console.log(`Reversals: ${reversals}`);
console.log(`Max angular change: ${maxDelta.toFixed(2)}°`);

// Show sample deltas
console.log('\nSample deltas (degrees per step):');
const sampleIndices = [0, Math.floor(deltas.length * 0.25), Math.floor(deltas.length * 0.5), Math.floor(deltas.length * 0.75), deltas.length - 1];
sampleIndices.forEach(i => {
  if (deltas[i] !== undefined) {
    console.log(`  Step ${i}: ${deltas[i].toFixed(2)}°`);
  }
});

// Check for monotonic rotation
const posCount = deltas.filter(d => d > 0.1).length;
const negCount = deltas.filter(d => d < -0.1).length;

console.log(`\nDirection analysis:`);
console.log(`  Westward (negative): ${negCount} steps`);
console.log(`  Eastward (positive): ${posCount} steps`);
console.log(`  Near-zero: ${deltas.length - posCount - negCount} steps`);

console.log('\n=== RESULT ===');
if (reversals === 0) {
  console.log('✓ PASS: Rotation is monotonic (no reversals)');
} else {
  console.log(`✗ FAIL: ${reversals} reversals detected`);
}

if (maxDelta <= 90) {
  console.log(`✓ PASS: Max ${maxDelta.toFixed(2)}° per step (within 90° limit)`);
} else {
  console.log(`✗ FAIL: Max ${maxDelta.toFixed(2)}° exceeds 90° limit`);
}

await browser.close();
