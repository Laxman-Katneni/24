package com.reviewassistant.controller;

import com.reviewassistant.model.UserGithubToken;
import com.reviewassistant.repository.UserGithubTokenRepository;
import com.reviewassistant.util.JwtUtil;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AuthController {
    
    private final UserGithubTokenRepository tokenRepository;
    private final JwtUtil jwtUtil;
    private final OAuth2AuthorizedClientService authorizedClientService;
    
    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;
    
    public AuthController(
            UserGithubTokenRepository tokenRepository, 
            JwtUtil jwtUtil,
            OAuth2AuthorizedClientService authorizedClientService) {
        this.tokenRepository = tokenRepository;
        this.jwtUtil = jwtUtil;
        this.authorizedClientService = authorizedClientService;
    }
    
    @GetMapping("/auth/callback")
    public void authCallback(
            OAuth2AuthenticationToken authentication,
            HttpServletResponse response) throws Exception {
        
        try {
            System.out.println("=== OAuth Callback Started ===");
            
            // Get OAuth2User from authentication
            OAuth2User oauth2User = authentication.getPrincipal();
            System.out.println("OAuth2User: " + oauth2User.getName());
            
            // Get the authorized client to extract access token
            System.out.println("Loading authorized client...");
            OAuth2AuthorizedClient authorizedClient = authorizedClientService
                    .loadAuthorizedClient(
                            authentication.getAuthorizedClientRegistrationId(),
                            authentication.getName()
                    );
            
            if (authorizedClient == null) {
                System.err.println("ERROR: No authorized client found!");
                System.err.println("Registration ID: " + authentication.getAuthorizedClientRegistrationId());
                System.err.println("Principal Name: " + authentication.getName());
                response.sendRedirect(frontendUrl + "/login?error=no_client");
                return;
            }
            
            System.out.println("Authorized client found!");
            
            // Extract user info from GitHub OAuth
            Long githubId = oauth2User.getAttribute("id");
            String username = oauth2User.getAttribute("login");
            String accessToken = authorizedClient.getAccessToken().getTokenValue();
            
            System.out.println("=== OAuth Success ===");
            System.out.println("GitHub ID: " + githubId);
            System.out.println("Username: " + username);
            System.out.println("Access Token: " + (accessToken != null ? "present" : "null"));
            
            // Store or update GitHub access token in database
            System.out.println("Saving to database...");
            UserGithubToken userToken = tokenRepository.findByGithubId(githubId)
                    .orElse(new UserGithubToken());
            
            userToken.setGithubId(githubId);
            userToken.setUsername(username);
            userToken.setAccessToken(accessToken);
            tokenRepository.save(userToken);
            System.out.println("Saved to database!");
            
            // Generate JWT for frontend
            System.out.println("Generating JWT...");
            String jwt = jwtUtil.generateToken(username, githubId);
            System.out.println("JWT generated: " + jwt.substring(0, Math.min(20, jwt.length())) + "...");
            
            // Redirect to frontend with JWT in URL fragment
            String redirectUrl = frontendUrl + "/auth/callback#token=" + jwt;
            System.out.println("Redirecting to: " + redirectUrl);
            response.sendRedirect(redirectUrl);
            System.out.println("=== OAuth Callback Completed ===");
            
        } catch (Exception e) {
            System.err.println("=== OAUTH CALLBACK ERROR ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            response.sendRedirect(frontendUrl + "/login?error=callback_failed");
        }
    }
}
