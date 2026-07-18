const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cbhfjgnihkppdbwdqbmz.supabase.co';
const supabaseKey = 'sb_publishable_tTmhoJNmwL9ksTdoiMlAiQ_jT-T7zAk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('exam_results')
    .select('*')
    .limit(1);

  if (error) {
    console.error("SELECT ERROR:", error);
  } else {
    console.log("SELECT SUCCESS:", data);
  }
}

checkSchema();
