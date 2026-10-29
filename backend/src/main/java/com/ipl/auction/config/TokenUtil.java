package com.ipl.auction.config;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.ipl.auction.model.User;

@Component
public class TokenUtil {

    private final String secret;
    private final long expiryMs;

    public TokenUtil(
            @Value("${jwt.secret:ipl_super_secure_jwt_secret_key_minimum_256_bits_2026_xyz}") String secret,
            @Value("${jwt.expiration-ms:86400000}") long expiryMs) {
        this.secret = secret;
        this.expiryMs = expiryMs;
    }

    public static class UserTokenState {
        private final String username;
        private final String role;
        private final Long teamId;

        public UserTokenState(String username, String role, Long teamId) {
            this.username = username;
            this.role = role;
            this.teamId = teamId;
        }

        public String getUsername() { return username; }
        public String getRole() { return role; }
        public Long getTeamId() { return teamId; }
    }

    public String generateToken(User user) {
        try {
            long expiry = System.currentTimeMillis() + expiryMs;
            Long teamId = user.getTeam() != null ? user.getTeam().getId() : null;

            String role = user.getRole();
            if (role != null && role.startsWith("ROLE_")) {
                role = role.substring(5);
            }

            // Safe individual Base64Url encoding of each claim to prevent delimiter injection
            String b64User = base64UrlEncode(user.getUsername().getBytes(StandardCharsets.UTF_8));
            String b64Role = base64UrlEncode(role.getBytes(StandardCharsets.UTF_8));
            String b64TeamId = base64UrlEncode((teamId != null ? teamId.toString() : "null").getBytes(StandardCharsets.UTF_8));
            String b64Exp = base64UrlEncode(String.valueOf(expiry).getBytes(StandardCharsets.UTF_8));

            String payload = b64User + "_" + b64Role + "_" + b64TeamId + "_" + b64Exp;
            String signature = signHmacSha256(payload);

            return payload + "." + signature;
        } catch (Exception e) {
            throw new RuntimeException("Error generating token", e);
        }
    }

    public UserTokenState validateToken(String tokenStr) {
        try {
            if (tokenStr == null || !tokenStr.contains(".")) {
                return null;
            }
            int dotIdx = tokenStr.lastIndexOf('.');
            if (dotIdx <= 0 || dotIdx >= tokenStr.length() - 1) {
                return null;
            }

            String payload = tokenStr.substring(0, dotIdx);
            String receivedSignature = tokenStr.substring(dotIdx + 1);

            // Verify HMAC signature
            String expectedSignature = signHmacSha256(payload);
            if (!expectedSignature.equals(receivedSignature)) {
                return null;
            }

            String[] claims = payload.split("_");
            if (claims.length != 4) {
                return null;
            }

            String username = new String(Base64.getUrlDecoder().decode(claims[0]), StandardCharsets.UTF_8);
            String role = new String(Base64.getUrlDecoder().decode(claims[1]), StandardCharsets.UTF_8);
            String teamIdStr = new String(Base64.getUrlDecoder().decode(claims[2]), StandardCharsets.UTF_8);
            long expiry = Long.parseLong(new String(Base64.getUrlDecoder().decode(claims[3]), StandardCharsets.UTF_8));

            if (System.currentTimeMillis() > expiry) {
                return null;
            }

            Long teamId = "null".equals(teamIdStr) ? null : Long.parseLong(teamIdStr);
            return new UserTokenState(username, role, teamId);
        } catch (Exception e) {
            return null;
        }
    }

    private String signHmacSha256(String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(keySpec);
        byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return base64UrlEncode(rawHmac);
    }

    private String base64UrlEncode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
