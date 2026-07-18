const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cbhfjgnihkppdbwdqbmz.supabase.co';
const supabaseKey = 'sb_publishable_tTmhoJNmwL9ksTdoiMlAiQ_jT-T7zAk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase
    .rpc('get_columns', { table_name: 'exam_results' });
  
  if (error) {
    console.error("RPC ERROR:", error);
    // Alternatively, try querying a row with a wrong column to see the error details
  } else {
    console.log("RPC SUCCESS:", data);
  }
}

checkSchema();
