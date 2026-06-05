import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://iniiubcwofueokncaglw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluaWl1YmN3b2Z1ZW9rbmNhZ2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MjM5OTksImV4cCI6MjA5NjE5OTk5OX0.VEC23WNjTE9RuqwG-UKQNs-FGLlYNtdboRyVEDnvyqA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
