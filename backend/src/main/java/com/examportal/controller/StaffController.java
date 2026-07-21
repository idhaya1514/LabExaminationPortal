package com.examportal.controller;

import com.examportal.model.ExamResult;
import com.examportal.model.Staff;
import com.examportal.model.StaffStudent;
import com.examportal.repository.ExamResultRepository;
import com.examportal.repository.StaffRepository;
import com.examportal.repository.StaffStudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "*")
public class StaffController {

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private StaffStudentRepository staffStudentRepository;

    @Autowired
    private ExamResultRepository examResultRepository;

    // Admin: Create Staff
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createStaff(@RequestBody Staff staff) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (staffRepository.findByStaffId(staff.getStaffId()).isPresent()) {
                response.put("success", false);
                response.put("error", "Staff ID already exists");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            Staff saved = staffRepository.save(staff);
            response.put("success", true);
            response.put("id", saved.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Admin: Get All Staffs
    @GetMapping("/all")
    public ResponseEntity<List<Staff>> getAllStaffs() {
        return ResponseEntity.ok(staffRepository.findAll());
    }

    // Admin: Get All Assignments
    @GetMapping("/assignments")
    public ResponseEntity<List<StaffStudent>> getAllAssignments() {
        return ResponseEntity.ok(staffStudentRepository.findAll());
    }

    // Admin: Assign Students to Staff
    @PostMapping("/assign")
    @Transactional
    public ResponseEntity<Map<String, Object>> assignStudents(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();
        try {
            String staffId = (String) payload.get("staffId");
            
            Object rawStudentNumbers = payload.get("studentRegisterNumbers");
            if (staffId == null || !(rawStudentNumbers instanceof List)) {
                response.put("success", false);
                response.put("error", "Missing staffId or studentRegisterNumbers");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            @SuppressWarnings("unchecked")
            List<String> studentRegisterNumbers = (List<String>) rawStudentNumbers;

            // For each student, check if they are already assigned anywhere
            // If they are, update the staffId. If not, create a new assignment.
            for (String regNo : studentRegisterNumbers) {
                Optional<StaffStudent> existing = staffStudentRepository.findByStudentRegisterNumber(regNo);
                if (existing.isPresent()) {
                    StaffStudent ss = existing.get();
                    if (!ss.getStaffId().equals(staffId)) {
                        ss.setStaffId(staffId);
                        staffStudentRepository.save(ss);
                    }
                } else {
                    StaffStudent ss = new StaffStudent();
                    ss.setStaffId(staffId);
                    ss.setStudentRegisterNumber(regNo);
                    staffStudentRepository.save(ss);
                }
            }
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> payload) {
        Map<String, Object> response = new HashMap<>();
        try {
            String staffId = payload.get("staffId");
            String password = payload.get("password");

            Optional<Staff> staffOpt = staffRepository.findByStaffId(staffId);
            if (staffOpt.isPresent() && staffOpt.get().getPassword().equals(password)) {
                response.put("success", true);
                response.put("staff", staffOpt.get());
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("error", "Invalid Staff ID or Password");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("error", e.getMessage() != null ? e.getMessage() : "Unknown backend error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Staff: Get assigned students' results
    @GetMapping("/{staffId}/results")
    public ResponseEntity<List<ExamResult>> getAssignedStudentsResults(@PathVariable String staffId) {
        List<StaffStudent> assignments = staffStudentRepository.findByStaffId(staffId);
        List<String> assignedRegNumbers = assignments.stream()
                .map(ss -> ss.getStudentRegisterNumber())
                .collect(Collectors.toList());

        List<ExamResult> allResults = examResultRepository.findAllByOrderBySubmittedAtDesc();
        
        List<ExamResult> filteredResults = allResults.stream()
                .filter(result -> assignedRegNumbers.contains(result.getStudentRegisterNumber()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(filteredResults);
    }
}
