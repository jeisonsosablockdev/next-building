#!/usr/bin/env node
/**
 * =============================================================================
 * LAYER: Infrastructure / Tooling / Project Setup
 * MODULE: scripts/setup-project.js
 * 
 * DESCRIPTION:
 * Interactive first-time project configuration wizard.
 * Prompts the developer for:
 *   1. Developer handle (registered in .agents/hooks.json)
 *   2. Project name (updates root package.json and apps/web/package.json)
 *   3. Linear integration configuration (with explicit skip option)
 * 
 * Can also be run in headless / non-interactive mode via flags:
 *   node ./scripts/setup-project.js --non-interactive \
 *     --developer <handle> --project-name <name> --skip-linear
 * =============================================================================
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");

function getPaths(baseDir = process.env.PROJECT_ROOT || process.cwd()) {
  const targetDir = path.resolve(baseDir);
  return {
    rootDir: targetDir,
    packageJsonPath: path.join(targetDir, "package.json"),
    webPackageJsonPath: path.join(targetDir, "apps/web/package.json"),
    hooksJsonPath: path.join(targetDir, ".agents/hooks.json"),
    projectConfigPath: path.join(targetDir, ".agents/project_config.json"),
    envExamplePath: path.join(targetDir, ".env.example"),
    envLocalPath: path.join(targetDir, ".env.local"),
  };
}

/**
 * Normalizes a string into a clean lowercase URL/slug-friendly identifier.
 * 
 * @param {string} raw - Raw input string
 * @returns {string} - Slugified string
 */
function slugify(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

/**
 * Normalizes a developer handle.
 * 
 * @param {string} raw - Raw developer username/handle
 * @returns {string} - Normalized handle
 */
function normalizeDeveloperHandle(raw) {
  return slugify(raw);
}

/**
 * Parses command-line arguments for non-interactive or customized execution.
 * 
 * @param {string[]} argv - Command line arguments
 * @returns {Record<string, any>} - Parsed argument flags
 */
function parseArgs(argv) {
  const args = {
    projectName: "",
    developer: "",
    linearKey: "",
    linearPrefix: "",
    skipLinear: false,
    nonInteractive: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }

    if (token === "--non-interactive") {
      args.nonInteractive = true;
      continue;
    }

    if (token === "--skip-linear") {
      args.skipLinear = true;
      continue;
    }

    if (token === "--project-name" && next && !next.startsWith("--")) {
      args.projectName = next;
      i += 1;
      continue;
    }

    if (token === "--developer" && next && !next.startsWith("--")) {
      args.developer = next;
      i += 1;
      continue;
    }

    if (token === "--linear-key" && next && !next.startsWith("--")) {
      args.linearKey = next;
      i += 1;
      continue;
    }

    if (token === "--linear-prefix" && next && !next.startsWith("--")) {
      args.linearPrefix = next;
      i += 1;
      continue;
    }

    if (token === "--cwd" && next && !next.startsWith("--")) {
      args.cwd = next;
      i += 1;
      continue;
    }
  }

  return args;
}

/**
 * Displays CLI usage and available flags.
 */
function showUsage() {
  console.log(`
Usage:
  node ./scripts/setup-project.js [options]
  pnpm setup [options]

Options:
  --project-name <name>     Project display name or slug (e.g. "my-saas-app")
  --developer <handle>      Developer handle / username (e.g. "alice")
  --skip-linear             Skip Linear issue tracking configuration (local mode)
  --linear-key <key>        Linear API key (e.g. "lin_api_...")
  --linear-prefix <prefix>  Default Linear issue prefix (e.g. "PRJ", "APP")
  --non-interactive         Run without interactive prompts using provided flags/defaults
  --help, -h                Show this help message
`);
}

/**
 * Asks an interactive question using readline with an optional default value.
 * 
 * @param {readline.Interface} rl - Readline interface instance
 * @param {string} prompt - Question prompt text
 * @param {string} defaultValue - Default answer if user presses enter
 * @returns {Promise<string>} - User response
 */
function askQuestion(rl, prompt, defaultValue = "") {
  return new Promise((resolve) => {
    const suffix = defaultValue ? ` [${defaultValue}]: ` : ": ";
    rl.question(`${prompt}${suffix}`, (answer) => {
      const trimmed = answer.trim();
      resolve(trimmed || defaultValue);
    });
  });
}

/**
 * Updates or adds environment variables in an existing .env file content.
 * 
 * @param {string} envContent - Original .env content
 * @param {Record<string, string>} updates - Key/value pairs to set
 * @returns {string} - Updated .env content
 */
function updateEnvContent(envContent, updates) {
  let content = envContent;

  for (const [key, val] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${val}`);
    } else {
      content += `\n${key}=${val}`;
    }
  }

  return content.trim() + "\n";
}

/**
 * Main setup routine.
 * 
 * Step 1: Parse arguments and check interactivity.
 * Step 2: Prompt for project name & slugify.
 * Step 3: Prompt for developer handle.
 * Step 4: Prompt for Linear integration or skip.
 * Step 5: Update package.json, apps/web/package.json, hooks.json, .env.local.
 * Step 6: Create .agents/project_config.json state tracker.
 * Step 7: Sync graph and README documentation.
 */
async function main() {
  const flags = parseArgs(process.argv.slice(2));

  if (flags.help) {
    showUsage();
    process.exit(0);
  }

  console.log("================================================================");
  console.log("🚀 Next.js Monorepo Starter - Project Configuration Wizard");
  console.log("================================================================");
  console.log("This wizard will configure your project name, developer handle,");
  console.log("and optional Linear issue tracking integration.\n");

  const paths = getPaths(flags.cwd || process.env.PROJECT_ROOT || process.cwd());
  const {
    rootDir,
    packageJsonPath,
    webPackageJsonPath,
    hooksJsonPath,
    projectConfigPath,
    envExamplePath,
    envLocalPath,
  } = paths;

  const isInteractive = !flags.nonInteractive && process.stdin.isTTY && process.stdout.isTTY;

  let projectName = flags.projectName;
  let developerHandle = flags.developer;
  let configureLinear = false;
  let linearApiKey = flags.linearKey;
  let linearPrefix = flags.linearPrefix;

  // Step 1: Interactive prompts or flag resolution
  if (isInteractive) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      // 1.1 Project Name
      const currentDirName = path.basename(rootDir);
      projectName = await askQuestion(rl, "1. Project name", projectName || currentDirName);

      // 1.2 Developer Handle
      let systemUser = process.env.USER || process.env.USERNAME || "dev";
      systemUser = slugify(systemUser) || "dev";
      developerHandle = await askQuestion(rl, "2. Developer handle / username (e.g. github username)", developerHandle || systemUser);

      // 1.3 Linear Integration
      if (!flags.skipLinear && !flags.linearKey) {
        const linearAnswer = await askQuestion(rl, "3. Do you want to configure Linear integration for issue tracking? [y/N]", "N");
        configureLinear = ["y", "yes", "true", "1"].includes(linearAnswer.toLowerCase());

        if (configureLinear) {
          linearApiKey = await askQuestion(rl, "   Enter Linear API Key (from linear.app/settings/api)", linearApiKey || "");
          linearPrefix = await askQuestion(rl, "   Enter Default Issue Prefix (e.g. PRJ, APP)", linearPrefix || "PRJ");
        }
      } else if (flags.linearKey) {
        configureLinear = true;
        linearPrefix = linearPrefix || "PRJ";
      }
    } finally {
      rl.close();
    }
  } else {
    // Non-interactive fallback
    projectName = projectName || path.basename(rootDir) || "next-project";
    developerHandle = developerHandle || process.env.USER || "dev";
    if (flags.linearKey) {
      configureLinear = true;
      linearPrefix = linearPrefix || "PRJ";
    } else {
      configureLinear = false;
    }
  }

  // Step 2: Normalization
  const projectSlug = slugify(projectName) || "next-project";
  const normalizedDev = normalizeDeveloperHandle(developerHandle) || "dev";
  const finalPrefix = (configureLinear && linearPrefix ? linearPrefix.toUpperCase() : "TASK");

  console.log("\n⚙️ Applying project configuration:");
  console.log(`   • Project Name:       ${projectName} (${projectSlug})`);
  console.log(`   • Developer Handle:   ${normalizedDev}`);
  console.log(`   • Linear Integration: ${configureLinear ? `Enabled (Prefix: ${finalPrefix})` : "Skipped (Local mode)"}\n`);

  // Step 3: Update package.json
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    pkg.name = projectSlug;
    if (!pkg.scripts) pkg.scripts = {};
    pkg.scripts.setup = "node ./scripts/setup-project.js";
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    console.log("✓ Updated root package.json");
  }

  // Step 4: Update apps/web/package.json
  if (fs.existsSync(webPackageJsonPath)) {
    const webPkg = JSON.parse(fs.readFileSync(webPackageJsonPath, "utf8"));
    webPkg.name = `@${projectSlug}/web`;
    fs.writeFileSync(webPackageJsonPath, JSON.stringify(webPkg, null, 2) + "\n", "utf8");
    console.log("✓ Updated apps/web/package.json");
  }

  // Step 5: Update .agents/hooks.json
  if (fs.existsSync(hooksJsonPath)) {
    const hooks = JSON.parse(fs.readFileSync(hooksJsonPath, "utf8"));
    if (!hooks.enforcement_rules) hooks.enforcement_rules = {};
    
    // Set allowed developer handles to include the configured developer
    hooks.enforcement_rules.allowed_developer_handles = [normalizedDev];
    hooks.enforcement_rules.require_linear_issue_exists = configureLinear;

    fs.writeFileSync(hooksJsonPath, JSON.stringify(hooks, null, 2) + "\n", "utf8");
    console.log("✓ Updated .agents/hooks.json");
  }

  // Step 6: Update or create .env.local
  let envContent = "";
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, "utf8");
  } else if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, "utf8");
  }

  const envUpdates = {
    DEFAULT_OWNER: normalizedDev,
    DEFAULT_ISSUE_PREFIX: finalPrefix,
    LINEAR_ENABLED: configureLinear ? "true" : "false",
  };

  if (configureLinear && linearApiKey) {
    envUpdates.LINEAR_API_KEY = linearApiKey;
  }

  const updatedEnv = updateEnvContent(envContent, envUpdates);
  fs.writeFileSync(envLocalPath, updatedEnv, "utf8");
  console.log("✓ Updated .env.local");

  // Step 7: Save .agents/project_config.json
  const projectConfig = {
    version: "1.0.0",
    projectName: projectName,
    projectSlug: projectSlug,
    developerHandle: normalizedDev,
    linear: {
      enabled: configureLinear,
      issuePrefix: finalPrefix,
    },
    setupCompleted: true,
    setupCompletedAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(projectConfigPath), { recursive: true });
  fs.writeFileSync(projectConfigPath, JSON.stringify(projectConfig, null, 2) + "\n", "utf8");
  console.log("✓ Created .agents/project_config.json");

  // Step 8: Sync graph and README if scripts exist
  const graphifyScript = path.join(rootDir, "scripts/graphify-sync.js");
  if (fs.existsSync(graphifyScript)) {
    try {
      execSync(`node "${graphifyScript}"`, { cwd: rootDir, stdio: "ignore" });
      console.log("✓ Sincronizado grafo de conocimiento (.agents/graph.json)");
    } catch {
      // Non-blocking sync
    }
  }

  const readmeSyncScript = path.join(rootDir, "scripts/readme-sync.sh");
  if (fs.existsSync(readmeSyncScript)) {
    try {
      execSync(`bash "${readmeSyncScript}"`, { cwd: rootDir, stdio: "ignore" });
      console.log("✓ Sincronizada documentación en README.md");
    } catch {
      // Non-blocking sync
    }
  }

  console.log("\n================================================================");
  console.log("✨ Project setup completed successfully!");
  console.log("================================================================");
  console.log("Next steps:");
  console.log("  1. Run development server:  pnpm dev");
  console.log("  2. Initialize new task:     pnpm task:init");
  console.log("  3. Run validation suite:    pnpm validate");
  console.log("================================================================\n");
}

if (require.main === module) {
  main().catch((err) => {
    console.error("❌ Setup failed:", err.message);
    process.exit(1);
  });
}

module.exports = {
  main,
  parseArgs,
  slugify,
  normalizeDeveloperHandle,
  updateEnvContent,
};
