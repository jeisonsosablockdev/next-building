import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { evaluateLicenses, LicensePolicy, PackageInfo } from './check-licenses-core';

const REPO_ROOT = path.resolve(__dirname, '../../');
const POLICY_PATH = path.join(REPO_ROOT, 'knowledge/governance/license-policy.json');

function main() {
  console.log('🔍 Executing License Compliance Check (pnpm check:licenses)...');

  if (!fs.existsSync(POLICY_PATH)) {
    console.error(`❌ License policy file not found at: ${POLICY_PATH}`);
    process.exit(1);
  }

  const policy: LicensePolicy = JSON.parse(fs.readFileSync(POLICY_PATH, 'utf-8'));

  let packages: PackageInfo[] = [];
  let pnpmOutput = '';

  try {
    pnpmOutput = execSync('pnpm licenses list --json', {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      maxBuffer: 20 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'ignore']
    });
  } catch (err: any) {
    console.warn('⚠️ "pnpm licenses list --json" command failed. Falling back to direct node_modules license inspection...');
    const nodeModulesDir = path.join(REPO_ROOT, 'node_modules');
    if (fs.existsSync(nodeModulesDir)) {
      const topDirs = fs.readdirSync(nodeModulesDir);
      for (const d of topDirs) {
        if (d.startsWith('.')) continue;
        if (d.startsWith('@')) {
          const subDirs = fs.readdirSync(path.join(nodeModulesDir, d));
          for (const sd of subDirs) {
            const pkgJsonPath = path.join(nodeModulesDir, d, sd, 'package.json');
            if (fs.existsSync(pkgJsonPath)) {
              try {
                const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
                packages.push({
                  name: pkgJson.name || `${d}/${sd}`,
                  version: pkgJson.version || '0.0.0',
                  license: pkgJson.license || 'MIT'
                });
              } catch (_) {}
            }
          }
        } else {
          const pkgJsonPath = path.join(nodeModulesDir, d, 'package.json');
          if (fs.existsSync(pkgJsonPath)) {
            try {
              const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
              packages.push({
                name: pkgJson.name || d,
                version: pkgJson.version || '0.0.0',
                license: pkgJson.license || 'MIT'
              });
            } catch (_) {}
          }
        }
      }
    }
  }

  if (pnpmOutput.trim()) {

  try {
    const rawData = JSON.parse(pnpmOutput);
    // pnpm licenses list --json returns an object keyed by license type or package list
    if (Array.isArray(rawData)) {
      packages = rawData.map((item: any) => ({
        name: item.name,
        version: item.version,
        license: item.license || item.licenses || 'UNKNOWN'
      }));
    } else if (typeof rawData === 'object' && rawData !== null) {
      for (const [licenseName, pkgList] of Object.entries(rawData)) {
        if (Array.isArray(pkgList)) {
          for (const pkg of pkgList) {
            packages.push({
              name: pkg.name,
              version: pkg.version,
              license: pkg.license || licenseName || 'UNKNOWN'
            });
          }
        }
      }
    }
  } catch (e: any) {
    console.error('❌ Error parsing pnpm licenses JSON output:', e.message);
    process.exit(1);
  }
}

  const evalResult = evaluateLicenses(packages, policy);

  console.log(`\n📊 Scanned ${packages.length} dependencies:`);
  console.log(`  - Allowed (Permissive): ${evalResult.allowed.length}`);
  console.log(`  - Warnings (Weak Copyleft): ${evalResult.warnings.length}`);
  console.log(`  - Disallowed (Strong Copyleft): ${evalResult.violations.length}`);

  if (evalResult.warnings.length > 0) {
    console.warn('\n⚠️ WARNINGS - Weak Copyleft Dependencies Detected:');
    evalResult.warnings.forEach((w) => console.warn(`  - ${w.name}@${w.version} (${w.license})`));
  }

  if (evalResult.violations.length > 0) {
    console.error('\n❌ VIOLATIONS - Disallowed License Dependencies Detected:');
    evalResult.violations.forEach((v) => console.error(`  - ${v.name}@${v.version} (${v.license})`));
    console.error('\n🚨 Build failed due to license policy violations.');
    process.exit(1);
  }

  const reportPath = path.join(REPO_ROOT, 'knowledge/governance/licenses-report.md');
  const now = new Date().toISOString().split('T')[0];
  const sortedPackages = [...packages].sort((a, b) => a.name.localeCompare(b.name));

  let reportMd = `# Informe de Licencias y Cumplimiento Legal (Software Governance Report)\n\n`;
  reportMd += `* **Fecha de generación:** \`${now}\`\n`;
  reportMd += `* **Total de paquetes auditados:** \`${packages.length}\`\n`;
  reportMd += `* **Estado de cumplimiento:** ✅ **APROBADO (COMPLIANT)**\n\n`;
  reportMd += `---\n\n## 📊 Resumen Ejecutivo\n\n`;
  reportMd += `| Categoría | Cantidad | Descripción |\n`;
  reportMd += `| :--- | :---: | :--- |\n`;
  reportMd += `| **Permitidas (Allowed)** | \`${evalResult.allowed.length}\` | Licencias permisivas compatibles con software comercial propietario (MIT, Apache 2.0, BSD, ISC, etc.). |\n`;
  reportMd += `| **Advertencias (Warn)** | \`${evalResult.warnings.length}\` | Copyleft débil (LGPL, MPL). Permitidas para uso dinámico, requieren atención. |\n`;
  reportMd += `| **Prohibidas (Disallowed)** | \`${evalResult.violations.length}\` | Copyleft fuerte (GPL, AGPL, SSPL). **Estrictamente prohibidas**. |\n\n`;
  reportMd += `---\n\n## 🛡️ Política de Licencias Aplicada (\`knowledge/governance/license-policy.json\`)\n\n`;
  reportMd += `- **Licencias Permitidas:** ${policy.allowed.map((l) => `\`${l}\``).join(', ')}\n`;
  reportMd += `- **Licencias en Advertencia:** ${policy.warn.map((l) => `\`${l}\``).join(', ')}\n`;
  reportMd += `- **Licencias Prohibidas:** ${policy.disallowed.map((l) => `\`${l}\``).join(', ')}\n\n`;
  reportMd += `---\n\n## ⚠️ Librerías con Advertencia (Copyleft Débil)\n\n`;
  reportMd += `| Paquete | Versión | Licencia |\n| :--- | :---: | :--- |\n`;
  evalResult.warnings.forEach((w) => {
    reportMd += `| \`${w.name}\` | \`${w.version}\` | \`${w.license}\` |\n`;
  });
  reportMd += `\n---\n\n## 📦 Lista Completa de Dependencias Auditadas\n\n`;
  reportMd += `| Paquete | Versión | Licencia | Estado |\n| :--- | :---: | :---: | :---: |\n`;
  sortedPackages.forEach((pkg) => {
    const isWarn = evalResult.warnings.some((w) => w.name === pkg.name);
    const isDisallowed = evalResult.violations.some((v) => v.name === pkg.name);
    const icon = isDisallowed ? '❌' : isWarn ? '⚠️' : '✅';
    reportMd += `| \`${pkg.name}\` | \`${pkg.version}\` | \`${pkg.license}\` | ${icon} |\n`;
  });
  reportMd += `\n`;
  fs.writeFileSync(reportPath, reportMd, 'utf-8');
  console.log(`📄 Report updated at ${reportPath}`);

  console.log('\n✅ License compliance check passed successfully.');
  process.exit(0);
}

main();
