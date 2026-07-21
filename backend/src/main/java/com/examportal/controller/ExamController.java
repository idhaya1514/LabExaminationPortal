package com.examportal.controller;

import com.examportal.model.ExamResult;
import com.examportal.repository.ExamResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Allows React frontend to communicate with Spring Boot
public class ExamController {

    @Autowired
    private ExamResultRepository examResultRepository;

    @GetMapping("/exam-results")
    public ResponseEntity<List<ExamResult>> getAllExamResults() {
        List<ExamResult> results = examResultRepository.findAllByOrderBySubmittedAtDesc();
        return ResponseEntity.ok(results);
    }

    @PostMapping("/exam-results")
    @SuppressWarnings("null")
    public ResponseEntity<Map<String, Object>> submitExamResult(@RequestBody ExamResult examResult) {
        try {
            ExamResult savedResult = examResultRepository.save(examResult);
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedResult.getId());
            response.put("success", true);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
