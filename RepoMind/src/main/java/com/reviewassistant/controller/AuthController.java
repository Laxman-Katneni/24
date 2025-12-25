package com.reviewassistant.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AuthController {
    
    @GetMapping("/auth/success")
    public void authSuccess(HttpServletRequest request, HttpServletResponse response) throws Exception {
        // Debug session info
        HttpSession session = request.getSession(false);
        System.out.println("=== AUTH SUCCESS DEBUG ===");
        System.out.println("Session ID: " + (session != null ? session.getId() : "NO SESSION"));
        System.out.println("Session is new: " + (session != null ? session.isNew() : "N/A"));
        
        // Debug cookies
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                System.out.println("Cookie: " + cookie.getName() + " = " + cookie.getValue());
            }
        }
        
        // Session cookie is already set by Spring Security
        String frontendUrl = System.getenv().getOrDefault("FRONTEND_URL", "http://localhost:5173");
        response.sendRedirect(frontendUrl + "/app/select-repo");
    }
}
