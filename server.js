const express = require('express')
const cors = require('cors')
const path = require('path')
const app = express()

app.use(cors())
app.use(express.json())

// Valid keys (move to env vars in production)
const VALID_KEYS = ['XVORY-1234', 'XVORY-ELITE', 'XVORY-DEV']

// In-memory store: key → latest Lua script
const scriptStore = {}

// POST /execute — UI calls this when Execute is clicked
app.post('/execute', (req, res) => {
  const { key, code } = req.body

  if (!VALID_KEYS.includes(key))
    return res.status(403).json({ error: 'Invalid key' })

  if (!code || !code.includes('"Cloud-Web"'))
    return res.status(400).json({ error: 'Not a Cloud-Web config' })

  // Store the script so the executor can fetch it
  scriptStore[key] = code

  // Always return success so the web UI shows it as stored
  return res.json({ success: true, stored: true, note: 'Script stored for executor polling' })
})

// GET /script/:key — executor calls this to fetch latest script
app.get('/script/:key', (req, res) => {
  const { key } = req.params
  res.type('text/plain')

  if (!VALID_KEYS.includes(key))
    return res.status(200).send('-- Invalid key')

  const script = scriptStore[key]
  if (!script)
    return res.status(200).send('-- No script stored for this key')

  // Clear the script so it doesn't execute twice when polling
  delete scriptStore[key]

  res.send(script)
})

// Serve the dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'xvory_dashboard.html'))
})

// Health check API
app.get('/api/health', (req, res) => res.json({ status: 'Xvory backend running' }))

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`)
})
