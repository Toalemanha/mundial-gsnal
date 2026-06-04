// Cliente Supabase manual — sem biblioteca, sem problemas de URL duplicado

const SUPABASE_URL = 'https://ejkbfriznxbcvuaonsss.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2Jmcml6bnhiY3Z1YW9uc3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjI5MDQsImV4cCI6MjA5NTg5ODkwNH0.XQVY6QNljasufztgeBT8NmNCjlSntMNpJOteMIgBBlA'

const BASE = `${SUPABASE_URL}/rest/v1`
const HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

function buildQuery(params) {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
}

class Query {
  constructor(table) {
    this.table = table
    this._select = '*'
    this._filters = []
    this._order = null
    this._single = false
    this._count = null
    this._head = false
  }

  select(cols, opts = {}) {
    this._select = cols
    if (opts.count) this._count = opts.count
    if (opts.head) this._head = opts.head
    return this
  }

  eq(col, val) { this._filters.push(`${col}=eq.${encodeURIComponent(val)}`); return this }
  order(col, { ascending = true } = {}) { this._order = `${col}.${ascending ? 'asc' : 'desc'}`; return this }
  single() { this._single = true; return this }

  async _run(method = 'GET', body = null) {
    let url = `${BASE}/${this.table}?select=${encodeURIComponent(this._select)}`
    if (this._filters.length) url += '&' + this._filters.join('&')
    if (this._order) url += `&order=${this._order}`

    const headers = { ...HEADERS }
    if (this._single) headers['Accept'] = 'application/vnd.pgrst.object+json'
    if (this._count) headers['Prefer'] = `count=${this._count}`
    if (this._head) method = 'HEAD'

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })
      if (this._head) {
        const count = parseInt(res.headers.get('content-range')?.split('/')[1] || '0')
        return { count, error: null }
      }
      if (!res.ok) {
        const err = await res.text()
        return { data: null, error: err }
      }
      const text = await res.text()
      const data = text ? JSON.parse(text) : null
      return { data: this._single ? data : (data || []), error: null }
    } catch (e) {
      return { data: null, error: e.message }
    }
  }

  then(resolve) { return this._run().then(resolve) }
}

class MutationQuery {
  constructor(table, method, body, filters = []) {
    this.table = table
    this.method = method
    this.body = body
    this._filters = filters
  }

  eq(col, val) { this._filters.push(`${col}=eq.${encodeURIComponent(val)}`); return this }

  then(resolve) {
    let url = `${BASE}/${this.table}`
    if (this._filters.length) url += '?' + this._filters.join('&')

    const promise = fetch(url, {
      method: this.method,
      headers: HEADERS,
      body: this.body ? JSON.stringify(this.body) : undefined,
    }).then(async res => {
      if (!res.ok) {
        const err = await res.text()
        return { data: null, error: err }
      }
      const text = await res.text()
      return { data: text ? JSON.parse(text) : null, error: null }
    }).catch(e => ({ data: null, error: e.message }))

    return promise.then(resolve)
  }
}

export const supabase = {
  from(table) {
    return {
      select: (cols = '*', opts = {}) => new Query(table).select(cols, opts),
      insert: (body) => new MutationQuery(table, 'POST', body),
      update: (body) => new MutationQuery(table, 'PATCH', body),
      delete: () => new MutationQuery(table, 'DELETE', null),
      upsert: (body, opts = {}) => {
        const headers = { ...HEADERS, 'Prefer': `resolution=merge-duplicates,return=representation` }
        const promise = fetch(`${BASE}/${table}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        }).then(async res => {
          const text = await res.text()
          return { data: text ? JSON.parse(text) : null, error: res.ok ? null : text }
        }).catch(e => ({ data: null, error: e.message }))
        return { then: (r) => promise.then(r) }
      },
    }
  },
  channel: () => ({
    on: function() { return this },
    subscribe: function() { return this },
  }),
  removeChannel: () => {},
}
