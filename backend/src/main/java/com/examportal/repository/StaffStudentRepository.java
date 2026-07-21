package com.examportal.repository;

import com.examportal.model.StaffStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffStudentRepository extends JpaRepository<StaffStudent, Long> {
    List<StaffStudent> findByStaffId(String staffId);
    Optional<StaffStudent> findByStaffIdAndStudentRegisterNumber(String staffId, String studentRegisterNumber);
    Optional<StaffStudent> findByStudentRegisterNumber(String studentRegisterNumber);
    void deleteByStaffIdAndStudentRegisterNumber(String staffId, String studentRegisterNumber);
}
