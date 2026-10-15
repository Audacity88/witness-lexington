import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const fixtures = {
  pass: {},
  'failed-check': { expectation: 'false' },
  'page-error': { event: 'pageerror' },
  'console-error': { event: 'console' },
  'request-failed': { event: 'requestfailed' },
  'external-request': { event: 'request' },
  'step-error': { stepError: true },
  'navigation-error': { navigationError: true },
  'screenshot-error': { screenshotError: true },
  'empty-steps': { steps: [] },
  'zero-checks': { steps: [{ name: 'screenshot-only', shot: 'unchecked' }] },
  'empty-reports': { reports: [] },
  'zero-report-checks': { reports: [{ checks: [], errors: [], external: [] }] },
  'empty-report-in-matrix': { reports: [{ checks: ['passed'], errors: [], external: [] }, { checks: [], errors: [], external: [] }] },
  'layout-error': { reports: [{ checks: ['layout'], errors: [], external: [], problems: { intro: ['clipped'] } }] },
  'slice-failure': { reports: [{ checks: ['passed'], errors: [], external: [], failure: 'assertion failed' }] }
};

if (process.argv[2] === '--fixture') {
  const fixture = fixtures[process.argv[3]], directory = process.argv[4];
  if (fixture.reports) {
    const { verifyReports } = await import('./verify.mjs');
    verifyReports(fixture.reports);
  } else {
    const stepsFile = path.join(directory, 'steps.json');
    fs.writeFileSync(stepsFile, JSON.stringify(fixture.steps || [{ name: 'self-test expectation', expect: fixture.expectation || 'true', shot: 'self-test', wait: 1 }]));
    process.argv = [process.execPath, path.join(root, 'test/run.mjs'), 'http://127.0.0.1:8765', '960', '540', 'light', directory, stepsFile];
    const handlers = {};
    const page = {
      setViewport: async () => {}, emulateMediaFeatures: async () => {},
      on: (event, handler) => { handlers[event] = handler; },
      goto: async () => {
        if (fixture.navigationError) throw new Error('deliberate navigation error');
        if (fixture.event === 'pageerror') handlers.pageerror(new Error('deliberate page error'));
        if (fixture.event === 'console') handlers.console({ type: () => 'error', text: () => 'deliberate console error' });
        if (fixture.event === 'requestfailed') handlers.requestfailed({ url: () => 'http://127.0.0.1:8765/missing', failure: () => ({ errorText: 'deliberate request failure' }) });
        if (fixture.event === 'request') handlers.request({ url: () => 'https://external.invalid/asset' });
      },
      waitForFunction: async () => {}, screenshot: async () => {
        if (fixture.screenshotError) throw new Error('deliberate screenshot error');
      },
      evaluate: async expression => {
        if (expression === 'WitnessGame.pause(true)') return;
        if (fixture.stepError) throw new Error('deliberate step error');
        return expression === 'true';
      }
    };
    const puppeteer = { launch: async () => ({ newPage: async () => page, close: async () => { fs.writeFileSync(path.join(directory, 'closed'), 'yes'); } }) };
    const context = vm.createContext({ process, console, setTimeout, URL });
    const driver = new vm.SourceTextModule(fs.readFileSync(path.join(root, 'test/run.mjs'), 'utf8'), { context });
    await driver.link(async specifier => {
      if (specifier === './verify.mjs') return new vm.SourceTextModule(fs.readFileSync(path.join(root, 'test/verify.mjs'), 'utf8'), { context });
      assert.ok(['puppeteer-core', 'fs'].includes(specifier), specifier);
      return new vm.SyntheticModule(['default'], function () { this.setExport('default', specifier === 'fs' ? fs : puppeteer); }, { context });
    });
    await driver.evaluate();
  }
} else {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'wl-verify-'));
  try {
    for (const [name, fixture] of Object.entries(fixtures)) {
      const fixtureDirectory = path.join(directory, name);
      fs.mkdirSync(fixtureDirectory);
      const child = spawnSync(process.execPath, ['--experimental-vm-modules', fileURLToPath(import.meta.url), '--fixture', name, fixtureDirectory], { cwd: root, encoding: 'utf8', timeout: 10000 });
      assert.ifError(child.error);
      assert.equal(child.signal, null, name + ': child must exit normally');
      assert.equal(child.status, name === 'pass' ? 0 : 1, name + ': ' + child.stdout + child.stderr);
      if (fixture.navigationError || fixture.screenshotError) assert.match(child.stderr, /deliberate (navigation|screenshot) error/, name);
      else if (name !== 'pass') assert.match(child.stderr, /Playtest (failed|requires)/, name);
      if (!fixture.reports && !fixture.steps) assert.ok(fs.existsSync(path.join(fixtureDirectory, 'closed')), name + ': browser must close');
      if (name === 'failed-check') {
        const report = JSON.parse(fs.readFileSync(path.join(fixtureDirectory, 'results-960x540-light.json'), 'utf8'));
        assert.equal(report.checks.length, 1);
        assert.match(report.errors[0], /EXPECT FAILED self-test expectation: false/);
        assert.ok(fs.existsSync(path.join(fixtureDirectory, 'closed')));
      }
      console.log('PASS ' + name + (name === 'pass' ? ' exits 0' : ' exits 1 (expected failure)'));
    }
    const nodeStub = path.join(directory, 'node'), callsFile = path.join(directory, 'calls');
    fs.writeFileSync(nodeStub, '#!/bin/sh\nprintf "called\\n" >> "$WL_VERIFY_CALLS"\nif [ "$(wc -l < "$WL_VERIFY_CALLS")" -eq 1 ]; then exit 7; fi\nexit 0\n', { mode: 0o755 });
    const matrix = spawnSync('/bin/bash', ['test/run-all.sh'], { cwd: root, env: { ...process.env, PATH: directory + path.delimiter + process.env.PATH, WL_VERIFY_CALLS: callsFile }, encoding: 'utf8' });
    assert.ifError(matrix.error);
    assert.equal(matrix.status, 7, matrix.stderr);
    assert.equal(fs.readFileSync(callsFile, 'utf8'), 'called\n');
    console.log('PASS matrix preserves the first non-zero exit');
    console.log(JSON.stringify({ kind: 'verification exit-code self-test with browser double; no browser launched', checks: Object.keys(fixtures).length + 1 }));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
