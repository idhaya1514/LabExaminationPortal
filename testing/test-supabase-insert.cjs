const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://cbhfjgnihkppdbwdqbmz.supabase.co";
const supabaseKey = "sb_publishable_tTmhoJNmwL9ksTdoiMlAiQ_jT-T7zAk";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const row = {
    student_register_number: "E23AI011",
    student_name: "Idhaya",
    student_department: "AI & DS",
    question: "Add Two Numbers",
    programming_marks: 0,
    mcq_marks: 0,
    observation_marks: 0,
    total_marks: 0,
    max_marks: 50,
    code: "",
    code_output: "",
    output_matches: false,
    mcq_answers: {},
    time_spent: 120,
    malpractice: true,
    malpractice_reason: "Tab switching detected - Exam terminated",
  };

  const { data, error } = await supabase
    .from("exam_results")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("INSERT ERROR:", error);
  } else {
    console.log("INSERT SUCCESS:", data);
  }
}

testInsert();
