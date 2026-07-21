package com.examportal.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.ZonedDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "exam_results")
public class ExamResult {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_register_number")
    private String studentRegisterNumber;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "student_department")
    private String studentDepartment;

    @Column(name = "student_leetcode_username")
    private String studentLeetcodeUsername;

    @Column(name = "question_id")
    private String questionId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Object question;

    @Column(name = "programming_marks")
    private BigDecimal programmingMarks;

    @Column(name = "mcq_marks")
    private BigDecimal mcqMarks;

    @Column(name = "observation_marks")
    private BigDecimal observationMarks;

    @Column(name = "total_marks", insertable = false, updatable = false)
    private BigDecimal totalMarks;

    @Column(name = "max_marks")
    private BigDecimal maxMarks;

    @Column(columnDefinition = "text")
    private String code;

    @Column(name = "code_output", columnDefinition = "text")
    private String codeOutput;

    @Column(name = "output_matches")
    private Boolean outputMatches;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "mcq_answers", columnDefinition = "jsonb")
    private Object mcqAnswers;

    @Column(name = "time_spent")
    private Integer timeSpent;

    private Boolean malpractice;

    @Column(name = "malpractice_reason", columnDefinition = "text")
    private String malpracticeReason;

    @Column(name = "submitted_at")
    private ZonedDateTime submittedAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStudentRegisterNumber() { return studentRegisterNumber; }
    public void setStudentRegisterNumber(String studentRegisterNumber) { this.studentRegisterNumber = studentRegisterNumber; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getStudentDepartment() { return studentDepartment; }
    public void setStudentDepartment(String studentDepartment) { this.studentDepartment = studentDepartment; }

    public String getStudentLeetcodeUsername() { return studentLeetcodeUsername; }
    public void setStudentLeetcodeUsername(String studentLeetcodeUsername) { this.studentLeetcodeUsername = studentLeetcodeUsername; }

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }

    public Object getQuestion() { return question; }
    public void setQuestion(Object question) { this.question = question; }

    public BigDecimal getProgrammingMarks() { return programmingMarks; }
    public void setProgrammingMarks(BigDecimal programmingMarks) { this.programmingMarks = programmingMarks; }

    public BigDecimal getMcqMarks() { return mcqMarks; }
    public void setMcqMarks(BigDecimal mcqMarks) { this.mcqMarks = mcqMarks; }

    public BigDecimal getObservationMarks() { return observationMarks; }
    public void setObservationMarks(BigDecimal observationMarks) { this.observationMarks = observationMarks; }

    public BigDecimal getTotalMarks() { return totalMarks; }
    public void setTotalMarks(BigDecimal totalMarks) { this.totalMarks = totalMarks; }

    public BigDecimal getMaxMarks() { return maxMarks; }
    public void setMaxMarks(BigDecimal maxMarks) { this.maxMarks = maxMarks; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getCodeOutput() { return codeOutput; }
    public void setCodeOutput(String codeOutput) { this.codeOutput = codeOutput; }

    public Boolean getOutputMatches() { return outputMatches; }
    public void setOutputMatches(Boolean outputMatches) { this.outputMatches = outputMatches; }

    public Object getMcqAnswers() { return mcqAnswers; }
    public void setMcqAnswers(Object mcqAnswers) { this.mcqAnswers = mcqAnswers; }

    public Integer getTimeSpent() { return timeSpent; }
    public void setTimeSpent(Integer timeSpent) { this.timeSpent = timeSpent; }

    public Boolean getMalpractice() { return malpractice; }
    public void setMalpractice(Boolean malpractice) { this.malpractice = malpractice; }

    public String getMalpracticeReason() { return malpracticeReason; }
    public void setMalpracticeReason(String malpracticeReason) { this.malpracticeReason = malpracticeReason; }

    public ZonedDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(ZonedDateTime submittedAt) { this.submittedAt = submittedAt; }
}
