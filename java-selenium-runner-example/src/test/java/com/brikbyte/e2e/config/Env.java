package com.brikbyte.e2e.config;

import java.net.URI;

/**
 * Env provides a single place to read standardized environment variables.
 *
 * Conventions (BrikByteOS):
 * - SELENIUM_REMOTE_URL : RemoteWebDriver endpoint (e.g. http://localhost:4444/wd/hub OR http://selenium-hub:4444)
 * - E2E_TARGET_URL      : Base URL of app under test (e.g. http://app:3000 OR https://staging.example.com)
 * - BROWSER             : chrome | firefox | edge
 * - HEADLESS            : true | false
 */
public final class Env {
  private Env() {}

  public static String get(String key, String fallback) {
    String v = System.getenv(key);
    if (v == null || v.isBlank()) return fallback;
    return v.trim();
  }

  public static String browser() {
    return get("BROWSER", "chrome").toLowerCase();
  }

  public static boolean headless() {
    return Boolean.parseBoolean(get("HEADLESS", "true"));
  }

  public static URI remoteUrl() {
    // Selenium Grid 4: both /wd/hub and root / work depending on grid config.
    // Keep /wd/hub as the safest default.
    return URI.create(get("SELENIUM_REMOTE_URL", "http://localhost:4444/wd/hub"));
  }

  public static String baseUrl() {
    String raw = get("E2E_TARGET_URL", "http://localhost:3000");
    // normalize: no trailing slash (makes URL joins predictable)
    return raw.endsWith("/") ? raw.substring(0, raw.length() - 1) : raw;
  }
}
