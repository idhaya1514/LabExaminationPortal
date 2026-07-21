const { createClient } = require("@supabase/supabase-js");

async function runCron() {
  console.log("Starting Automated Offline Scheduler...");

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  const EMAILJS_SERVICE = process.env.VITE_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE = process.env.VITE_EMAILJS_TEMPLATE_ID;
  const EMAILJS_PUBLIC_KEY = process.env.VITE_EMAILJS_PUBLIC_KEY;
  const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY; // Optional for some EmailJS setups, required for REST if security is high

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase credentials in ENV.");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // 1. Get settings
    const { data: timeData } = await supabase
      .from("global_settings")
      .select("value")
      .eq("id", "auto_email_time")
      .single();
    const { data: activeData } = await supabase
      .from("global_settings")
      .select("value")
      .eq("id", "auto_email_active")
      .single();
    const { data: lastSentData } = await supabase
      .from("global_settings")
      .select("value")
      .eq("id", "last_auto_email_date")
      .single();

    const scheduledTime = timeData?.value || "21:00";
    const isActive = activeData?.value === "true";
    const lastSentDate = lastSentData?.value || "";

    if (!isActive) {
      console.log("Scheduler is disabled in Supabase settings.");
      return;
    }

    // Convert current UTC time to IST (Indian Standard Time, UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);

    const currentHour = istDate.getUTCHours().toString().padStart(2, "0");
    const currentMinute = istDate.getUTCMinutes().toString().padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;
    const todayStr = istDate.toISOString().split("T")[0];

    console.log(
      `Current IST Time: ${currentTime}, Scheduled: ${scheduledTime}, Last Sent: ${lastSentDate}`,
    );

    if (currentTime !== scheduledTime) {
      console.log("Not the scheduled time yet.");
      return;
    }

    if (lastSentDate === todayStr) {
      console.log("Emails already sent today.");
      return;
    }

    console.log(
      "Time matched! Proceeding to fetch students and check LeetCode...",
    );

    // 2. Fetch all students
    const { data: students, error } = await supabase
      .from("students")
      .select("*");
    if (error || !students) {
      console.error("Failed to fetch students:", error);
      return;
    }

    const studentsWithLc = students.filter(
      (s) => s.leetCodeUsername && s.leetCodeUsername.trim() !== "",
    );
    const slackingStudents = [];

    // 3. Check LeetCode for each
    for (const student of studentsWithLc) {
      const clean = student.leetCodeUsername.trim();
      try {
        const res = await fetch(
          `https://alfa-leetcode-api.onrender.com/${clean}/acSubmission?limit=10`,
        );
        if (res.ok) {
          const data = await res.json();
          const submissions = data.submission || data.data || [];
          const apiHasSolved = submissions.some((sub) => {
            if (!sub.timestamp) return false;
            // Convert submission time to IST to match "today"
            const subDate = new Date(Number(sub.timestamp) * 1000 + istOffset)
              .toISOString()
              .split("T")[0];
            return subDate === todayStr;
          });

          if (!apiHasSolved && student.email) {
            slackingStudents.push(student);
          }
        } else {
          // If Alfa API fails, try Faisal API
          const fbRes = await fetch(
            `https://leetcode-api-faisalshohag.vercel.app/${clean}`,
          );
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            const fbSubmissions = fbData.recentSubmissions || [];
            const fbHasSolved = fbSubmissions.some((sub) => {
              if (!sub.timestamp) return false;
              const subDate = new Date(Number(sub.timestamp) * 1000 + istOffset)
                .toISOString()
                .split("T")[0];
              return subDate === todayStr;
            });
            if (!fbHasSolved && student.email) slackingStudents.push(student);
          }
        }
      } catch (err) {
        console.error(`Failed to check LeetCode for ${clean}:`, err.message);
      }

      // Delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(
      `Found ${slackingStudents.length} inactive students with emails.`,
    );

    // 4. Send Emails via EmailJS REST API
    if (
      slackingStudents.length > 0 &&
      EMAILJS_SERVICE &&
      EMAILJS_TEMPLATE &&
      EMAILJS_PUBLIC_KEY
    ) {
      let sentCount = 0;
      for (const student of slackingStudents) {
        try {
          const payload = {
            service_id: EMAILJS_SERVICE,
            template_id: EMAILJS_TEMPLATE,
            user_id: EMAILJS_PUBLIC_KEY,
            accessToken: EMAILJS_PRIVATE_KEY || undefined,
            template_params: {
              to_name: student.name,
              name: student.name,
              user_name: student.name,
              to_email: student.email,
              email: student.email,
              user_email: student.email,
              subject: "Daily LeetCode Progress Update",
              message: `Dear ${student.name},\n\nWe noticed that there have been no new LeetCode submissions recorded for your account (${student.leetCodeUsername}) today.\n\nConsistent daily practice is a key component of the curriculum and is essential for developing strong algorithmic problem-solving skills. We strongly encourage you to log in and complete at least one problem today to maintain your active status.\n\nKeep up the hard work!\n\nBest regards,\nDepartment of ${student.department || "Computer Science"}\nAcademic Administration`,
              leetcode_username: student.leetCodeUsername,
            },
          };

          const emailRes = await fetch(
            "https://api.emailjs.com/api/v1.0/email/send",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            },
          );

          if (emailRes.ok) {
            sentCount++;
          } else {
            const errText = await emailRes.text();
            console.error(`EmailJS error for ${student.email}:`, errText);
          }
        } catch (err) {
          console.error(
            `Failed to send email to ${student.email}:`,
            err.message,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      console.log(`Successfully sent ${sentCount} reminder emails.`);
    }

    // 5. Update last_auto_email_date so it doesn't trigger again today
    await supabase
      .from("global_settings")
      .upsert(
        { id: "last_auto_email_date", value: todayStr },
        { onConflict: "id" },
      );
    console.log("Cron execution completed successfully.");
  } catch (err) {
    console.error("Cron script encountered a fatal error:", err);
    process.exit(1);
  }
}

runCron();
