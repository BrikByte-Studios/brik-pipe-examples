package com.brikbyte.e2e.tests;

import com.brikbyte.e2e.config.Env;
import com.brikbyte.e2e.util.Waits;
import java.net.URL;
import java.time.Duration;
import java.util.Map;
import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.remote.RemoteWebDriver;

/**
 * Smoke test for node-ui-example:
 * - Visit /login
 * - Submit valid creds
 * - Assert /dashboard visible
 * - Logout
 *
 * The app uses data-testid attributes, so selectors are stable.
 */
public class LoginSmokeTest {

  private RemoteWebDriver driver;

  @BeforeEach
  void setUp() throws Exception {
    String browser = Env.browser();
    boolean headless = Env.headless();

    MutableCapabilities caps = switch (browser) {
      case "firefox" -> firefox(headless);
      case "edge" -> edge(headless);
      default -> chrome(headless);
    };

    URL remote = Env.remoteUrl().toURL();
    driver = new RemoteWebDriver(remote, caps);

    // Optional, but helps avoid hanging sessions in CI
    driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(30));
    driver.manage().timeouts().scriptTimeout(Duration.ofSeconds(20));

    // Small window can cause some UIs to shift; keep it stable
    driver.manage().window().setSize(new Dimension(1280, 720));

    System.out.println("[JAVA-SELENIUM] remote=" + remote);
    System.out.println("[JAVA-SELENIUM] baseUrl=" + Env.baseUrl());
    System.out.println("[JAVA-SELENIUM] browser=" + browser + " headless=" + headless);
  }

  @AfterEach
  void tearDown() {
    if (driver != null) {
      driver.quit();
    }
  }

  @Test
  void loginDashboardLogout_smoke() {
    String base = Env.baseUrl();

    driver.get(base + "/login");

    // Login form present
    Waits.visible(driver, By.cssSelector("[data-testid='login-form']"), Duration.ofSeconds(5));

    WebElement email = driver.findElement(By.cssSelector("[data-testid='login-email']"));
    WebElement password = driver.findElement(By.cssSelector("[data-testid='login-password']"));
    WebElement submit = driver.findElement(By.cssSelector("[data-testid='login-submit']"));

    // These must match your Express server's TEST_USER
    email.sendKeys("test.user@brikbyteos.local");
    password.sendKeys("password123!");
    submit.click();

    Waits.urlContains(driver, "/dashboard", Duration.ofSeconds(5));

    WebElement welcome = Waits.visible(driver, By.cssSelector("[data-testid='dashboard-welcome']"), Duration.ofSeconds(5));
    Assertions.assertTrue(welcome.getText().contains("BrikByteOS"), "Expected dashboard welcome to mention BrikByteOS");

    WebElement logout = driver.findElement(By.cssSelector("[data-testid='user-menu-logout']"));
    logout.click();

    Waits.urlContains(driver, "/login", Duration.ofSeconds(5));
    Waits.visible(driver, By.cssSelector("[data-testid='login-form']"), Duration.ofSeconds(5));
  }

  private static ChromeOptions chrome(boolean headless) {
    ChromeOptions o = new ChromeOptions();
    if (headless) o.addArguments("--headless=new");
    o.addArguments("--no-sandbox");
    o.addArguments("--disable-dev-shm-usage");
    o.setCapability("se:name", "chrome-smoke");
    o.setCapability("se:timeZone", "Africa/Johannesburg");
    o.setExperimentalOption("prefs", Map.of(
      "credentials_enable_service", false,
      "profile.password_manager_enabled", false
    ));
    return o;
  }

  private static FirefoxOptions firefox(boolean headless) {
    FirefoxOptions o = new FirefoxOptions();
    if (headless) o.addArguments("-headless");
    o.setCapability("se:name", "firefox-smoke");
    o.setCapability("se:timeZone", "Africa/Johannesburg");
    return o;
  }

  private static EdgeOptions edge(boolean headless) {
    EdgeOptions o = new EdgeOptions();
    if (headless) o.addArguments("--headless=new");
    o.addArguments("--no-sandbox");
    o.addArguments("--disable-dev-shm-usage");
    o.setCapability("se:name", "edge-smoke");
    o.setCapability("se:timeZone", "Africa/Johannesburg");
    return o;
  }
}
