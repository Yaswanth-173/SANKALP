import test from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import app from '../src/app.js'

test('health endpoint is public and returns a stable response', async () => {
  const response = await request(app).get('/api/health')
  assert.equal(response.status, 200)
  assert.deepEqual(response.body, { status: 'ok' })
  assert.equal(response.headers['x-content-type-options'], 'nosniff')
})

test('unknown routes return the public error contract', async () => {
  const response = await request(app).get('/api/not-a-route')
  assert.equal(response.status, 404)
  assert.deepEqual(response.body, { success: false, message: 'Route not found' })
})

test('authentication endpoints reject oversized JSON payloads', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'a'.repeat(110000), password: 'not-a-password' })
  assert.equal(response.status, 413)
  assert.equal(response.body.success, false)
})
