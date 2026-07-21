const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

async function migrateUsers() {
  const env = fs.readFileSync(".env", "utf-8");
  let url, key;
  env.split("\n").forEach((l) => {
    if (l.startsWith("VITE_SUPABASE_URL=")) url = l.split("=")[1].trim();
    if (l.startsWith("VITE_SUPABASE_ANON_KEY=")) key = l.split("=")[1].trim();
  });

  const supabase = createClient(url, key);

  console.log("Fetching existing students...");
  const { data: students, error } = await supabase.from("students").select("*");

  if (error) {
    console.error("Failed to fetch students:", error);
    return;
  }

  console.log(
    `Found ${students.length} students. Migrating to Supabase Auth...`,
  );

  for (const student of students) {
    if (!student.email || !student.password) {
      console.log(
        `Skipping ${student.name} because email or password is missing.`,
      );
      continue;
    }

    console.log(`Migrating ${student.email}...`);
    const { data, error: authError } = await supabase.auth.signUp({
      email: student.email,
      password: student.password,
    });

    if (authError) {
      console.error(`Failed to migrate ${student.email}:`, authError.message);
    } else {
      console.log(`Successfully migrated ${student.email}!`);
    }

    // Adding a tiny delay to avoid hitting any rate limits
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("Migration complete!");
}

migrateUsers();
