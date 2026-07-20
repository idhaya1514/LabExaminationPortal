const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  console.log("=== VERIFYING SUPABASE ===");
  try {
    const envContent = fs.readFileSync('.env', 'utf-8');
    let supabaseUrl = '';
    let supabaseKey = '';
    
    envContent.split('\\n').forEach(line => {
      if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
      if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
    });

    if (!supabaseUrl || !supabaseKey) {
      console.log("❌ Missing Supabase credentials in .env");
    } else {
      const sb = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await sb.from('students').select('id, name, leet_code_username').limit(2);
      if (error) {
        console.log("❌ Supabase query failed:", error.message);
      } else {
        console.log("✅ Supabase is working. Found students:", data.length);
        console.log("Sample Data:", data);
      }
    }
  } catch (err) {
    console.log("❌ Supabase error:", err.message);
  }

  console.log("\\n=== VERIFYING LEETCODE API (ALFA) ===");
  try {
    const alfaRes = await fetch("https://alfa-leetcode-api.onrender.com/sivadharshini009/solved");
    if (alfaRes.ok) {
      const data = await alfaRes.json();
      console.log("✅ ALFA API is working. Solved:", data.solvedProblem);
    } else {
      console.log("❌ ALFA API failed with status:", alfaRes.status);
    }
  } catch (err) {
    console.log("❌ ALFA API request error:", err.message);
  }

  console.log("\\n=== VERIFYING LEETCODE API (FAISAL) ===");
  try {
    const faisalRes = await fetch("https://leetcode-api-faisalshohag.vercel.app/sivadharshini009");
    if (faisalRes.ok) {
      const data = await faisalRes.json();
      console.log("✅ FAISAL API is working. Total solved:", data.totalSolved);
    } else {
      console.log("❌ FAISAL API failed with status:", faisalRes.status);
    }
  } catch (err) {
    console.log("❌ FAISAL API request error:", err.message);
  }
}
run();
