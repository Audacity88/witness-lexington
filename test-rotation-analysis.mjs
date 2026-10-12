// Measure rotation behavior to verify no strobing
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader']
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });

console.log('Loading test page...');
await page.goto('http://127.0.0.1:8765/manual-globe-test.html', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 2000));

// Wait for world to be created
await page.waitForFunction(() => window.W && window.W.globe, { timeout: 5000 });

// Inject measurement code
await page.evaluate(() => {
  window.measurements = [];
  window.lastAngle = null;
  
  // Wrap the placeGlobe function to track rotation
  const origPlace = window.W.globe.place;
  window.W.globe.place = function(u) {
    const result = origPlace.call(this, u);
    
    // Get current globe rotation
    const rotation = window.W.globe.scene.children.find(c => c.type === 'Group');
    if (rotation) {
      const angle = rotation.rotation.y * (180 / Math.PI); // Convert to degrees
      const normalizedAngle = ((angle % 360) + 360) % 360; // Normalize to 0-360
      
      if (window.lastAngle !== null) {
        let delta = normalizedAngle - window.lastAngle;
        
        // Detect direction changes (reversals)
        if (Math.abs(delta) > 180) {
          // Wrapped around 0/360
          if (delta > 0) delta -= 360;
          else delta += 360;
        }
        
        window.measurements.push({
          u: u.toFixed(4),
          angle: normalizedAngle.toFixed(2),
          delta: delta.toFixed(2),
          year: result.year
        });
      }
      
      window.lastAngle = normalizedAngle;
    }
    
    return result;
  };
  
  console.log('Measurement instrumentation installed');
});

console.log('\nSimulating continuous animation...');

// Simulate the full animation by calling placeGlobe at many points
const steps = 200; // Simulate 200 frames over the transition
for (let i = 0; i <= steps; i++) {
  const u = i / steps;
  await page.evaluate((u) => {
    window.test(u);
  }, u);
  await new Promise(r => setTimeout(r, 10)); // Small delay between measurements
}

console.log('Animation simulation complete, analyzing...');

const analysis = await page.evaluate(() => {
  const m = window.measurements;
  if (!m || m.length === 0) return { error: 'No measurements' };
  
  // Analyze the deltas
  let reversals = 0;
  let lastSign = null;
  let maxDelta = 0;
  let maxReverseDelta = 0;
  
  for (let i = 0; i < m.length; i++) {
    const delta = parseFloat(m[i].delta);
    const absDelta = Math.abs(delta);
    
    if (absDelta > maxDelta) maxDelta = absDelta;
    
    // Check for direction change (reversal)
    const sign = delta >= 0 ? 1 : -1;
    if (lastSign !== null && sign !== lastSign) {
      reversals++;
      if (absDelta > maxReverseDelta) maxReverseDelta = absDelta;
    }
    lastSign = sign;
  }
  
  // Get sample measurements
  const samples = [
    m[0],
    m[Math.floor(m.length * 0.25)],
    m[Math.floor(m.length * 0.5)],
    m[Math.floor(m.length * 0.75)],
    m[m.length - 1]
  ].filter(Boolean);
  
  return {
    totalMeasurements: m.length,
    reversals: reversals,
    maxDeltaDegrees: maxDelta.toFixed(2),
    maxReverseDelta: maxReverseDelta.toFixed(2),
    samples: samples,
    allDeltas: m.map(x => parseFloat(x.delta))
  };
});

console.log('\n=== ROTATION ANALYSIS ===');
console.log(`Total measurements: ${analysis.totalMeasurements}`);
console.log(`Reversals detected: ${analysis.reversals}`);
console.log(`Max angular change per frame: ${analysis.maxDeltaDegrees}°`);
console.log(`Max reversal delta: ${analysis.maxReverseDelta}°`);

console.log('\nSample measurements:');
analysis.samples.forEach(s => {
  console.log(`  u=${s.u}: angle=${s.angle}° delta=${s.delta}° year=${s.year}`);
});

// Check direction consistency
const posDeltas = analysis.allDeltas.filter(d => d > 1).length;
const negDeltas = analysis.allDeltas.filter(d => d < -1).length;
console.log(`\nDirection consistency:`);
console.log(`  Positive (westward): ${posDeltas} frames`);
console.log(`  Negative (eastward): ${negDeltas} frames`);

console.log('\n=== RESULTS ===');
if (analysis.reversals === 0) {
  console.log('✓ PASS: No reversals detected - rotation is monotonic');
} else {
  console.log(`✗ FAIL: ${analysis.reversals} reversals detected`);
}

const maxAllowed = 90;
if (parseFloat(analysis.maxDeltaDegrees) <= maxAllowed) {
  console.log(`✓ PASS: Max ${analysis.maxDeltaDegrees}° per frame (limit: ${maxAllowed}°)`);
} else {
  console.log(`✗ FAIL: Max ${analysis.maxDeltaDegrees}° per frame exceeds ${maxAllowed}° limit`);
}

await browser.close();
