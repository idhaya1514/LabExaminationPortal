import React, { useState, useEffect, useMemo } from "react";
import { ExamResult } from "../types";
import {
  LogOut,
  UserCircle,
  BookOpen,
  Clock,
  FileText,
  Loader2,
  Search,
  Activity,
  Award,
  Code2,
  Filter,
  Users,
} from "lucide-react";
import LeetCodeTracker from "./LeetCodeTracker";
import StudentsList from "./StudentsList";
import { getStudents } from "../services/api";

export default function StaffDashboard({
  staff,
  onLogout,
}: {
  staff: any;
  onLogout: () => void;
}) {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]); // New: store all students
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [filterAttendance, setFilterAttendance] = useState("All");
  const [sortScore, setSortScore] = useState("None");

  const [activeTab, setActiveTab] = useState<
    "performance" | "leetcode" | "students"
  >("performance");

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        // Fetch Results
        const resResults = await fetch(
          `http://localhost:8085/api/staff/${staff.staffId}/results`,
        );
        if (resResults.ok) {
          const data = await resResults.json();
          setResults(data);
        }

        // Fetch Students to get full details for unassigned/unattended mapping
        const allStudents = await getStudents();
        setStudents(allStudents);

        // Fetch Assignments
        const resAssignments = await fetch(
          `http://localhost:8085/api/staff/assignments`,
        );
        if (resAssignments.ok) {
          const assignments = await resAssignments.json();
          const myAssignments = assignments.filter(
            (a: any) =>
              a.staffId === staff.staffId || a.staff_id === staff.staffId,
          );
          setAssignedStudents(
            myAssignments.map(
              (a: any) => a.studentRegisterNumber || a.student_register_number,
            ),
          );
        }
      } catch (e) {
        console.error("Failed to fetch staff data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStaffData();
  }, [staff.staffId]);

  // Combine results with unattended students, then filter
  const processedResults = useMemo(() => {
    // 1. Create a map of existing results
    const resultsMap = new Map();
    results.forEach((r) =>
      resultsMap.set(r.studentRegisterNumber, { ...r, hasAttended: true }),
    );

    // 2. Add un-attended students based on assignments
    const myStudents = students.filter((s) =>
      assignedStudents.includes(s.registerNumber),
    );
    myStudents.forEach((s) => {
      if (!resultsMap.has(s.registerNumber)) {
        resultsMap.set(s.registerNumber, {
          studentName: s.name,
          studentRegisterNumber: s.registerNumber,
          studentDepartment: s.department,
          totalMarks: 0,
          maxMarks: 0,
          submittedAt: "",
          hasAttended: false,
        });
      }
    });

    let combined = Array.from(resultsMap.values());

    // 3. Apply Filters
    if (filterDepartment !== "All") {
      combined = combined.filter(
        (r) => r.studentDepartment === filterDepartment,
      );
    }

    if (filterAttendance === "Attended") {
      combined = combined.filter((r) => r.hasAttended);
    } else if (filterAttendance === "Not Attended") {
      combined = combined.filter((r) => !r.hasAttended);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      combined = combined.filter(
        (r) =>
          r.studentName?.toLowerCase().includes(q) ||
          r.studentRegisterNumber?.toLowerCase().includes(q) ||
          r.studentDepartment?.toLowerCase().includes(q),
      );
    }

    // 4. Apply Sorting
    if (sortScore === "Highest First") {
      combined.sort((a, b) => {
        const pA = a.hasAttended
          ? a.maxMarks
            ? a.totalMarks / a.maxMarks
            : 0
          : -1;
        const pB = b.hasAttended
          ? b.maxMarks
            ? b.totalMarks / b.maxMarks
            : 0
          : -1;
        return pB - pA;
      });
    } else if (sortScore === "Lowest First") {
      combined.sort((a, b) => {
        const pA = a.hasAttended
          ? a.maxMarks
            ? a.totalMarks / a.maxMarks
            : 0
          : 999;
        const pB = b.hasAttended
          ? b.maxMarks
            ? b.totalMarks / b.maxMarks
            : 0
          : 999;
        return pA - pB;
      });
    } else {
      // Default: Attended first, then alphabetical
      combined.sort((a, b) => {
        if (a.hasAttended && !b.hasAttended) return -1;
        if (!a.hasAttended && b.hasAttended) return 1;
        return (a.studentName || "").localeCompare(b.studentName || "");
      });
    }

    return combined;
  }, [
    results,
    assignedStudents,
    students,
    filterDepartment,
    filterAttendance,
    sortScore,
    searchQuery,
  ]);

  // Unique departments for filter dropdown
  const departments = useMemo(() => {
    const depts = new Set(
      students
        .filter((s) => assignedStudents.includes(s.registerNumber))
        .map((s) => s.department)
        .filter(Boolean),
    );
    return ["All", ...Array.from(depts)];
  }, [students, assignedStudents]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
                <BookOpen size={20} />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
                Staff Portal
              </h1>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
                <UserCircle size={18} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                  Welcome, {staff.name}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 text-slate-600 hover:text-red-600 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-red-50 border border-transparent hover:border-red-100"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              Student Monitoring
            </h2>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <Activity size={16} className="text-indigo-500" />
              Track performance and daily LeetCode activity
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 bg-white p-1 rounded-xl border border-slate-200 shadow-sm inline-flex">
          <button
            onClick={() => setActiveTab("performance")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
              activeTab === "performance"
                ? "bg-indigo-50 text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Activity size={18} />
            Test Performance
          </button>
          <button
            onClick={() => setActiveTab("leetcode")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
              activeTab === "leetcode"
                ? "bg-purple-50 text-purple-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Code2 size={18} />
            LeetCode Tracking
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
              activeTab === "students"
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Users size={18} />
            Students List
          </button>
        </div>

        {activeTab === "performance" && (
          <>
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <Filter size={16} className="text-slate-400" />
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="bg-transparent text-sm text-slate-700 outline-none font-medium cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d === "All" ? "All Depts" : d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <select
                    value={filterAttendance}
                    onChange={(e) => setFilterAttendance(e.target.value)}
                    className="bg-transparent text-sm text-slate-700 outline-none font-medium cursor-pointer"
                  >
                    <option value="All">All Attendance</option>
                    <option value="Attended">Attended</option>
                    <option value="Not Attended">Not Attended</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <select
                    value={sortScore}
                    onChange={(e) => setSortScore(e.target.value)}
                    className="bg-transparent text-sm text-slate-700 outline-none font-medium cursor-pointer"
                  >
                    <option value="None">Sort by Score: None</option>
                    <option value="Highest First">Highest First</option>
                    <option value="Lowest First">Lowest First</option>
                  </select>
                </div>
              </div>

              <div className="relative w-full md:w-72">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search by name, ID, or dept..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                />
              </div>
            </div>
            {/* Results Container */}
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 text-indigo-500 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p className="text-lg font-medium text-slate-600">
                  Loading student performances...
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
                <div className="bg-slate-50 p-6 rounded-full mb-6">
                  <FileText size={48} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">
                  No Results Found
                </h3>
                <p className="text-slate-500 max-w-md">
                  There are currently no exam results available for your
                  assigned students. Results will appear here once students
                  complete their exams.
                </p>
              </div>
            ) : processedResults.length === 0 && students.length === 0 ? (
              <div className="text-center p-12 bg-white border border-slate-200 rounded-3xl shadow-sm">
                <Search className="mx-auto text-slate-300 mb-3" size={32} />
                <h3 className="text-slate-600 font-medium text-lg">
                  No matches found
                </h3>
                <p className="text-slate-400 mt-1">
                  Try adjusting your search query.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        <th className="px-6 py-4 rounded-tl-2xl">
                          Student Details
                        </th>
                        <th className="px-6 py-4">Department</th>
                        <th className="px-6 py-4">Score</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 rounded-tr-2xl text-right">
                          Date Submitted
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {processedResults.map((r, idx) => {
                        const percentage =
                          r.hasAttended && r.maxMarks
                            ? ((r.totalMarks || 0) / r.maxMarks) * 100
                            : 0;

                        let statusColor =
                          "bg-slate-100 text-slate-600 border-slate-200";
                        let statusText = "Needs Review";

                        if (!r.hasAttended) {
                          statusColor =
                            "bg-rose-50 text-rose-600 border-rose-200";
                          statusText = "Not Attended";
                        } else if (percentage >= 80) {
                          statusColor =
                            "bg-emerald-50 text-emerald-700 border-emerald-200";
                          statusText = "Excellent";
                        } else if (percentage >= 50) {
                          statusColor =
                            "bg-amber-50 text-amber-700 border-amber-200";
                          statusText = "Average";
                        } else {
                          statusColor =
                            "bg-orange-50 text-orange-700 border-orange-200";
                          statusText = "Needs Improvement";
                        }

                        return (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/80 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                                  {r.studentName?.charAt(0).toUpperCase() ||
                                    "?"}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                    {r.studentName}
                                  </div>
                                  <div className="text-xs font-mono text-slate-500 mt-0.5">
                                    {r.studentRegisterNumber}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                                {r.studentDepartment}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {r.hasAttended ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-slate-800">
                                      {r.totalMarks}
                                    </span>
                                    <span className="text-sm text-slate-400">
                                      / {r.maxMarks}
                                    </span>
                                  </div>
                                  {/* Progress bar */}
                                  <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${percentage >= 80 ? "bg-emerald-500" : percentage >= 50 ? "bg-amber-500" : "bg-orange-500"}`}
                                      style={{
                                        width: `${Math.min(100, Math.max(0, percentage))}%`,
                                      }}
                                    ></div>
                                  </div>
                                </>
                              ) : (
                                <span className="text-sm font-medium text-slate-400">
                                  -
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}
                              >
                                {r.hasAttended && percentage >= 80 && (
                                  <Award size={12} />
                                )}
                                {statusText}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {r.hasAttended && r.submittedAt ? (
                                <div className="flex items-center justify-end gap-2 text-sm text-slate-500">
                                  <Clock size={14} className="text-slate-400" />
                                  {new Date(r.submittedAt).toLocaleDateString(
                                    undefined,
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-slate-400">
                                  -
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "leetcode" && (
          <div className="animate-fade-in mt-4">
            <LeetCodeTracker
              assignedRegNumbers={assignedStudents}
              students={students}
              filterDepartment={filterDepartment}
            />
          </div>
        )}

        {activeTab === "students" && (
          <div className="animate-fade-in mt-4">
            <StudentsList
              students={students}
              assignedRegNumbers={assignedStudents}
            />
          </div>
        )}
      </main>
    </div>
  );
}
