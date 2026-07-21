import { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import ExamModule from "./components/ExamModule";
import ResultPage from "./components/ResultPage";
import AdminPanel from "./components/AdminPanel";
import AdminQuestionManager from "./components/AdminQuestionManager";
import AdminLogin from "./components/AdminLogin";
import StudentManagement from "./components/StudentManagement";
import StudentPerformance from "./components/StudentPerformance";
import DailyTracker from "./components/DailyTracker";
import StudentProfile from "./components/StudentProfile";
import StaffLogin from "./components/StaffLogin";
import StaffDashboard from "./components/StaffDashboard";
import StaffManagement from "./components/StaffManagement";
import { Toaster } from "./components/ui/sonner";
import { getStudent, supabase, updateStudentPassword } from "./services/api";

type Page =
  | "login"
  | "dashboard"
  | "exam"
  | "result"
  | "adminLogin"
  | "admin"
  | "questionManager"
  | "studentManager"
  | "studentPerformance"
  | "dailyTracker"
  | "examHistory"
  | "profile"
  | "staffManager"
  | "staffLogin"
  | "staffDashboard";

import ExamHistory from "./components/ExamHistory";

export interface Student {
  name: string;
  registerNumber: string;
  department: string;
  email?: string;
  leetCodeUsername?: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [student, setStudent] = useState<Student | null>(null);
  const [examData, setExamData] = useState<any>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [staff, setStaff] = useState<any>(null);

  // On mount: restore student session
  useEffect(() => {
    const savedStudent = localStorage.getItem("currentStudent");
    if (savedStudent) {
      try {
        const parsed = JSON.parse(savedStudent);
        getStudent(parsed.registerNumber)
          .then((dbStudent) => {
            setStudent({
              name: dbStudent.name,
              registerNumber: dbStudent.registerNumber,
              department: dbStudent.department,
              email: dbStudent.email,
              leetCodeUsername: dbStudent.leetCodeUsername,
            });
            setCurrentPage("dashboard");
          })
          .catch(() => {
            localStorage.removeItem("currentStudent");
            setCurrentPage("login");
          });
      } catch {
        localStorage.removeItem("currentStudent");
      }
    }

    const adminSession = sessionStorage.getItem("adminLoggedIn");
    const adminPage = sessionStorage.getItem("adminPage") as Page | null;
    if (adminSession === "true") {
      setIsAdminLoggedIn(true);
      setCurrentPage(adminPage || "admin");
    }

    // Handle Supabase Auth state changes (specifically password recovery)
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event: any, session: any) => {
          if (event === "PASSWORD_RECOVERY") {
            const newPassword = prompt(
              "Password Recovery Mode: Please enter your new password (min 6 characters):",
            );
            if (newPassword && newPassword.length >= 6) {
              try {
                await updateStudentPassword(newPassword);
                alert(
                  "Password updated successfully! You can now log in with your new password.",
                );
              } catch (err: any) {
                alert("Failed to update password: " + err.message);
              }
            } else if (newPassword) {
              alert(
                "Password must be at least 6 characters. Please refresh and try the recovery link again.",
              );
            }
            // Clear hash and force user to login page
            window.location.hash = "";
            setCurrentPage("login");
          }
        },
      );
      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const handleLogin = (studentData: Student) => {
    setStudent(studentData);
    localStorage.setItem("currentStudent", JSON.stringify(studentData));
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    setStudent(null);
    localStorage.removeItem("currentStudent");
    setCurrentPage("login");
  };

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
    sessionStorage.setItem("adminLoggedIn", "true");
    sessionStorage.setItem("adminPage", "admin");
    setCurrentPage("admin");
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem("adminLoggedIn");
    sessionStorage.removeItem("adminPage");
    setCurrentPage("login");
  };

  const navigateAdmin = (page: Page) => {
    sessionStorage.setItem("adminPage", page);
    setCurrentPage(page);
  };

  const handleStaffLogin = (staffData: any) => {
    setStaff(staffData);
    setCurrentPage("staffDashboard");
  };

  const handleStaffLogout = () => {
    setStaff(null);
    setCurrentPage("login");
  };

  const handleStartExam = (question: any) => {
    setExamData({ question });
    setCurrentPage("exam");
  };

  const handleExamComplete = (results: any) => {
    setExamData(results);
    setCurrentPage("result");
  };

  return (
    <div
      className="min-h-screen text-slate-800"
      style={{
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      }}
    >
      <Toaster position="top-right" richColors />

      {currentPage === "login" && (
        <LoginPage
          onLogin={handleLogin}
          onAdminLogin={handleAdminLogin}
          onStaffLogin={handleStaffLogin}
        />
      )}
      {currentPage === "dashboard" && student && (
        <Dashboard
          student={student}
          onStartExam={handleStartExam}
          onLogout={handleLogout}
          onViewHistory={() => setCurrentPage("examHistory")}
          onViewProfile={() => setCurrentPage("profile")}
        />
      )}
      {currentPage === "profile" && student && (
        <StudentProfile
          student={student}
          onBack={() => setCurrentPage("dashboard")}
        />
      )}
      {currentPage === "exam" && student && examData && (
        <ExamModule
          student={student}
          question={examData.question}
          onComplete={handleExamComplete}
          onBack={() => setCurrentPage("dashboard")}
        />
      )}
      {currentPage === "result" && student && examData && (
        <ResultPage
          student={student}
          results={examData}
          onBackToDashboard={handleLogout}
        />
      )}
      {currentPage === "examHistory" && student && (
        <ExamHistory
          student={student}
          onBack={() => setCurrentPage("dashboard")}
        />
      )}
      {currentPage === "admin" && isAdminLoggedIn && (
        <AdminPanel
          onBack={handleAdminLogout}
          onManageQuestions={() => navigateAdmin("questionManager")}
          onManageStudents={() => navigateAdmin("studentManager")}
          onViewPerformance={() => navigateAdmin("studentPerformance")}
          onDailyTracker={() => navigateAdmin("dailyTracker")}
          onManageStaff={() => navigateAdmin("staffManager")}
        />
      )}
      {currentPage === "questionManager" && isAdminLoggedIn && (
        <AdminQuestionManager onBack={() => navigateAdmin("admin")} />
      )}
      {currentPage === "studentManager" && isAdminLoggedIn && (
        <StudentManagement onBack={() => navigateAdmin("admin")} />
      )}
      {currentPage === "studentPerformance" && isAdminLoggedIn && (
        <StudentPerformance onBack={() => navigateAdmin("admin")} />
      )}
      {currentPage === "dailyTracker" && isAdminLoggedIn && (
        <DailyTracker onBack={() => navigateAdmin("admin")} />
      )}
      {currentPage === "staffDashboard" && staff && (
        <StaffDashboard staff={staff} onLogout={handleStaffLogout} />
      )}
      {currentPage === "staffManager" && isAdminLoggedIn && (
        <div className="min-h-screen bg-slate-50">
          <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                Staff Management
              </h2>
              <button
                onClick={() => navigateAdmin("admin")}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
            <StaffManagement />
          </div>
        </div>
      )}
    </div>
  );
}
