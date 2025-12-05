// supabase.js
require('dotenv').config();
// src/supabase.js
const { createClient } = require('@supabase/supabase-js');
module.exports = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '⚠️ Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY/ANON_KEY en el .env'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
