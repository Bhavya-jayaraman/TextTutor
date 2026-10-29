package com.texttutor.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtService {

    private final SecretKey secretKey;
    private final long normalExpirationMs;
    private final long rememberMeExpirationMs;

    public JwtService(
            @Value("${jwt.secret:defaultSecretKeyForTextTutorMustBeAtLeast32BytesLong!}") String secret,
            @Value("${jwt.expiration-hours:24}") long expirationHours) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            keyBytes = padded;
        }
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        this.normalExpirationMs = expirationHours * 3600 * 1000;
        this.rememberMeExpirationMs = 30L * 24 * 3600 * 1000; // 30 days
    }

    public String generateToken(Long userId, String email, String name, boolean rememberMe) {
        long expiry = rememberMe ? rememberMeExpirationMs : normalExpirationMs;
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiry);

        return Jwts.builder()
                .subject(email)
                .claim("id", userId)
                .claim("email", email)
                .claim("name", name)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    public Long extractUserId(String token) {
        return extractClaims(token).get("id", Long.class);
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = extractClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
