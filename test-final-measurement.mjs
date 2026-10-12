// Final measurement of rotation behavior using the built bundle
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader']
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });

console.log('Loading dist/witness-game.html...');
await page.goto('file:///workspace/dist/witness-game.html', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 5000)); // Wait for all scripts to load

// Get access to the world and globe
const hasGlobe = await page.evaluate(() => {
  return typeof window.WGWorld !== 'undefined';
});

if (!hasGlobe) {
  console.log('✗ WGWorld not loaded properly');
  await browser.close();
  process.exit(1);
}

console.log('✓ WGWorld loaded');

// Simulate the globe animation by calling placeGlobe at many points
console.log('\nSimulating globe transition (100 steps)...');

const measurements = await page.evaluate(() => {
  // Create a world instance just for the globe
  const container = document.createElement('div');
  document.body.appendChild(container);
  const W = window.WGWorld.create(container);
  
  const results = [];
  let lastAngle = null;
  
  for (let i = 0; i <= 100; i++) {
    const u = i / 100;
    W.globe.place(u);
    
    // Get the globe group's rotation
    const globe = W.globe.scene.children.find(c => c.type === 'Group');
    if (globe) {
      const angleDeg = globe.rotation.y * (180 / Math.PI);
      
      if (lastAngle !== null) {
        let delta = angleDeg - lastAngle;
        // Normalize delta
        while (delta > 180) delta -= 360;
        while (delta < -180) delta += 360;
        
        results.push({ u, angle: angleDeg, delta });
      }
      
      lastAngle = angleDeg;
    }
  }
  
  return results;
});

console.log(`\nCollected ${measurements.length} deltas`);

// Analyze
let reversals = 0;
let lastSign = null;
let maxAbsDelta = 0;

for (const m of measurements) {
  const absDelta = Math.abs(m.delta);
  if (absDelta > maxAbsDelta) maxAbsDelta = absDelta;
  
  const sign = Math.sign(m.delta);
  if (lastSign !== null && sign !== 0 && lastSign !== 0 && sign !== lastSign) {
    reversals++;
  }
  if (sign !== 0) lastSign = sign;
}

// Direction stats
const westward = measurements.filter(m => m.delta < -0.1).length;
const eastward = measurements.filter(m => m.delta > 0.1).length;

console.log('\n=== ROTATION MEASUREMENT RESULTS ===');
console.log(`Reversals detected: ${reversals}`);
console.log(`Max angular change per step: ${maxAbsDelta.toFixed(2)}°`);
console.log(`\nDirection:`);
console.log(`  Westward (negative Δ): ${westward} steps`);
console.log(`  Eastward (positive Δ): ${eastward} steps`);

// Sample a few deltas to show
console.log(`\nSample deltas:`);
const samples = [0, 25, 50, 75, measurements.length - 1];
samples.forEach(i => {
  if (measurements[i]) {
    console.log(`  Step ${i}: ${measurements[i].delta.toFixed(2)}° (u=${measurements[i].u.toFixed(2)})`);
  }
});

console.log('\n=== VERDICT ===');
if (reversals === 0) {
  console.log('✓ PASS: Rotation is monotonic - zero reversals');
} else {
  console.log(`✗ FAIL: ${reversals} apparent reversals detected`);
}

if (maxAbsDelta <= 90) {
  console.log(`✓ PASS: Max ${maxAbsDelta.toFixed(2)}° per step (limit: 90°/frame)`);
} else {
  console.log(`✗ FAIL: Max ${maxAbsDelta.toFixed(2)}° exceeds 90° limit`);
}

await browser.close();
