// @ts-nocheck
import { supabase, isSupabaseConfigured } from "./supabaseClient";
export { supabase };
import defaultQuestions from "../data/default_questions.json";

// ─── Configuration ────────────────────────────────────────────────────────────
// Priority: Supabase → Express/SQLite → localStorage
export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Student {
  id?: number;
  name: string;
  registerNumber: string;
  email?: string;
  password?: string;
  department: string;
  leetCodeUsername?: string;
  createdAt?: string;
}

export interface LeetCodeStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  username: string;
  realName?: string;
  avatar?: string;
  totalQuestions?: number;
}

export interface Question {
  id: string | number;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  language: "javascript" | "python" | "java" | "c" | "cpp";
  expectedOutput: string;
  testCases: { input: string; output: string }[];
  vivas: {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
  createdAt?: string;
}

export interface ExamResult {
  id?: number;
  student: {
    name: string;
    registerNumber: string;
    department?: string;
    leetCodeUsername?: string;
  };
  question: string;
  questionId?: string | number;
  programmingMarks: number;
  mcqMarks: number;
  observationMarks?: number;
  totalMarks: number;
  maxMarks: number;
  code: string;
  codeOutput: string;
  outputMatches: boolean;
  mcqAnswers: Record<number, number>;
  timeSpent: number;
  malpractice: boolean;
  malpracticeReason?: string;
  submittedAt?: string;
}

// ─── Express HTTP helper ──────────────────────────────────────────────────────

async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Response is not JSON");
  }
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      errorMessage = body.error || body.message || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

// ─── Health / Connectivity ────────────────────────────────────────────────────

export async function checkServerHealth(): Promise<boolean> {
  // Supabase is our primary cloud server
  return isSupabaseConfigured;
}

// ─── Local Storage Helpers ────────────────────────────────────────────────────

function lsGet<T>(key: string, def: T): T {
  const d = localStorage.getItem(key);
  return d ? JSON.parse(d) : def;
}
function lsSet<T>(key: string, v: T) {
  localStorage.setItem(key, JSON.stringify(v));
}

function lsStudents(): Student[] {
  return lsGet<Student[]>("exam_portal_students", []);
}
function lsSaveStudents(s: Student[]) {
  lsSet("exam_portal_students", s);
}

function lsQuestions(): Question[] {
  const q = lsGet<Question[]>("exam_portal_questions", []);
  if (q.length === 0) {
    lsSet("exam_portal_questions", defaultQuestions);
    return defaultQuestions;
  }
  return q;
}
function lsSaveQuestions(q: Question[]) {
  lsSet("exam_portal_questions", q);
}

interface LocalAssignment {
  registerNumber: string;
  questionId: string | number;
}
function lsAssignments(): LocalAssignment[] {
  return lsGet<LocalAssignment[]>("exam_portal_assignments", []);
}
function lsSaveAssignments(a: LocalAssignment[]) {
  lsSet("exam_portal_assignments", a);
}

function lsResults(): ExamResult[] {
  return lsGet<ExamResult[]>("exam_portal_results", []);
}
function lsSaveResults(r: ExamResult[]) {
  lsSet("exam_portal_results", r);
}

// ─── Unified runner ───────────────────────────────────────────────────────────
// Tries Supabase first, then localStorage fallback.

async function run<T>(
  supabaseCall: (() => Promise<T>) | null,
  expressCall: () => Promise<Response>,
  localCall: () => T,
): Promise<T> {
  // 1️⃣ Supabase
  if (isSupabaseConfigured && supabaseCall) {
    try {
      return await supabaseCall();
    } catch (e) {
      console.warn("[Supabase] failed, using localStorage:", e);
    }
  }

  // 2️⃣ localStorage
  return localCall();
}

// ════════════════════════════════════════════════════════════════════════════════
//  STUDENT APIs
// ════════════════════════════════════════════════════════════════════════════════

export async function getStudents(): Promise<Student[]> {
  const local = lsStudents();
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase!
        .from("students")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? [])
        .filter((r) => r.email && r.email.trim() !== "" && r.leet_code_username && r.leet_code_username.trim() !== "")
        .map((r) => ({
          id: r.id,
          name: r.name,
          registerNumber: r.register_number,
          department: r.department,
          email: r.email,
          leetCodeUsername: r.leet_code_username,
          createdAt: r.created_at,
        }));
    } catch (e) {
      console.warn("[Supabase] getStudents failed, using localStorage:", e);
    }
  }
  return local.filter(s => s.email && s.email.trim() !== "" && s.leetCodeUsername && s.leetCodeUsername.trim() !== "");
}

export async function getStudent(registerNumber: string): Promise<Student> {
  if (!registerNumber) {
    throw new Error("Register number is required");
  }

  return run(
    async () => {
      const { data, error } = await supabase!
        .from("students")
        .select("*")
        .eq("register_number", registerNumber.trim())
        .single();
      if (error)
        throw new Error(
          "Student not found. Please contact your administrator.",
        );
      return {
        id: data.id,
        name: data.name,
        registerNumber: data.register_number,
        email: data.email,
        password: data.password,
        department: data.department,
        leetCodeUsername: data.leet_code_username,
        createdAt: data.created_at,
      };
    },
    () =>
      fetch(`${API_BASE_URL}/students/${encodeURIComponent(registerNumber)}`),
    () => {
      const s = lsStudents().find(
        (s) =>
          s.registerNumber.trim().toLowerCase() ===
          registerNumber.trim().toLowerCase(),
      );
      if (!s)
        throw new Error(
          "Student not found. Please contact your administrator.",
        );
      return s;
    },
  );
}

export async function getStudentByEmail(email: string): Promise<Student> {
  if (!email) {
    throw new Error("Email is required");
  }

  return run(
    async () => {
      const { data, error } = await supabase!
        .from("students")
        .select("*")
        .eq("email", email.trim().toLowerCase())
        .single();
      if (error)
        throw new Error("Email not found. Please register first.");
      return {
        id: data.id,
        name: data.name,
        registerNumber: data.register_number,
        email: data.email,
        password: data.password,
        department: data.department,
        leetCodeUsername: data.leet_code_username,
        createdAt: data.created_at,
      };
    },
    () => fetch(`${API_BASE_URL}/students/by-email/${encodeURIComponent(email)}`),
    () => {
      const s = lsStudents().find(
        (s) => (s.email || "").trim().toLowerCase() === email.trim().toLowerCase(),
      );
      if (!s) throw new Error("Email not found. Please register first.");
      return s;
    },
  );
}

export function getLeetCodeProfileUrl(usernameOrUrl: string | undefined): string {
  if (!usernameOrUrl) return "";
  const cleaned = cleanLeetCodeUsername(usernameOrUrl);
  return `https://leetcode.com/u/${cleaned}/`;
}

export async function loginStudent(email: string, password?: string): Promise<Student> {
  if (!email) throw new Error("Email is required");

  return run(
    async () => {
      if (password) {
        const { error: authError } = await supabase!.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (authError) throw new Error(authError.message);
      }
      
      const { data, error } = await supabase!
        .from("students")
        .select("*")
        .eq("email", email.trim().toLowerCase())
        .single();
      if (error) throw new Error("Email not found in database. Please register first.");
      
      return {
        id: data.id,
        name: data.name,
        registerNumber: data.register_number,
        email: data.email,
        password: data.password, // Keep for fallback compatibility
        department: data.department,
        leetCodeUsername: data.leet_code_username,
        createdAt: data.created_at,
      };
    },
    () => Promise.reject("Not implemented via REST"),
    () => {
      const s = lsStudents().find(
        (s) => (s.email || "").trim().toLowerCase() === email.trim().toLowerCase(),
      );
      if (!s) throw new Error("Email not found. Please register first.");
      if (password && s.password && s.password !== password) throw new Error("Incorrect password.");
      return s;
    },
  );
}

export async function resetStudentPassword(email: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured. Cannot reset password.");
  const { error } = await supabase!.auth.resetPasswordForEmail(email.trim().toLowerCase());
  if (error) throw new Error(error.message);
}

export async function updateStudentPassword(newPassword: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const { error } = await supabase!.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

export async function createStudent(
  student: Omit<Student, "id" | "createdAt">,
): Promise<Student> {
  return run(
    async () => {
      if (student.password && student.email) {
        const { error: authError } = await supabase!.auth.signUp({
          email: student.email.trim().toLowerCase(),
          password: student.password,
        });
        if (authError) throw new Error(`Auth Error: ${authError.message}`);
      }

      const { data, error } = await supabase!
        .from("students")
        .insert({
          name: student.name.trim(),
          register_number: student.registerNumber.trim(),
          department: student.department.trim(),
          email: student.email ? student.email.trim().toLowerCase() : null,
          password: student.password ? student.password.trim() : null,
          leet_code_username: student.leetCodeUsername ? student.leetCodeUsername.trim() : null,
        })
        .select()
        .single();
      if (error) {
        if (error.code === "23505")
          throw new Error(
            `Register number "${student.registerNumber}" already exists`,
          );
        throw error;
      }
      return {
        id: data.id,
        name: data.name,
        registerNumber: data.register_number,
        department: data.department,
        email: data.email,
        password: data.password,
        leetCodeUsername: data.leet_code_username,
        createdAt: data.created_at,
      };
    },
    () =>
      fetch(`${API_BASE_URL}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
      }),
    () => {
      const all = lsStudents();
      if (
        all.some(
          (s) =>
            s.registerNumber.toLowerCase() ===
            student.registerNumber.trim().toLowerCase(),
        )
      )
        throw new Error(
          `Register number "${student.registerNumber}" already exists`,
        );
      if (student.email && all.some((s) => (s.email || "").toLowerCase() === student.email!.trim().toLowerCase()))
        throw new Error(`Email "${student.email}" is already registered`);
      const n: Student = {
        ...student,
        email: student.email ? student.email.trim().toLowerCase() : undefined,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };
      all.push(n);
      lsSaveStudents(all);
      return n;
    },
  );
}

export async function updateStudent(
  id: number | string,
  student: Omit<Student, "id" | "createdAt">,
): Promise<Student> {
  return run(
    async () => {
      const { data, error } = await supabase!
        .from("students")
        .update({
          name: student.name.trim(),
          register_number: student.registerNumber.trim(),
          department: student.department.trim(),
          email: student.email ? student.email.trim().toLowerCase() : null,
          password: student.password ? student.password.trim() : null,
          leet_code_username: student.leetCodeUsername ? student.leetCodeUsername.trim() : null,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        name: data.name,
        registerNumber: data.register_number,
        email: data.email,
        password: data.password,
        department: data.department,
        leetCodeUsername: data.leet_code_username,
        createdAt: data.created_at,
      };
    },
    () =>
      fetch(`${API_BASE_URL}/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
      }),
    () => {
      const McKinseyAll = lsStudents();
      const idx = McKinseyAll.findIndex((s) => s.id === Number(id));
      if (idx === -1) throw new Error("Student not found");
      McKinseyAll[idx] = { ...McKinseyAll[idx], ...student };
      lsSaveStudents(McKinseyAll);
      return McKinseyAll[idx];
    },
  );
}

export async function deleteStudent(
  id: number | string,
): Promise<{ message: string }> {
  return run(
    async () => {
      const { error } = await supabase!.from("students").delete().eq("id", id);
      if (error) throw error;
      return { message: "Student deleted successfully" };
    },
    () => fetch(`${API_BASE_URL}/students/${id}`, { method: "DELETE" }),
    () => {
      lsSaveStudents(lsStudents().filter((s) => s.id !== Number(id)));
      return { message: "Student deleted successfully" };
    },
  );
}

export async function deleteAllStudents(): Promise<{ message: string }> {
  // Always clear local storage as well to prevent out-of-sync issues
  lsSaveStudents([]);
  lsSaveResults([]);
  lsSaveAssignments([]);

  return run(
    async () => {
      // Supabase: we can try to delete all where id > 0
      await supabase!.from("exam_results").delete().gt("id", 0);
      await supabase!.from("assigned_questions").delete().gt("id", 0);
      const { error } = await supabase!.from("students").delete().gt("id", 0);
      if (error) throw error;
      return { message: "All students deleted successfully" };
    },
    () => fetch(`${API_BASE_URL}/students`, { method: "DELETE" }),
    () => {
      return { message: "All students deleted successfully" };
    },
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  LEETCODE API
// ════════════════════════════════════════════════════════════════════════════════

export function cleanLeetCodeUsername(username: string): string {
  let cleaned = username.trim();
  if (cleaned.includes("leetcode.com/")) {
    const parts = cleaned.split("leetcode.com/");
    const path = parts[1] || "";
    const segments = path.split("/").filter(Boolean);
    if (segments[0] === "u" && segments[1]) {
      cleaned = segments[1];
    } else if (segments[0]) {
      cleaned = segments[0];
    }
  }
  if (cleaned.startsWith("@")) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.includes("@")) {
    cleaned = cleaned.split("@")[0];
  }
  return cleaned.trim();
}

export async function fetchLeetCodeSolvedOnly(username: string): Promise<number> {
  const cleaned = cleanLeetCodeUsername(username);
  const cacheKey = `lc_solved_cache_${cleaned.toLowerCase()}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const { count, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return count;
      }
    } catch {
      // Ignore cache corruption
    }
  }

  const clean = encodeURIComponent(cleaned);
  const res = await fetch(`https://alfa-leetcode-api.onrender.com/${clean}/solved?t=${Date.now()}`, { cache: 'no-store' as RequestCache });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.errors?.[0]?.message || `User not found.`);
  }

  const solved = await res.json();
  if (solved.errors && solved.errors.length > 0) {
    throw new Error(solved.errors[0].message || "User not found.");
  }

  const count = solved.solvedProblem || 0;
  localStorage.setItem(cacheKey, JSON.stringify({
    count,
    timestamp: Date.now()
  }));

  // Also pre-populate the full stats cache with this totalSolved to prevent double fetch
  const fullCacheKey = `lc_cache_${cleaned.toLowerCase()}`;
  const fullCached = localStorage.getItem(fullCacheKey);
  if (!fullCached) {
    localStorage.setItem(fullCacheKey, JSON.stringify({
      data: {
        username: cleaned,
        totalSolved: count,
        easySolved: solved.easySolved || 0,
        mediumSolved: solved.mediumSolved || 0,
        hardSolved: solved.hardSolved || 0,
        ranking: 0,
        realName: undefined,
        avatar: undefined,
        totalQuestions: undefined
      },
      timestamp: Date.now()
    }));
  }

  return count;
}

export async function fetchLeetCodeStats(username: string, forceSync: boolean = false): Promise<LeetCodeStats> {
  const BASE = "https://alfa-leetcode-api.onrender.com";
  const cleanedUsername = cleanLeetCodeUsername(username);

  // Cache check (5 minutes duration)
  const cacheKey = `lc_cache_${cleanedUsername.toLowerCase()}`;
  if (!forceSync) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return data;
        }
      } catch {
        // Ignore cache format error
      }
    }
  }

  const clean = encodeURIComponent(cleanedUsername);

  try {
    // Fetch solved counts and profile in parallel from PRIMARY API
    const fetchOpts = { cache: "no-store" as RequestCache };
    const [solvedRes, profileRes] = await Promise.all([
      fetch(`${BASE}/${clean}/solved?t=${Date.now()}`, fetchOpts),
      fetch(`${BASE}/${clean}?t=${Date.now()}`, fetchOpts),
    ]);

    if (!solvedRes.ok) throw new Error("Primary API failed");

    const solved = await solvedRes.json();
    if (solved.errors && solved.errors.length > 0) throw new Error("User not found");

    let ranking = 0;
    let realName: string | undefined;
    let avatar: string | undefined;
    let totalQuestions: number | undefined;

    if (profileRes.ok) {
      const profile = await profileRes.json();
      ranking = profile.ranking || 0;
      realName = profile.name || undefined;
      avatar = profile.avatar || undefined;
    }

    try {
      const upRes = await fetch(`${BASE}/userProfile/${clean}?t=${Date.now()}`, fetchOpts);
      if (upRes.ok) {
        const up = await upRes.json();
        totalQuestions = up.totalQuestions || undefined;
      }
    } catch { /* optional */ }

    const statsResult = {
      username: cleanedUsername,
      totalSolved: solved.solvedProblem || 0,
      easySolved: solved.easySolved || 0,
      mediumSolved: solved.mediumSolved || 0,
      hardSolved: solved.hardSolved || 0,
      ranking,
      realName,
      avatar,
      totalQuestions,
    };

    localStorage.setItem(cacheKey, JSON.stringify({ data: statsResult, timestamp: Date.now() }));
      localStorage.setItem(cacheKey, JSON.stringify({ data: statsResult, timestamp: Date.now() }));
    return statsResult;
  } catch (err) {
    console.warn("Primary LeetCode API failed, trying fallback...", err);
    // FALLBACK API
    try {
      const fallbackRes = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${clean}?t=${Date.now()}`, { cache: "no-store" as RequestCache });
      if (!fallbackRes.ok) throw new Error("Fallback API failed");
      const fallback = await fallbackRes.json();
      
      if (fallback.errors && fallback.errors.length > 0) {
        throw new Error(fallback.errors[0]?.message || "User not found");
      }

      const statsResult = {
        username: cleanedUsername,
        totalSolved: fallback.totalSolved || 0,
        easySolved: fallback.easySolved || 0,
        mediumSolved: fallback.mediumSolved || 0,
        hardSolved: fallback.hardSolved || 0,
        ranking: fallback.ranking || 0,
        realName: undefined,
        avatar: undefined,
        totalQuestions: fallback.totalQuestions,
      };

      localStorage.setItem(cacheKey, JSON.stringify({ data: statsResult, timestamp: Date.now() }));
      return statsResult;
    } catch (fallbackErr) {
      throw new Error(`LeetCode username "${username}" not found or both APIs are down. Please check username.`);
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════════
//  QUESTION APIs
// ════════════════════════════════════════════════════════════════════════════════

function mapQuestion(r: any): Question {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    difficulty: r.difficulty,
    language: r.language,
    expectedOutput: r.expected_output,
    testCases:
      typeof r.test_cases === "string"
        ? JSON.parse(r.test_cases)
        : (r.test_cases ?? []),
    vivas: typeof r.vivas === "string" ? JSON.parse(r.vivas) : (r.vivas ?? []),
    createdAt: r.created_at,
  };
}

export async function getQuestions(): Promise<Question[]> {
  if (isSupabaseConfigured && !hasCheckedDefaultQuestions) {
    hasCheckedDefaultQuestions = true;
    ensureDefaultQuestionsSeeded().catch(err => console.error("ensureDefaultQuestionsSeeded error:", err));
  }
  return run(
    async () => {
      const { data, error } = await supabase!
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const mapped = (data ?? []).map(mapQuestion);
      if (mapped.length === 0) {
        try {
          console.log("Auto-seeding questions in Supabase...");
          const seeded = await seedDefaultQuestions();
          if (seeded && seeded.length > 0) {
            return seeded;
          }
        } catch (e) {
          console.warn("Auto-seeding failed:", e);
        }
      }

      // Merge remote questions with localStorage questions
      const local = lsQuestions();
      const merged = [...mapped];
      for (const l of local) {
        if (!merged.some(r => String(r.id) === String(l.id) || r.title.toLowerCase() === l.title.toLowerCase())) {
          merged.push(l);
        }
      }
      return merged;
    },
    () => fetch(`${API_BASE_URL}/questions`),
    () => lsQuestions(),
  );
}

export async function createQuestion(
  question: Omit<Question, "id" | "createdAt">,
): Promise<Question> {
  return run(
    async () => {
      const { data, error } = await supabase!
        .from("questions")
        .insert({
          title: question.title.trim(),
          description: question.description.trim(),
          difficulty: question.difficulty,
          language: question.language,
          expected_output: (question.expectedOutput || "").trim(),
          test_cases: question.testCases || [],
          vivas: question.vivas || [],
        })
        .select()
        .single();
      if (error) throw error;
      return mapQuestion(data);
    },
    () =>
      fetch(`${API_BASE_URL}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(question),
      }),
    () => {
      const all = lsQuestions();
      const n: Question = {
        ...question,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      all.push(n);
      lsSaveQuestions(all);
      return n;
    },
  );
}

export async function updateQuestion(
  id: number | string,
  question: Omit<Question, "id" | "createdAt">,
): Promise<Question> {
  return run(
    async () => {
      const { data, error } = await supabase!
        .from("questions")
        .update({
          title: question.title.trim(),
          description: question.description.trim(),
          difficulty: question.difficulty,
          language: question.language,
          expected_output: (question.expectedOutput || "").trim(),
          test_cases: question.testCases || [],
          vivas: question.vivas || [],
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapQuestion(data);
    },
    () =>
      fetch(`${API_BASE_URL}/questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(question),
      }),
    () => {
      const all = lsQuestions();
      const idx = all.findIndex((q) => q.id.toString() === id.toString());
      if (idx === -1) throw new Error("Question not found");
      all[idx] = { ...all[idx], ...question };
      lsSaveQuestions(all);
      return all[idx];
    },
  );
}

export async function deleteQuestion(
  id: number | string,
): Promise<{ message: string }> {
  return run(
    async () => {
      const { error } = await supabase!.from("questions").delete().eq("id", id);
      if (error) throw error;
      return { message: "Question deleted successfully" };
    },
    () => fetch(`${API_BASE_URL}/questions/${id}`, { method: "DELETE" }),
    () => {
      lsSaveQuestions(
        lsQuestions().filter((q) => q.id.toString() !== id.toString()),
      );
      return { message: "Question deleted successfully" };
    },
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  ASSIGNMENT APIs
// ════════════════════════════════════════════════════════════════════════════════

export async function getAssignedQuestion(
  registerNumber: string,
): Promise<any> {
  // Supabase path
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase!
        .from("assigned_questions")
        .select("id, question_id, questions(*)")
        .eq("student_register_number", registerNumber.trim())
        .single();
      if (error) {
        if (error.code === "PGRST116") return null; // no rows
        throw error;
      }
      const q = (data as any).questions;
      return {
        assignmentId: data.id,
        questionId: data.question_id,
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        language: q.language,
        expectedOutput: q.expected_output,
        testCases:
          typeof q.test_cases === "string"
            ? JSON.parse(q.test_cases)
            : (q.test_cases ?? []),
        vivas:
          typeof q.vivas === "string" ? JSON.parse(q.vivas) : (q.vivas ?? []),
      };
    } catch (e) {
      console.warn("[Supabase] getAssignedQuestion failed:", e);
    }
  }

  // localStorage path
  const a = lsAssignments().find(
    (a) =>
      a.registerNumber.trim().toLowerCase() ===
      registerNumber.trim().toLowerCase(),
  );
  if (!a) return null;
  const q = lsQuestions().find(
    (q) => q.id.toString() === a.questionId.toString(),
  );
  if (!q) return null;
  return {
    assignmentId: Date.now(),
    questionId: q.id,
    title: q.title,
    description: q.description,
    difficulty: q.difficulty,
    language: q.language,
    expectedOutput: q.expectedOutput,
    testCases: q.testCases,
    vivas: q.vivas,
  };
}

export async function assignQuestion(
  registerNumber: string,
  questionId: number | string,
): Promise<any> {
  return run(
    async () => {
      const { data, error } = await supabase!
        .from("assigned_questions")
        .insert({
          student_register_number: registerNumber.trim(),
          question_id: questionId,
        })
        .select()
        .single();
      if (error) {
        if (error.code === "23505")
          throw new Error("Student already has a question assigned");
        throw error;
      }
      return { id: data.id, registerNumber: registerNumber.trim(), questionId };
    },
    () =>
      fetch(`${API_BASE_URL}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registerNumber, questionId }),
      }),
    () => {
      const all = lsAssignments();
      // Remove any existing assignment for this student to allow overwriting
      const filtered = all.filter(
        (a) =>
          a.registerNumber.toLowerCase() !==
          registerNumber.trim().toLowerCase(),
      );
      filtered.push({ registerNumber: registerNumber.trim(), questionId });
      lsSaveAssignments(filtered);
      return {
        id: Date.now(),
        registerNumber: registerNumber.trim(),
        questionId,
      };
    }
  );
}

export async function autoAssignRandomQuestion(
  registerNumber: string,
): Promise<any> {
  // Check if already assigned
  const existing = await getAssignedQuestion(registerNumber);
  if (existing) {
    return { id: existing.assignmentId, registerNumber, questionId: existing.questionId };
  }

  const allQs = await getQuestions();
  if (allQs.length === 0) return null; // Or return instead of throw error, so login doesn't fail
  
  const randomQ = allQs[Math.floor(Math.random() * allQs.length)];
  
  return run(
    async () => {
      // 1. Delete existing assignment (just in case)
      await supabase!.from("assigned_questions").delete().eq("student_register_number", registerNumber.trim());
      // 2. Insert new
      const { data, error } = await supabase!
        .from("assigned_questions")
        .insert({
          student_register_number: registerNumber.trim(),
          question_id: randomQ.id,
        })
        .select()
        .single();
      if (error) throw error;
      return { id: data.id, registerNumber: registerNumber.trim(), questionId: randomQ.id };
    },
    () => Promise.reject("Not implemented via REST"),
    () => {
      let all = lsAssignments();
      all = all.filter(a => a.registerNumber.toLowerCase() !== registerNumber.trim().toLowerCase());
      all.push({ registerNumber: registerNumber.trim(), questionId: randomQ.id });
      lsSaveAssignments(all);
      return { id: Date.now(), registerNumber: registerNumber.trim(), questionId: randomQ.id };
    }
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  EXAM RESULTS APIs
// ════════════════════════════════════════════════════════════════════════════════

function mapResult(r: any): ExamResult {
  return {
    id: r.id,
    student: {
      name: r.student_name,
      registerNumber: r.student_register_number,
      department: r.student_department,
      leetCodeUsername: r.student_leetcode_username,
    },
    question: r.question,
    programmingMarks: r.programming_marks,
    mcqMarks: r.mcq_marks,
    observationMarks: r.observation_marks || 0,
    totalMarks: r.total_marks,
    maxMarks: r.max_marks,
    code: r.code,
    codeOutput: r.code_output,
    outputMatches: r.output_matches,
    mcqAnswers:
      typeof r.mcq_answers === "string"
        ? JSON.parse(r.mcq_answers)
        : (r.mcq_answers ?? {}),
    timeSpent: r.time_spent,
    malpractice: r.malpractice,
    malpracticeReason: r.malpractice_reason,
    submittedAt: r.submitted_at,
  };
}

export async function syncLocalExamResultsToSupabase(): Promise<void> {
  if (!supabase) return;
  const localResultsStr = localStorage.getItem("exam_results");
  if (!localResultsStr) return;
  
  try {
    const localResults = JSON.parse(localResultsStr);
    if (!Array.isArray(localResults) || localResults.length === 0) return;

    let syncedCount = 0;
    for (const result of localResults) {
      // Sanitize old data format before inserting
      delete result.total_marks; // generated column
      if (!result.question_id && result.question?.id) {
        result.question_id = result.question.id.toString();
      }

      const { error } = await supabase.from("exam_results").insert(result);
      if (!error) {
        syncedCount++;
      } else {
        console.warn("Failed to sync a local result:", error);
        window.alert("Auto-Sync Failed for Student " + result.student_register_number + ": " + (error.message || JSON.stringify(error)));
      }
    }
    
    if (syncedCount > 0) {
      // Optional: Clear local storage after syncing to prevent infinite syncs
      // However, if we clear it, offline mode might lose history. 
      // For now, we clear the synced ones.
      localStorage.removeItem("exam_results");
      console.log(`Successfully synced ${syncedCount} offline exam results to Supabase!`);
    }
  } catch (err) {
    console.error("Error syncing local exam results:", err);
  }
}

export async function submitExamResult(
  result: Omit<ExamResult, "id" | "submittedAt">,
): Promise<{ id: number; success: boolean }> {
  const row = {
    student_register_number: result.student.registerNumber,
    student_name: result.student.name,
    student_department: result.student.department || "Unknown",
    student_leetcode_username: result.student.leetCodeUsername || null,
    question_id: result.questionId ? result.questionId.toString() : "0",
    question: result.question,
    programming_marks: result.programmingMarks || 0,
    mcq_marks: result.mcqMarks || 0,
    observation_marks: result.observationMarks || 0,
    max_marks: result.maxMarks || 50,
    code: result.code || "",
    code_output: result.codeOutput || "",
    output_matches: result.outputMatches,
    mcq_answers: result.mcqAnswers || {},
    time_spent: result.timeSpent || 0,
    malpractice: result.malpractice,
    malpractice_reason: result.malpracticeReason || null,
    submitted_at: new Date().toISOString(),
  };

  return run(
    async () => {
      const { data, error } = await supabase!
        .from("exam_results")
        .insert(row)
        .select("id")
        .single();
      if (error) throw error;
      return { id: data.id, success: true };
    },
    () =>
      fetch(`${API_BASE_URL}/exam-results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentRegisterNumber: result.student.registerNumber,
          studentName: result.student.name,
          studentDepartment: result.student.department,
          studentLeetCodeUsername: result.student.leetCodeUsername,
          question: result.question,
          programmingMarks: result.programmingMarks,
          mcqMarks: result.mcqMarks,
          observationMarks: result.observationMarks || 0,
          totalMarks: result.totalMarks,
          maxMarks: result.maxMarks,
          code: result.code,
          codeOutput: result.codeOutput,
          outputMatches: result.outputMatches,
          mcqAnswers: result.mcqAnswers,
          timeSpent: result.timeSpent,
          malpractice: result.malpractice,
          malpracticeReason: result.malpracticeReason,
        }),
      }),
    () => {
      const all = lsResults();
      const n: ExamResult = {
        ...result,
        id: Date.now(),
        submittedAt: new Date().toISOString(),
      };
      all.push(n);
      lsSaveResults(all);
      return { id: n.id as number, success: true };
    },
  );
}

export async function getExamResults(): Promise<ExamResult[]> {
  // Always fetch from localStorage first
  const localResults = lsResults();
  
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase!
        .from("exam_results")
        .select("*")
        .order("submitted_at", { ascending: false });
        
      if (error) {
        console.warn("[Supabase] getExamResults failed, using localStorage only:", error);
        return localResults;
      }
      
      const remoteResults = (data ?? []).map(mapResult);
      
      // Merge remote and local results, using ID or timestamp to prevent exact duplicates
      // (Though IDs might be different, let's just prefer remote if there's a match, 
      // but since inserts failed, remote will be empty anyway)
      const merged = [...remoteResults];
      
      // Add local results that aren't already in remote (by simple comparison)
      for (const local of localResults) {
        const exists = remoteResults.some(r => 
          r.student.registerNumber === local.student.registerNumber && 
          r.question === local.question &&
          r.submittedAt === local.submittedAt
        );
        if (!exists) {
          merged.push(local);
        }
      }
      
      return merged.sort((a, b) => 
        new Date(b.submittedAt || b.date).getTime() - new Date(a.submittedAt || a.date).getTime()
      );
    } catch (e) {
      console.warn("[Supabase] getExamResults exception, using localStorage only:", e);
      return localResults;
    }
  }

  // Fallback to Express backend if configured, otherwise just local
  try {
    const res = await fetch(`${API_BASE_URL}/exam-results`);
    if (res.ok) {
      const remote = await res.json();
      return remote;
    }
  } catch (e) {
    // Ignore
  }
  
  return localResults;
}

export async function getExamResultsByDate(
  date: string,
): Promise<ExamResult[]> {
  return run(
    async () => {
      const { data, error } = await supabase!
        .from("exam_results")
        .select("*")
        .gte("submitted_at", `${date}T00:00:00`)
        .lt("submitted_at", `${date}T23:59:59.999`)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapResult);
    },
    () =>
      fetch(`${API_BASE_URL}/exam-results/by-date/${encodeURIComponent(date)}`),
    () => lsResults().filter((r) => r.submittedAt?.startsWith(date)),
  );
}

export async function getStudentExamResults(
  registerNumber: string,
): Promise<ExamResult[]> {
  const localResults = lsResults().filter(
    (r) =>
      r.student.registerNumber.trim().toLowerCase() ===
      registerNumber.trim().toLowerCase(),
  );

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("exam_results")
        .select("*")
        .eq("student_register_number", registerNumber.trim())
        .order("submitted_at", { ascending: false });

      if (error) {
        console.warn("[Supabase] getStudentExamResults error:", error);
      }
      
      const remoteResults = (data ?? []).map(mapResult);
      const merged = [...remoteResults];
      
      for (const local of localResults) {
        const exists = remoteResults.some(r => 
          r.student.registerNumber === local.student.registerNumber && 
          r.question === local.question &&
          r.submittedAt === local.submittedAt
        );
        if (!exists) {
          merged.push(local);
        }
      }
      
      return merged.sort((a, b) => 
        new Date(b.submittedAt || b.date).getTime() - new Date(a.submittedAt || a.date).getTime()
      );
    } catch (e) {
      console.warn("[Supabase] getStudentExamResults exception:", e);
      return localResults;
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/exam-results/student/${encodeURIComponent(registerNumber)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}

  return localResults;
}

export async function updateExamResult(
  id: number | string,
  data: { observationMarks: number },
): Promise<{ id: number; observationMarks: number; totalMarks: number }> {
  return run(
    async () => {
      // Get existing to recalculate total
      const { data: existing, error: fetchErr } = await supabase!
        .from("exam_results")
        .select("programming_marks, mcq_marks")
        .eq("id", id)
        .single();
      if (fetchErr) throw fetchErr;
      const newTotal =
        (existing.programming_marks || 0) +
        (existing.mcq_marks || 0) +
        data.observationMarks;
      const { error } = await supabase!
        .from("exam_results")
        .update({
          observation_marks: data.observationMarks,
          total_marks: newTotal,
        })
        .eq("id", id);
      if (error) throw error;
      return {
        id: Number(id),
        observationMarks: data.observationMarks,
        totalMarks: newTotal,
      };
    },
    () =>
      fetch(`${API_BASE_URL}/exam-results/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    () => {
      const all = lsResults();
      const idx = all.findIndex((r) => r.id === Number(id));
      if (idx === -1) throw new Error("Exam result not found");
      const obs = data.observationMarks;
      const total =
        (all[idx].programmingMarks || 0) + (all[idx].mcqMarks || 0) + obs;
      all[idx] = { ...all[idx], observationMarks: obs, totalMarks: total };
      lsSaveResults(all);
      return { id: Number(id), observationMarks: obs, totalMarks: total };
    },
  );
}

export async function clearAllExamData(): Promise<{ message: string }> {
  return run(
    async () => {
      await supabase!.from("exam_results").delete().neq("id", 0);
      await supabase!.from("assigned_questions").delete().neq("id", 0);
      return { message: "Exam results and assignments cleared successfully" };
    },
    () => fetch(`${API_BASE_URL}/admin/clear-data`, { method: "POST" }),
    () => {
      lsSaveAssignments([]);
      lsSaveResults([]);
      return { message: "Exam results and assignments cleared successfully" };
    },
  );
}

export async function deleteExamResult(id: number | string): Promise<{ message: string }> {
  // Always delete from localStorage
  const all = lsResults();
  const target = all.find((r) => String(r.id) === String(id));
  
  // If found, also delete their assignment so they get a fresh question on retake
  if (target) {
    const regNum = target.student.registerNumber;
    
    // Clear local assignment
    const assigns = lsAssignments();
    lsSaveAssignments(assigns.filter(a => a.registerNumber.trim().toLowerCase() !== regNum.trim().toLowerCase()));
    
    // Clear remote assignment
    if (isSupabaseConfigured && supabase) {
      supabase.from("assigned_questions").delete().eq("student_register_number", regNum).then(({error}) => {
        if (error) console.warn("[Supabase] Assignment delete failed:", error);
      });
    }
  }

  lsSaveResults(all.filter((r) => String(r.id) !== String(id)));

  // Try to delete from Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("exam_results").delete().eq("id", id);
    } catch (e) {
      console.warn("[Supabase] Delete failed:", e);
    }
  }

  // Try to delete from backend API if available
  try {
    await fetch(`${API_BASE_URL}/exam-results/${id}`, { method: "DELETE" });
  } catch (e) {}

  return { message: "Exam result deleted successfully" };
}

export function logLeetCodePresence(registerNumber: string, dateStr: string) {
  const history = lsGet<Record<string, string[]>>("leetcode_attendance_history", {});
  if (!history[registerNumber]) {
    history[registerNumber] = [];
  }
  if (!history[registerNumber].includes(dateStr)) {
    history[registerNumber].push(dateStr);
    lsSet("leetcode_attendance_history", history);
  }
}

export function getLeetCodeAttendanceMap(): Record<string, Set<string>> {
  const map: Record<string, Set<string>> = {};
  const history = lsGet<Record<string, string[]>>("leetcode_attendance_history", {});
  for (const [regNum, dates] of Object.entries(history)) {
    for (const d of dates) {
      if (!map[d]) map[d] = new Set();
      map[d].add(regNum);
    }
  }
  return map;
}

// ─── Global Settings (Supabase) ────────────────────────────────────────────────

export async function getGlobalSetting(id: string, defaultValue: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("global_settings")
      .select("value")
      .eq("id", id)
      .single();
    if (error || !data) return defaultValue;
    return data.value;
  } catch {
    return defaultValue;
  }
}

export async function setGlobalSetting(id: string, value: string): Promise<void> {
  try {
    await supabase
      .from("global_settings")
      .upsert({ id, value }, { onConflict: "id" });
  } catch (err) {
    console.error("Failed to save global setting", err);
  }
}

// --- ONE TIME SCRIPT TO CLEAR IDHAYA'S ATTEMPTS AS REQUESTED ---
if (typeof window !== "undefined") {
  setTimeout(() => {
    try {
      // Clear exam results
      const results = JSON.parse(localStorage.getItem("exam_results") || "[]");
      const filtered = results.filter((r: any) => {
        const reg = (r.student?.registerNumber || "").trim().toUpperCase();
        return !reg.includes("E23AI011");
      });
      if (results.length !== filtered.length) {
        localStorage.setItem("exam_results", JSON.stringify(filtered));
        console.log("Successfully cleared Idhaya's attempts from local storage!");
      }
      
      // Clear question assignment
      const assigns = JSON.parse(localStorage.getItem("assigned_questions") || "[]");
      const filteredAssigns = assigns.filter((a: any) => {
        const reg = (a.registerNumber || "").trim().toUpperCase();
        return !reg.includes("E23AI011");
      });
      if (assigns.length !== filteredAssigns.length) {
        localStorage.setItem("assigned_questions", JSON.stringify(filteredAssigns));
        console.log("Successfully cleared Idhaya's assignment from local storage!");
      }

      // Also attempt to delete from Supabase if configured
      if (isSupabaseConfigured && supabase) {
        supabase.from("exam_results").delete().eq("student_register_number", "E23AI011").then(({ error }) => {
          if (!error) console.log("Cleared from Supabase as well");
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, 1000);
}

export async function seedDefaultQuestions(): Promise<Question[]> {
  if (isSupabaseConfigured) {
    // Delete existing rows
    const { error: delError } = await supabase!.from("questions").delete().neq("id", "0");
    if (delError) {
      throw new Error(`Supabase Delete Error: ${delError.message} (Please check your RLS policies to allow DELETE on the "questions" table)`);
    }

    // Insert 100 questions in chunks of 20 to prevent payload size issues
    const chunkSize = 20;
    const allInserted: Question[] = [];

    for (let i = 0; i < defaultQuestions.length; i += chunkSize) {
      const chunk = defaultQuestions.slice(i, i + chunkSize);
      const { data, error } = await supabase!
        .from("questions")
        .insert(chunk.map(q => ({
          title: q.title,
          description: q.description,
          difficulty: q.difficulty,
          language: q.language,
          expected_output: q.expectedOutput,
          test_cases: q.testCases,
          vivas: q.vivas
        })))
        .select();

      if (error) {
        throw new Error(`Supabase Insert Error: ${error.message} (Please check your RLS policies to allow INSERT on the "questions" table)`);
      }
      if (data) {
        allInserted.push(...data.map(mapQuestion));
      }
    }
    return allInserted;
  }

  // LocalStorage Fallback
  lsSet("exam_portal_questions", defaultQuestions);
  return defaultQuestions;
}

let hasCheckedDefaultQuestions = false;

export async function ensureDefaultQuestionsSeeded(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { data, error } = await supabase!
      .from("questions")
      .select("title");
    if (error) throw error;

    const existingTitles = new Set((data ?? []).map(q => q.title.toLowerCase().trim()));
    const missingQuestions = defaultQuestions.filter(q => !existingTitles.has(q.title.toLowerCase().trim()));

    if (missingQuestions.length > 0) {
      console.log(`[Auto-Seed] Inserting ${missingQuestions.length} missing default questions to Supabase...`);
      const chunkSize = 20;
      for (let i = 0; i < missingQuestions.length; i += chunkSize) {
        const chunk = missingQuestions.slice(i, i + chunkSize);
        const { error: insertError } = await supabase!
          .from("questions")
          .insert(chunk.map(q => ({
            title: q.title,
            description: q.description,
            difficulty: q.difficulty,
            language: q.language,
            expected_output: q.expectedOutput,
            test_cases: q.testCases,
            vivas: q.vivas
          })));
        if (insertError) {
          console.warn("[Auto-Seed] Failed to insert missing questions chunk:", insertError);
        }
      }
    }
  } catch (e) {
    console.error("[Auto-Seed] Error checking/seeding default questions:", e);
  }
}

