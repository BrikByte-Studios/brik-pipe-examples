package com.brikbyte.e2e.tests;

import java.net.MalformedURLException;
import java.net.URL;
import java.time.Duration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.remote.RemoteWebDriver;

import com.brikbyte.e2e.config.Env;
import com.brikbyte.e2e.util.Waits;

/**
 * LoginSmokeTest
 * --------------
 * Minimal smoke test proving:
 * - RemoteWebDriver can create a session via Selenium Grid
 * - The browser can navigate to the target UI URL
 *
 * This is intentionally tiny to validate infrastructure first.
 */
public class LoginSmokeTest {

  private WebDriver driver;

  @Test
  void smoke_homepage_loads() throws MalformedURLException {
    String remote = Env.seleniumRemoteUrl();
    String baseUrl = Env.targetUrl();
    String browser = Env.browser();
    boolean headless = Env.headless();

    System.out.println("[JAVA-SELENIUM] remote=" + remote);
    System.out.println("[JAVA-SELENIUM] baseUrl=" + baseUrl);
    System.out.println("[JAVA-SELENIUM] browser=" + browser + " headless=" + headless);

    driver = new RemoteWebDriver(new URL(remote), optionsFor(browser, headless));

    // Navigate
    driver.get(baseUrl);

    // Example: assert the document loads by checking title exists / non-empty.
    // Customize this once your demo UI has stable selectors.
    Waits.titleContains(driver, "", Duration.ofSeconds(10));
  }

  @AfterEach
  void cleanup() {
    if (driver != null) {
      driver.quit();
    }
  }

  /**
   * Build browser-specific options for Selenium Grid nodes.
   */
  private static org.openqa.selenium.Capabilities optionsFor(String browser, boolean headless) {
    switch (browser) {
      case "firefox":
        FirefoxOptions ff = new FirefoxOptions();
        if (headless) ff.addArguments("-headless");
        return ff;

      case "edge":
        EdgeOptions edge = new EdgeOptions();
        if (headless) edge.addArguments("--headless=new");
        edge.addArguments("--no-sandbox");
        edge.addArguments("--disable-dev-shm-usage");
        return edge;

      case "chrome":
      default:
        ChromeOptions ch = new ChromeOptions();
        if (headless) ch.addArguments("--headless=new");
        ch.addArguments("--no-sandbox");
        ch.addArguments("--disable-dev-shm-usage");
        return ch;
    }
  }
}
