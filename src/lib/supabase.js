import { createClient } from '@supabase/supabase-js'

// Vai ao teu projeto em supabase.com → Settings → API
// e substitui estes dois valores
const SUPABASE_URL = 'https://ejkbfriznxbcvuaonsss.supabase.co/rest/v1/'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2Jmcml6bnhiY3Z1YW9uc3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjI5MDQsImV4cCI6MjA5NTg5ODkwNH0.XQVY6QNljasufztgeBT8NmNCjlSntMNpJOteMIgBBlA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
