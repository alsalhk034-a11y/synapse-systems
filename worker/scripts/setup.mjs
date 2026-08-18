#!/usr/bin/env node
/**
 * ================================================================
 * Synapse Systems - Automated Setup Script
 * ================================================================
 * يقوم هذا السكربت بكل خطوات الإعداد:
 * 1. إنشاء D1 Database
 * 2. إنشاء R2 Bucket
 * 3. إنشاء KV Namespace
 * 4. تحديث wrangler.toml بمعرّفات الموارد الحقيقية
 * 5. توليد أسرار JWT و ENCRYPTION_KEY
 * 6. رفع الأسرار إلى Cloudflare
 * 7. تشغيل Migrations
 * 8. نشر Worker
 * 9. نشر Frontend على Pages
 *
 * الاستخدام:
 *   1. npm install -g wrangler
 *   2. wrangler login
 *   3. node scripts/setup.mjs
 * ================================================================
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { randomBytes, createHash } from 'crypto'
import { createInterface } from 'readline'

const rl = createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise((res) => rl.question(q, res))

const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
}

const log = {
  info: (s) => console.log(`${c.blue('ℹ')}  ${s}`),
  success: (s) => console.log(`${c.green('✓')}  ${s}`),
  error: (s) => console.log(`${c.red('✗')}  ${s}`),
  warn: (s) => console.log(`${c.yellow('⚠')}  ${s}`),
  step: (n, s) => console.log(`\n${c.bold(c.blue(`\n━━━ Step ${n}: ${s} ━━━`))}`),
}

function exec(cmd, opts = {}) {
  log.info(`Running: ${cmd}`)
  try {
    return execSync(cmd, { stdio: 'inherit', ...opts })
  } catch (e) {
    log.error(`Command failed: ${cmd}`)
    throw e
  }
}

function generateSecret(bytes = 64) {
  return randomBytes(bytes).toString('base64url')
}

async function main() {
  console.log(c.bold(c.green('\n🏥  Synapse Systems - Cloudflare Setup\n')))

  // ============== Step 0: Prereqs ==============
  log.step(0, 'Prerequisites check')
  try {
    exec('wrangler --version', { stdio: 'pipe' })
    log.success('wrangler is installed')
  } catch {
    log.error('wrangler not found. Install: npm install -g wrangler')
    process.exit(1)
  }
  try {
    exec('wrangler whoami', { stdio: 'pipe' })
    log.success('Authenticated with Cloudflare')
  } catch {
    log.warn('Not authenticated. Opening browser for login...')
    exec('wrangler login')
  }

  // ============== Step 1: D1 Database ==============
  log.step(1, 'Create D1 Database')
  let dbOutput
  try {
    dbOutput = execSync('wrangler d1 create synapse-systems-db --output json', { stdio: 'pipe' }).toString()
  } catch {
    // قد يكون موجوداً مسبقاً
    log.warn('D1 database may already exist, fetching list...')
    const list = execSync('wrangler d1 list --output json', { stdio: 'pipe' }).toString()
    const parsed = JSON.parse(list)
    const found = parsed.find((d) => d.name === 'synapse-systems-db')
    if (!found) throw new Error('Cannot create or find D1 database')
    dbOutput = JSON.stringify(found)
  }
  const dbInfo = JSON.parse(dbOutput)
  const dbId = dbInfo.uuid || dbInfo.id
  log.success(`D1 Database created: ${dbId}`)

  // ============== Step 2: R2 Bucket ==============
  log.step(2, 'Create R2 Bucket')
  try {
    exec('wrangler r2 bucket create synapse-files')
    log.success('R2 Bucket created')
  } catch {
    log.warn('R2 bucket may already exist (this is OK)')
  }

  // ============== Step 3: KV Namespace ==============
  log.step(3, 'Create KV Namespace')
  let kvId
  try {
    const kvOutput = execSync('wrangler kv namespace create CACHE --output json', { stdio: 'pipe' }).toString()
    kvId = JSON.parse(kvOutput).id
    log.success(`KV Namespace created: ${kvId}`)
  } catch {
    log.warn('KV namespace may already exist, fetching...')
    const list = execSync('wrangler kv namespace list --output json', { stdio: 'pipe' }).toString()
    const parsed = JSON.parse(list)
    const found = parsed.find((k) => k.title === 'CACHE')
    if (!found) throw new Error('Cannot create or find KV namespace')
    kvId = found.id
    log.success(`Using existing KV: ${kvId}`)
  }

  // ============== Step 4: Update wrangler.toml ==============
  log.step(4, 'Update wrangler.toml with real IDs')
  const tomlPath = 'wrangler.toml'
  let toml = readFileSync(tomlPath, 'utf8')
  toml = toml.replace(
    /database_id = "PLACEHOLDER_RUN_WRANGLER_TO_CREATE"/,
    `database_id = "${dbId}"`
  )
  toml = toml.replace(
    /id = "PLACEHOLDER_RUN_WRANGLER_TO_CREATE"/,
    `id = "${kvId}"`
  )
  writeFileSync(tomlPath, toml)
  log.success('wrangler.toml updated')

  // ============== Step 5: Generate & upload secrets ==============
  log.step(5, 'Generate and upload secrets')
  const jwtSecret = generateSecret(64)
  const encryptionKey = generateSecret(32)
  const dbEncryptionKey = generateSecret(32)

  // upload secrets via echo piping
  const putSecret = (name, value) => {
    log.info(`Setting secret: ${name}`)
    try {
      execSync(`printf "%s" "${value}" | wrangler secret put ${name}`, { stdio: 'pipe' })
    } catch (e) {
      log.warn(`Failed to set ${name}, you can do it manually: wrangler secret put ${name}`)
    }
  }
  putSecret('JWT_SECRET', jwtSecret)
  putSecret('ENCRYPTION_KEY', encryptionKey)
  putSecret('DATABASE_ENCRYPTION_KEY', dbEncryptionKey)
  log.success('Secrets uploaded')

  // ============== Step 6: Run Migrations ==============
  log.step(6, 'Run database migrations')
  try {
    exec('wrangler d1 migrations apply synapse-systems-db --remote')
    log.success('Migrations applied')
  } catch (e) {
    log.error('Migrations failed')
    throw e
  }

  // ============== Step 7: Install worker deps & deploy ==============
  log.step(7, 'Install Worker dependencies & deploy')
  process.chdir('worker')
  exec('npm install')
  exec('npm run deploy')
  process.chdir('..')
  log.success('Worker deployed')

  // ============== Step 8: Build & deploy Frontend ==============
  log.step(8, 'Build and deploy Frontend')
  exec('npm install')
  exec('npm run build')

  // Deploy to Pages
  log.info('Deploying to Cloudflare Pages...')
  const projectName = 'synapse-systems-web'
  try {
    exec(`wrangler pages deploy dist --project-name ${projectName}`)
    log.success('Frontend deployed to Pages')
  } catch (e) {
    log.warn(`Failed to deploy to Pages. Run manually: wrangler pages deploy dist --project-name ${projectName}`)
  }

  // ============== Done ==============
  console.log(c.bold(c.green('\n\n🎉 Setup Complete!\n')))
  console.log(c.bold('Your resources:'))
  console.log(`  ${c.green('•')} Worker API: https://synapse-systems.<your-subdomain>.workers.dev`)
  console.log(`  ${c.green('•')} Frontend:   https://${projectName}.pages.dev`)
  console.log(`  ${c.green('•')} D1 DB ID:   ${dbId}`)
  console.log(`  ${c.green('•')} KV ID:      ${kvId}`)
  console.log()
  console.log(c.bold('Next steps:'))
  console.log(`  1. Visit your Pages URL`)
  console.log(`  2. Login with: admin / ${c.yellow('ChangeMe123!')} (update immediately!)`)
  console.log(`  3. Update secrets anytime: ${c.blue('wrangler secret put <NAME>')}`)
  console.log()

  rl.close()
}

main().catch((e) => {
  log.error(e.message)
  console.error(e)
  process.exit(1)
})
