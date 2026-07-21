package com.examportal.model;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "staff_students")
public class StaffStudent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "staff_id", nullable = false)
    private String staffId;

    @Column(name = "student_register_number", nullable = false)
    private String studentRegisterNumber;

    @Column(name = "assigned_at", insertable = false, updatable = false)
    private ZonedDateTime assignedAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }

    public String getStudentRegisterNumber() { return studentRegisterNumber; }
    public void setStudentRegisterNumber(String studentRegisterNumber) { this.studentRegisterNumber = studentRegisterNumber; }

    public ZonedDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(ZonedDateTime assignedAt) { this.assignedAt = assignedAt; }
}
