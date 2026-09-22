/**
 * =============================================================================
 * LAYER: Infrastructure / Harness Tests
 * MODULE: tests/harness/specs/11-project-setup.test.ts
 * 
 * DESCRIPTION:
 * Comprehensive validation suite for the agnostic project setup wizard
 * (scripts/setup-project.js) and optional Linear integration.
 * =============================================================================
 */

import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createSandboxWorkspace } from '../runner/sandbox-builder';

// Import unit utilities from setup-project.js
const setupScriptPath = path.resolve(__dirname, '../../../scripts/setup-project.js');
const {
  parseArgs,
  slugify,
  normalizeDeveloperHandle,
  updateEnvContent
} = require(setupScriptPath);

describe('11 - Agnostic Project Setup & First-Time Configuration Wizard', () => {
  // Step 1: Unit tests on utility functions
  describe('Unit Utilities', () => {
    test('slugify converts raw names to clean identifiers', () => {
      // Step 1.1: Verify string normalization and space/special character stripping
      expect(slugify('My Super Project')).toBe('my-super-project');
      expect(slugify('Next_Building-App!!')).toBe('next-building-app');
      expect(slugify('  Leading and Trailing  ')).toBe('leading-and-trailing');
      expect(slugify('')).toBe('');
    });

    test('normalizeDeveloperHandle creates valid handles', () => {
      // Step 1.2: Verify developer handle sanitization
      expect(normalizeDeveloperHandle('Alice_Dev')).toBe('alice-dev');
      expect(normalizeDeveloperHandle('John.Doe')).toBe('john-doe');
      expect(normalizeDeveloperHandle('JayMusicMachine')).toBe('jaymusicmachine');
    });

    test('parseArgs parses CLI flags correctly', () => {
      // Step 1.3: Verify flag extraction
      const args = parseArgs([
        '--project-name', 'cool-app',
        '--developer', 'alice',
        '--skip-linear',
        '--non-interactive'
      ]);

      expect(args.projectName).toBe('cool-app');
      expect(args.developer).toBe('alice');
      expect(args.skipLinear).toBe(true);
      expect(args.nonInteractive).toBe(true);
      expect(args.help).toBe(false);
    });

    test('updateEnvContent updates existing keys and appends new ones', () => {
      // Step 1.4: Verify .env string manipulation
      const initial = 'DATABASE_URL=postgresql://localhost:5432/db\nDEFAULT_OWNER=old_dev\n';
      const updated = updateEnvContent(initial, {
        DEFAULT_OWNER: 'new_dev',
        LINEAR_ENABLED: 'false',
        DEFAULT_ISSUE_PREFIX: 'TASK'
      });

      expect(updated).toContain('DATABASE_URL=postgresql://localhost:5432/db');
      expect(updated).toContain('DEFAULT_OWNER=new_dev');
      expect(updated).not.toContain('DEFAULT_OWNER=old_dev');
      expect(updated).toContain('LINEAR_ENABLED=false');
      expect(updated).toContain('DEFAULT_ISSUE_PREFIX=TASK');
    });
  });

  // Step 2: Sandbox integration test simulating a fresh clone setup
  describe('Sandbox Execution (Fresh Clone Simulation)', () => {
    test('setup-project.js executes cleanly in standalone mode with Linear skipped', () => {
      const sandbox = createSandboxWorkspace('project_setup_standalone');

      try {
        // Step 2.1: Populate mock monorepo files in sandbox
        sandbox.createFile('package.json', JSON.stringify({
          name: 'starter-kit',
          version: '0.1.0',
          scripts: {}
        }, null, 2));

        sandbox.createFile('apps/web/package.json', JSON.stringify({
          name: '@starter-kit/web',
          version: '0.1.0'
        }, null, 2));

        sandbox.createFile('.agents/hooks.json', JSON.stringify({
          enforcement_rules: {
            allowed_developer_handles: ['*'],
            require_linear_issue_exists: false
          }
        }, null, 2));

        sandbox.createFile('.env.example', 'NEXT_PUBLIC_APP_URL=http://localhost:3000\n');

        // Step 2.2: Run setup-project.js in non-interactive mode
        const cmd = `node "${setupScriptPath}" --cwd "${sandbox.sandboxPath}" --non-interactive --project-name "my-cool-saas" --developer "bob-builder" --skip-linear`;
        execSync(cmd, { cwd: sandbox.sandboxPath, stdio: 'pipe' });

        // Step 2.3: Verify package.json updates
        const pkg = JSON.parse(fs.readFileSync(path.join(sandbox.sandboxPath, 'package.json'), 'utf8'));
        expect(pkg.name).toBe('my-cool-saas');
        expect(pkg.scripts.setup).toBe('node ./scripts/setup-project.js');

        // Step 2.4: Verify apps/web/package.json updates
        const webPkg = JSON.parse(fs.readFileSync(path.join(sandbox.sandboxPath, 'apps/web/package.json'), 'utf8'));
        expect(webPkg.name).toBe('@my-cool-saas/web');

        // Step 2.5: Verify .agents/hooks.json updates
        const hooks = JSON.parse(fs.readFileSync(path.join(sandbox.sandboxPath, '.agents/hooks.json'), 'utf8'));
        expect(hooks.enforcement_rules.allowed_developer_handles).toEqual(['bob-builder']);
        expect(hooks.enforcement_rules.require_linear_issue_exists).toBe(false);

        // Step 2.6: Verify .agents/project_config.json creation
        const projectConfig = JSON.parse(fs.readFileSync(path.join(sandbox.sandboxPath, '.agents/project_config.json'), 'utf8'));
        expect(projectConfig.projectName).toBe('my-cool-saas');
        expect(projectConfig.projectSlug).toBe('my-cool-saas');
        expect(projectConfig.developerHandle).toBe('bob-builder');
        expect(projectConfig.linear.enabled).toBe(false);
        expect(projectConfig.linear.issuePrefix).toBe('TASK');
        expect(projectConfig.setupCompleted).toBe(true);

        // Step 2.7: Verify .env.local content
        const envLocal = fs.readFileSync(path.join(sandbox.sandboxPath, '.env.local'), 'utf8');
        expect(envLocal).toContain('DEFAULT_OWNER=bob-builder');
        expect(envLocal).toContain('DEFAULT_ISSUE_PREFIX=TASK');
        expect(envLocal).toContain('LINEAR_ENABLED=false');
      } finally {
        sandbox.cleanup();
      }
    });

    test('setup-project.js configures Linear integration when provided with API key and prefix', () => {
      const sandbox = createSandboxWorkspace('project_setup_linear');

      try {
        sandbox.createFile('package.json', JSON.stringify({
          name: 'starter-kit',
          version: '0.1.0'
        }, null, 2));

        sandbox.createFile('apps/web/package.json', JSON.stringify({
          name: '@starter-kit/web'
        }, null, 2));

        sandbox.createFile('.agents/hooks.json', JSON.stringify({
          enforcement_rules: {
            allowed_developer_handles: ['*'],
            require_linear_issue_exists: false
          }
        }, null, 2));

        // Step 2.8: Run setup-project.js with Linear configuration flags
        const cmd = `node "${setupScriptPath}" --cwd "${sandbox.sandboxPath}" --non-interactive --project-name "linear-enterprise" --developer "clara" --linear-key "lin_api_secret123" --linear-prefix "ENT"`;
        execSync(cmd, { cwd: sandbox.sandboxPath, stdio: 'pipe' });

        // Step 2.9: Verify hooks and config
        const hooks = JSON.parse(fs.readFileSync(path.join(sandbox.sandboxPath, '.agents/hooks.json'), 'utf8'));
        expect(hooks.enforcement_rules.allowed_developer_handles).toEqual(['clara']);
        expect(hooks.enforcement_rules.require_linear_issue_exists).toBe(true);

        const projectConfig = JSON.parse(fs.readFileSync(path.join(sandbox.sandboxPath, '.agents/project_config.json'), 'utf8'));
        expect(projectConfig.linear.enabled).toBe(true);
        expect(projectConfig.linear.issuePrefix).toBe('ENT');

        const envLocal = fs.readFileSync(path.join(sandbox.sandboxPath, '.env.local'), 'utf8');
        expect(envLocal).toContain('DEFAULT_OWNER=clara');
        expect(envLocal).toContain('DEFAULT_ISSUE_PREFIX=ENT');
        expect(envLocal).toContain('LINEAR_ENABLED=true');
        expect(envLocal).toContain('LINEAR_API_KEY=lin_api_secret123');
      } finally {
        sandbox.cleanup();
      }
    });

    test('linear-status.js exits with code 0 when LINEAR_ENABLED=false', () => {
      const linearStatusScript = path.resolve(__dirname, '../../../scripts/linear-status.js');
      const output = execSync(`node "${linearStatusScript}" --state start`, {
        env: { ...process.env, LINEAR_ENABLED: 'false' },
        encoding: 'utf8'
      });
      expect(output).toContain('Linear integration is disabled (LINEAR_ENABLED=false)');
    });

    test('dynamic developer handle check in hooks.json permits configured developer or wildcard', () => {
      const hooksPath = path.resolve(__dirname, '../../../.agents/hooks.json');
      const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
      const allowed = hooks.enforcement_rules?.allowed_developer_handles || ['*'];

      // Wildcard check
      const checkDev = (dev: string) => allowed.includes('*') || allowed.length === 0 || allowed.includes(dev);
      expect(checkDev('random-new-dev')).toBe(true);
    });
  });
});
