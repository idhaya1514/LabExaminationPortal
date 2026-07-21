import React, { useState, useEffect, useMemo } from "react";
import {
  Student,
  fetchLeetCodeSolvedOnly,
  getLeetCodeProfileUrl,
} from "../services/api";
import { Mail, Book, ExternalLink, Search, Loader2, User } from "lucide-react";

interface StudentsListProps {
  students: Student[];
  assignedRegNumbers: string[];
}

export default function StudentsList({
  students,
  assignedRegNumbers,
}: StudentsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [lcCounts, setLcCounts] = useState<
    Record<string, number | "error" | "loading">
  >({});

  const myStudents = useMemo(() => {
    return students.filter((s) =>
      assignedRegNumbers.includes(s.registerNumber),
    );
  }, [students, assignedRegNumbers]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return myStudents;
    const q = searchQuery.toLowerCase();
    return myStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.registerNumber.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)),
    );
  }, [myStudents, searchQuery]);

  useEffect(() => {
    // Fetch LeetCode counts for students who have a LeetCode username
    const fetchCounts = async () => {
      const counts: Record<string, number | "error" | "loading"> = {};

      // Initialize with loading state
      myStudents.forEach((s) => {
        if (s.leetCodeUsername) {
          counts[s.registerNumber] = "loading";
        }
      });
      setLcCounts({ ...counts });

      // Fetch in parallel chunks
      const CHUNK_SIZE = 5;
      for (let i = 0; i < myStudents.length; i += CHUNK_SIZE) {
        const chunk = myStudents.slice(i, i + CHUNK_SIZE);

        await Promise.all(
          chunk.map(async (student) => {
            if (!student.leetCodeUsername) return;

            try {
              const count = await fetchLeetCodeSolvedOnly(
                student.leetCodeUsername,
              );
              setLcCounts((prev) => ({
                ...prev,
                [student.registerNumber]: count,
              }));
            } catch (err) {
              setLcCounts((prev) => ({
                ...prev,
                [student.registerNumber]: "error",
              }));
            }
          }),
        );
      }
    };

    if (myStudents.length > 0) {
      fetchCounts();
    }
  }, [myStudents]);

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden mt-6 animate-fade-in">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <User className="w-6 h-6 text-indigo-500" />
            Students List
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Detailed directory of all assigned students.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <th className="px-6 py-4">Student Details</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Email ID</th>
              <th className="px-6 py-4 text-center">LeetCode Count</th>
              <th className="px-6 py-4 text-right">Profile View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  No students found.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {student.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {student.name}
                        </div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">
                          {student.registerNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                      <Book size={12} className="text-slate-400" />
                      {student.department}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {student.email ? (
                      <a
                        href={`mailto:${student.email}`}
                        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        <Mail size={14} />
                        {student.email}
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400 italic">
                        Not provided
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {student.leetCodeUsername ? (
                      lcCounts[student.registerNumber] === "loading" ? (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400 mx-auto" />
                      ) : lcCounts[student.registerNumber] === "error" ? (
                        <span
                          className="text-xs text-red-500"
                          title="Failed to load count"
                        >
                          Error
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-orange-50 text-orange-700 font-bold rounded-full text-sm border border-orange-100">
                          {lcCounts[student.registerNumber] !== undefined
                            ? lcCounts[student.registerNumber]
                            : "-"}
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {student.leetCodeUsername ? (
                      <a
                        href={getLeetCodeProfileUrl(student.leetCodeUsername)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-indigo-200"
                      >
                        <ExternalLink size={14} />
                        View Profile
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400 italic">
                        No account
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
