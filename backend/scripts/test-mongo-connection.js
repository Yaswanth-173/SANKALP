import 'dotenv/config'
import mongoose from 'mongoose'

// Redacts credentials from anything before we ever print it — driver error
// messages (e.g. MongoParseError on a malformed URI) can otherwise echo the
// raw connection string, which would leak the password into terminal/CI logs.
function redact(str) {
  return String(str).replace(/(mongodb(?:\+srv)?:\/\/)([^:@/]+):([^@/]+)@/gi, '$1***:***@')
}

function parseUri(uri) {
  const match = uri.match(/^mongodb(\+srv)?:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]*)(\?.*)?$/)
  if (!match) return null
  const [, , username, , hostPart, dbName] = match
  return { username, host: hostPart, dbName: dbName || '(none)' }
}

async function main() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.log('Result: FAILED — MONGODB_URI is not set in backend/.env')
    process.exitCode = 1
    return
  }

  const parsed = parseUri(uri)
  if (parsed) {
    console.log(`Cluster host:  ${parsed.host}`)
    console.log(`Database name: ${parsed.dbName}`)
    console.log('Username:      (hidden)')
    console.log('Password:      (hidden)')
  } else {
    console.log('Warning: could not parse MONGODB_URI into host/db — check for missing scheme, extra spaces/quotes, or unencoded special characters.')
  }

  const atSignCount = (uri.match(/@/g) || []).length
  if (atSignCount > 1) {
    console.log('Warning: multiple "@" characters detected before the host — this usually means the password contains an unencoded "@" (or other reserved character). URL-encode it (encodeURIComponent) and retry.')
  }
  if (/^\s|\s$/.test(uri) || /^["']|["']$/.test(uri.trim())) {
    console.log('Warning: MONGODB_URI appears to have leading/trailing whitespace or quotation marks — remove them.')
  }

  console.log('\nAttempting connection (timeout 10s)...')

  try {
    mongoose.set('strictQuery', true)
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
    console.log('Result: SUCCESS — connection authenticated and established.')
    console.log(`Connected database: ${conn.connection.db.databaseName}`)
    const collections = await conn.connection.db.listCollections().toArray()
    console.log(`Collections visible: ${collections.length}`)
    await mongoose.disconnect()
    process.exitCode = 0
  } catch (err) {
    const name = err?.name || 'Error'
    const codeName = err?.codeName
    const message = redact(err?.message || '')

    const isAuthError =
      err?.code === 18 ||
      codeName === 'AuthenticationFailed' ||
      /bad auth|authentication failed/i.test(message)

    const isAuthzError =
      err?.code === 13 ||
      codeName === 'Unauthorized' ||
      /not authorized/i.test(message)

    const isNetworkError =
      name === 'MongooseServerSelectionError' ||
      name === 'MongoServerSelectionError' ||
      /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|querySrv/i.test(message)

    if (isAuthError) {
      console.log('Result: FAILED — Authentication error.')
      console.log('Meaning: the cluster was reached, but the username/password in MONGODB_URI were rejected.')
      console.log('Check: Atlas Database Access username, password validity, and authSource=admin.')
    } else if (isAuthzError) {
      console.log('Result: FAILED — Authorization error.')
      console.log('Meaning: credentials were accepted, but this user lacks permission for this database/action.')
      console.log('Check: Atlas Database Access user role/permissions on the "sankalp" database.')
    } else if (isNetworkError) {
      console.log('Result: FAILED — Network/connection error.')
      console.log('Meaning: could not reach the cluster at all (DNS, timeout, or IP not allow-listed).')
      console.log('Check: Atlas Network Access IP allow-list, internet connectivity, and cluster hostname.')
    } else {
      console.log(`Result: FAILED — ${name}`)
      console.log(`Sanitized detail: ${message}`)
    }
    process.exitCode = 1
  }
}

main()
