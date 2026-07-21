const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = "https://cbhfjgnihkppdbwdqbmz.supabase.co";
const supabaseKey = "sb_publishable_tTmhoJNmwL9ksTdoiMlAiQ_jT-T7zAk";
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAssignment() {
  const { data, error } = await supabase
    .from("student_assignments")
    .delete()
    .eq("student_register_number", "E23AI011");

  if (error) console.error("Error:", error);
  else console.log("Successfully deleted assignment from Supabase:", data);
}

deleteAssignment();
