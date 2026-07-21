import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Save,
  Loader2,
  Search,
  KeyRound,
  Type,
  IdCard,
} from "lucide-react";
import { getStudents } from "../services/api";

export default function StaffManagement() {
  const [staffs, setStaffs] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "create" | "assign">(
    "list",
  );

  const [newStaffId, setNewStaffId] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStaffs();
    fetchStudents();
    fetchAssignments();
  }, []);

  const fetchStaffs = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://lab-exam-backend.onrender.com/api/staff/all");
      if (res.ok) {
        const data = await res.json();
        setStaffs(data);
        // By default, select all staffs when they are fetched
        setSelectedStaffIds(data.map((s: any) => s.staffId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch("https://lab-exam-backend.onrender.com/api/staff/assignments");
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("https://lab-exam-backend.onrender.com/api/staff/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: newStaffId,
          name: newName,
          password: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Staff created successfully!");
        setNewStaffId("");
        setNewName("");
        setNewPassword("");
        fetchStaffs();
        setActiveTab("list");
      } else {
        alert(data.error || "Failed to create staff");
      }
    } catch (e) {
      alert("Error creating staff");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStudents = async () => {
    if (staffs.length === 0)
      return alert("Please add at least one staff member first");
    if (students.length === 0)
      return alert("There are no registered students to assign");
    if (selectedStaffIds.length === 0)
      return alert(
        "Please select at least one staff member to assign students to.",
      );

    const assignedRegNumbers = new Set(
      assignments.map(
        (a: any) => a.studentRegisterNumber || a.student_register_number,
      ),
    );
    const unassignedStudents = students.filter(
      (s) => !assignedRegNumbers.has(s.registerNumber),
    );

    if (unassignedStudents.length === 0)
      return alert(
        "All students are already assigned. No new students to assign.",
      );

    if (
      !confirm(
        `Are you sure you want to distribute ${unassignedStudents.length} new unassigned students equally among the ${selectedStaffIds.length} selected staff members? Existing assignments will not be affected.`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const selectedStaffs = staffs.filter((s) =>
        selectedStaffIds.includes(s.staffId),
      );
      const staffAssignments = selectedStaffs.map((staff) => ({
        staffId: staff.staffId,
        studentRegisterNumbers: [] as string[],
      }));

      // Group ONLY unassigned students by department
      const studentsByDept: Record<string, any[]> = {};
      unassignedStudents.forEach((s) => {
        const dept = s.department || "Unknown";
        if (!studentsByDept[dept]) studentsByDept[dept] = [];
        studentsByDept[dept].push(s);
      });

      // Distribute each department equally across the selected staffs
      Object.values(studentsByDept).forEach((deptStudents) => {
        // Sort by register number for consistent alphabetical assignment
        deptStudents.sort((a, b) =>
          (a.registerNumber || "").localeCompare(b.registerNumber || ""),
        );

        deptStudents.forEach((student, index) => {
          const staffIndex = index % selectedStaffs.length;
          staffAssignments[staffIndex].studentRegisterNumbers.push(
            student.registerNumber,
          );
        });
      });

      const results = [];
      for (const assignment of staffAssignments) {
        const res = await fetch("https://lab-exam-backend.onrender.com/api/staff/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(assignment),
        });
        results.push(await res.json());
      }

      const hasError = results.some((r) => !r.success);

      if (hasError) {
        alert("Some assignments failed. Check server logs.");
      } else {
        alert("Success! All students were assigned to the selected staffs.");
        fetchAssignments();
        setActiveTab("list");
      }
    } catch (e) {
      alert("Error assigning students");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.registerNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const assignedRegNumbers = new Set(
    assignments.map(
      (a: any) => a.studentRegisterNumber || a.student_register_number,
    ),
  );
  const unassignedStudents = students.filter(
    (s) => !assignedRegNumbers.has(s.registerNumber),
  );

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 max-h-[85vh] overflow-y-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Staff Management
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Manage instructors and student assignments
          </p>
        </div>

        <div className="flex p-1 bg-slate-100/80 rounded-xl">
          <button
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
              activeTab === "list"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            }`}
          >
            <Users size={16} />
            Directory
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
              activeTab === "create"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            }`}
          >
            <UserPlus size={16} />
            Onboard Staff
          </button>
          <button
            onClick={() => setActiveTab("assign")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
              activeTab === "assign"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            }`}
          >
            <Save size={16} />
            Assign Students
          </button>
        </div>
      </div>

      {/* 1. STAFF DIRECTORY TAB */}
      {activeTab === "list" && (
        <div className="animate-fade-in">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-indigo-500">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-sm font-medium">Loading directory...</p>
            </div>
          ) : staffs.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <Users className="mx-auto text-slate-300 mb-3" size={48} />
              <h3 className="text-slate-600 font-medium">
                No staff members found
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Start by onboarding your first staff member.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staffs.map((s, i) => {
                // Find all assignments for this staff
                const myAssignments = assignments.filter(
                  (a: any) =>
                    a.staffId === s.staffId || a.staff_id === s.staffId,
                );
                const studentRegNumbers = myAssignments.map(
                  (a: any) =>
                    a.studentRegisterNumber || a.student_register_number,
                );

                // Match with student details
                const assignedStudents = students.filter((st) =>
                  studentRegNumbers.includes(st.registerNumber),
                );

                return (
                  <div
                    key={i}
                    className="group p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 flex flex-col h-full"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold text-lg group-hover:scale-110 transition-transform">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-semibold text-slate-800 truncate">
                          {s.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md mt-1 inline-block">
                          ID: {s.staffId}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                        Assigned Students
                        <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[10px]">
                          {assignedStudents.length}
                        </span>
                      </h5>
                      <div className="bg-slate-50/50 rounded-xl p-3 min-h-[80px] max-h-[150px] overflow-y-auto border border-slate-100 scrollbar-thin scrollbar-thumb-slate-200">
                        {assignedStudents.length > 0 ? (
                          <ul className="space-y-1.5">
                            {assignedStudents.map((student) => (
                              <li
                                key={student.registerNumber}
                                className="flex justify-between items-center text-xs"
                              >
                                <span className="font-medium text-slate-700 truncate pr-2">
                                  {student.name}
                                </span>
                                <span className="text-slate-400 font-mono shrink-0">
                                  {student.registerNumber}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-slate-400 italic text-center py-4">
                            No students assigned yet
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 border-t border-slate-50 pt-3 mt-4 flex justify-between shrink-0">
                      <span>Joined</span>
                      <span>
                        {s.createdAt
                          ? new Date(s.createdAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : "Recently"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. CREATE STAFF TAB */}
      {activeTab === "create" && (
        <div className="animate-fade-in max-w-xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative overflow-hidden">
            {/* Decorative background blur */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            <div className="text-center mb-8 relative z-10">
              <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4 rotate-3">
                <UserPlus size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                Onboard New Staff
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Create credentials for a new instructor
              </p>
            </div>

            <form
              onSubmit={handleCreateStaff}
              className="space-y-5 relative z-10"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Staff ID
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <IdCard size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={newStaffId}
                    onChange={(e) => setNewStaffId(e.target.value)}
                    placeholder="e.g. STF-001"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Type size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter staff name"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Account Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <KeyRound size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-mono tracking-widest"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !newStaffId || !newName || !newPassword}
                className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgb(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgb(99,102,241,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <UserPlus size={18} />
                )}
                <span>
                  {loading ? "Creating Profile..." : "Create Staff Profile"}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. ASSIGN STUDENTS TAB */}
      {activeTab === "assign" && (
        <div className="animate-fade-in max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] text-center relative overflow-hidden">
            {/* Decorative background blur */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            <div className="h-20 w-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-6 rotate-3">
              <Users size={32} />
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Automated Staff Allocation
            </h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-sm leading-relaxed">
              Distribute all registered students equally and randomly among all
              onboarded staff members. This ensures a fair workload for
              examination supervision.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Unassigned Students
                </p>
                <p className="text-3xl font-black text-indigo-600">
                  {unassignedStudents.length}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Available Staff
                </p>
                <p className="text-3xl font-black text-purple-600">
                  {staffs.length}
                </p>
              </div>
            </div>

            {/* Staff Selection Checklist */}
            <div className="text-left mb-8 border border-slate-100 rounded-xl overflow-hidden">
              <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-sm font-semibold text-slate-700">
                  Select Staff for Assignment
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedStaffIds.length === staffs.length) {
                      setSelectedStaffIds([]); // deselect all
                    } else {
                      setSelectedStaffIds(staffs.map((s) => s.staffId)); // select all
                    }
                  }}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  {selectedStaffIds.length === staffs.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto p-2 bg-white">
                {staffs.length === 0 ? (
                  <div className="text-center text-sm text-slate-400 py-4">
                    No staffs available
                  </div>
                ) : (
                  <div className="space-y-1">
                    {staffs.map((staff) => (
                      <label
                        key={staff.staffId}
                        className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStaffIds.includes(staff.staffId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStaffIds([
                                ...selectedStaffIds,
                                staff.staffId,
                              ]);
                            } else {
                              setSelectedStaffIds(
                                selectedStaffIds.filter(
                                  (id) => id !== staff.staffId,
                                ),
                              );
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 focus:ring-2"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">
                            {staff.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {staff.staffId}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleAssignStudents}
              disabled={
                loading ||
                students.length === 0 ||
                staffs.length === 0 ||
                selectedStaffIds.length === 0
              }
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold py-4 rounded-xl transition-all shadow-[0_4px_12px_rgb(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgb(99,102,241,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex justify-center items-center gap-2 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  <span>Allocating Students...</span>
                </>
              ) : (
                <>
                  <Save size={22} />
                  <span>
                    Assign Students to {selectedStaffIds.length} Staff(s)
                  </span>
                </>
              )}
            </button>
            <p className="text-xs text-slate-400 mt-4">
              Note: This action will overwrite any existing staff-student
              assignments for the selected staffs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
