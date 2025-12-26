package com.reviewassistant.controller;

import com.reviewassistant.controller.dto.AuditFindingResponse;
import com.reviewassistant.controller.dto.AuditStatusResponse;
import com.reviewassistant.controller.dto.StartAuditResponse;
import com.reviewassistant.model.AuditFinding;
import com.reviewassistant.model.CodeAudit;
import com.reviewassistant.model.UserGithubToken;
import com.reviewassistant.repository.AuditFindingRepository;
import com.reviewassistant.repository.UserGithubTokenRepository;
import com.reviewassistant.service.CodeAuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audits")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AuditController {

    private static final Logger logger = LoggerFactory.getLogger(AuditController.class);

    private final CodeAuditService codeAuditService;
    private final AuditFindingRepository auditFindingRepository;
    private final UserGithubTokenRepository tokenRepository;

    public AuditController(CodeAuditService codeAuditService, 
                          AuditFindingRepository auditFindingRepository,
                          UserGithubTokenRepository tokenRepository) {
        this.codeAuditService = codeAuditService;
        this.auditFindingRepository = auditFindingRepository;
        this.tokenRepository = tokenRepository;
    }

    /**
     * Start a code audit for a repository.
     * Returns immediately with audit ID for polling.
     * Uses JWT authentication to fetch GitHub token from database.
     */
    @PostMapping("/start/{repositoryId}")
    public ResponseEntity<StartAuditResponse> startAudit(
            @PathVariable Long repositoryId,
            Authentication authentication) {
        
        try {
            // Extract GitHub ID from JWT (set by JwtAuthenticationFilter)
            Long githubId = (Long) authentication.getDetails();
            
            // Fetch GitHub token from database
            UserGithubToken userToken = tokenRepository.findByGithubId(githubId)
                .orElseThrow(() -> new RuntimeException("GitHub token not found for user"));
            
            String accessToken = userToken.getAccessToken();
            
            logger.info("Starting audit for repository ID: {} by user: {}", repositoryId, authentication.getName());
            Long auditId = codeAuditService.startAudit(repositoryId, accessToken);
            return ResponseEntity.accepted().body(StartAuditResponse.success(auditId));
        } catch (Exception e) {
            logger.error("Failed to start audit: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get the status of an ongoing or completed audit.
     * Used for polling progress.
     */
    @GetMapping("/{auditId}/status")
    public ResponseEntity<AuditStatusResponse> getAuditStatus(@PathVariable Long auditId) {
        try {
            CodeAudit audit = codeAuditService.getAuditStatus(auditId);
            return ResponseEntity.ok(AuditStatusResponse.fromEntity(audit));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Failed to get audit status: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get findings for a completed audit with pagination and filtering.
     */
    @GetMapping("/{auditId}/findings")
    public ResponseEntity<Page<AuditFindingResponse>> getAuditFindings(
            @PathVariable Long auditId,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("severity").descending().and(Sort.by("createdAt").descending()));
            
            Page<AuditFinding> findings;
            if (severity != null || category != null) {
                findings = auditFindingRepository.findByFilters(auditId, severity, category, pageable);
            } else {
                findings = auditFindingRepository.findByAuditId(auditId, pageable);
            }
            
            Page<AuditFindingResponse> response = findings.map(AuditFindingResponse::fromEntity);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to get audit findings: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get summary statistics for an audit.
     */
    @GetMapping("/{auditId}/summary")
    public ResponseEntity<AuditStatusResponse> getAuditSummary(@PathVariable Long auditId) {
        return getAuditStatus(auditId);
    }

    /**
     * Get the latest audit for a repository.
     */
    @GetMapping("/latest/{repositoryId}")
    public ResponseEntity<AuditStatusResponse> getLatestAudit(@PathVariable Long repositoryId) {
        try {
            CodeAudit audit = codeAuditService.getLatestAuditForRepository(repositoryId);
            if (audit == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(AuditStatusResponse.fromEntity(audit));
        } catch (Exception e) {
            logger.error("Failed to get latest audit: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }
}
