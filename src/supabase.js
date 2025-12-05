// src/supabase.js
const { createClient } = require('@supabase/supabase-js');

const url =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||   // 👈 tu .env usa este
  process.env.SUPABASE_SERVICE_ROLE ||       // fallback
  process.env.SUPABASE_ANON_KEY;             // último recurso

if (!url) throw new Error('SUPABASE_URL is required.');
if (!key) throw new Error('SUPABASE_SERVICE_ROLE(_KEY) is required.');

module.exports = createClient(url, key);
