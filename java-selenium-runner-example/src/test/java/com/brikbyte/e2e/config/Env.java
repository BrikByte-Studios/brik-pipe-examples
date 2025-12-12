package com.brikbyte.e2e.config;

/**
 * Env
 * ---
 * Centralized environment variable access for the Java Selenium runner.
 *
 * Conventions:
 * - SELENIUM_REMOTE_URL (default: http://localhost:4444/wd/hub)
 * - E2E_TARGET_URL      (default: http://localhost:3000)
 * - BROWSER             (default: chrome)
 */
public final class Env {

  private Env() {}

  public static String seleniumRemoteUrl() {
    return get("SELENIUM_REMOTE_URL", "http://localhost:4444/wd/hub");
  }

  public static String targetUrl() {
    return get("E2E_TARGET_URL", "http://localhost:3000");
  }

  public static String browser() {
    return get("BROWSER", "chrome").toLowerCase();
  }

  public static boolean headless() {
    return Boolean.parseBoolean(get("HEADLESS", "true"));
  }

  private static String get(String key, String fallback) {
    String v = System.getenv(key);
    return (v == null || v.isBlank()) ? fallback : v;
  }
}
