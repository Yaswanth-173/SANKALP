import path from 'node:path'
import fs from 'node:fs'
import dotenv from 'dotenv'

// Deliberately does NOT use the 'dotenv/config' side-effect import, so we can
// observe whether MONGODB_URI was already present in the OS/shell environment
// *before* the .env file is parsed — dotenv.config() never overwrites a var
// that's already set, so a stray shell/System env var would silently win.
const preLoadHadUri = Object.prototype.hasOwnProperty.call(process.env, 'MONGODB_URI')

const cwd = process.cwd()
const envPath = path.resolve(cwd, '.env')
const envExists = fs.existsSync(envPath)

console.log(`Process cwd:                 ${cwd}`)
console.log(`Resolved .env path:          ${envPath}`)
console.log(`.env file exists there:      ${envExists}`)
console.log(`MONGODB_URI pre-set in shell/System env (before .env load): ${preLoadHadUri}`)

const result = dotenv.config({ path: envPath })
if (result.error) {
  console.log(`dotenv failed to parse .env: ${result.error.message}`)
} else {
  console.log(`dotenv parsed .env keys:     ${Object.keys(result.parsed || {}).join(', ')}`)
}

// Any other .env-style files in this directory that could also define MONGODB_URI
for (const f of ['.env', '.env.local', '.env.development', '.env.production', '.env.test']) {
  const p = path.resolve(cwd, f)
  if (fs.existsSync(p)) {
    const hasKey = /^\s*MONGODB_URI\s*=/m.test(fs.readFileSync(p, 'utf8'))
    console.log(`Found ${f} (defines MONGODB_URI: ${hasKey})`)
  }
}

const uri = process.env.MONGODB_URI
console.log('')
if (!uri) {
  console.log('MONGODB_URI is NOT set in process.env after loading — nothing further to check.')
  process.exit(1)
}

console.log(`MONGODB_URI length:              ${uri.length}`)
console.log(`Starts with "mongodb+srv://":    ${uri.startsWith('mongodb+srv://')}`)
console.log(`Contains literal "<" or ">":     ${/[<>]/.test(uri)}`)
console.log(`Still contains placeholder text: ${/YOUR_ATLAS_USERNAME|YOUR_ATLAS_PASSWORD/.test(uri)}`)
console.log(`Contains "authSource=admin":     ${uri.includes('authSource=admin')}`)
console.log(`Has leading whitespace:          ${/^\s/.test(uri)}`)
console.log(`Has trailing whitespace:         ${/\s$/.test(uri)}`)
console.log(`Wrapped in quotes:                ${/^['"]/.test(uri.trim())}`)

const atCount = (uri.match(/@/g) || []).length
console.log(`Count of "@" characters:         ${atCount} (should be exactly 1)`)

const match = uri.match(/^mongodb(\+srv)?:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]*)(\?.*)?$/)
if (match) {
  const [, , username, password, host, dbName] = match
  console.log(`Username length:                 ${username.length} (value hidden)`)
  console.log(`Password length:                 ${password.length} (value hidden)`)
  console.log(`Host:                            ${host}`)
  console.log(`Database path segment:           ${dbName || '(empty)'}`)
  const suspiciousChars = /[<> "']/
  console.log(`Username has suspicious chars:   ${suspiciousChars.test(username)}`)
  console.log(`Password has unencoded reserved chars (@,/,#,?,%, space): ${/[@/#? %]/.test(password)}`)
} else {
  console.log('Could not parse URI into username/password/host/db segments — check formatting (this alone would fully explain an auth failure).')
}
