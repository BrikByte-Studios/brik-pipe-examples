package e2e;

import java.net.URL;
import java.time.Duration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.MutableCapabilities;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.remote.RemoteWebDriver;

/**
 * SmokeE2EIT
 *
 * Purpose:
 *   Minimal cross-browser smoke test to validate:
 *     - Selenium Grid wiring (RemoteWebDriver)
 *     - Your demo UI server endpoints:
 *         /login -> /dashboard -> /logout
 *
 * This test targets the deterministic "node-ui-example" Express app you provided.
 *
 * BrikPipe Env Contracts:
 *   - SELENIUM_REMOTE_URL : Remote endpoint (e.g., http://localhost:4444/wd/hub)
 *   - E2E_TARGET_URL      : App base URL (e.g., http://localhost:3000)
 *   - BROWSER             : chrome | firefox | edge
 *
 * Data-testid contracts (must match node-ui-example server HTML):
 *   - login-form
 *   - login-email
 *   - login-password
 *   - login-submit
 *   - dashboard-welcome
 *   - user-menu-toggle
 *   - user-menu-logout
 */
public class SmokeE2EIT {

    private WebDriver driver;

    // Keep in sync with node-ui-example TEST_USER values.
    private static final String TEST_EMAIL = "test.user@brikbyteos.local";
    private static final String TEST_PASSWORD = "password123!";

    @BeforeEach
    void setup() throws Exception {
        String remoteUrl = envOrThrow("SELENIUM_REMOTE_URL");
        String browser = envOrDefault("BROWSER", "chrome");

        MutableCapabilities options = CapabilitiesFactory.optionsFor(browser);

        driver = new RemoteWebDriver(new URL(remoteUrl), options);

        // CI-friendly timeouts to avoid hung sessions.
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(30));
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(2));
    }

    @AfterEach
    void teardown() {
        if (driver != null) driver.quit();
    }

    @Test
    void smoke_login_dashboard_logout_flow() {
        String baseUrl = System.getenv().getOrDefault("E2E_TARGET_URL", "http://host.docker.internal:3000");

        // 1) Navigate to /login
        driver.get(baseUrl + "/login");

        // 2) Fill form using data-testid selectors
        WebElement email = byTestId("login-email");
        WebElement password = byTestId("login-password");
        WebElement submit = byTestId("login-submit");

        email.clear();
        email.sendKeys(TEST_EMAIL);

        password.clear();
        password.sendKeys(TEST_PASSWORD);

        submit.click();

        // 3) Assert dashboard reached (welcome header exists)
        WebElement welcome = byTestId("dashboard-welcome");
        Assertions.assertTrue(welcome.getText().toLowerCase().contains("welcome"));

        // 4) Optional: interact with user menu
        WebElement toggle = byTestId("user-menu-toggle");
        Assertions.assertNotNull(toggle);

        // 5) Logout (POST form submit button)
        WebElement logout = byTestId("user-menu-logout");
        logout.click();

        // 6) After logout, app redirects to /login
        // We re-check login form is present.
        WebElement loginForm = byTestId("login-form");
        Assertions.assertNotNull(loginForm);
    }

    /**
     * Helper to locate elements by data-testid attribute.
     * Keeps selectors consistent and readable.
     */
    private WebElement byTestId(String id) {
        return driver.findElement(By.cssSelector("[data-testid='" + id + "']"));
    }

    private static String envOrThrow(String key) {
        String v = System.getenv(key);
        if (v == null || v.isBlank()) {
            throw new IllegalStateException("Missing required env var: " + key);
        }
        return v;
    }

    private static String envOrDefault(String key, String def) {
        String v = System.getenv(key);
        return (v == null || v.isBlank()) ? def : v;
    }

    /**
     * CapabilitiesFactory
     *
     * Centralizes browser option selection.
     * Headless is enabled for CI stability.
     */
    static class CapabilitiesFactory {
        static MutableCapabilities optionsFor(String browser) {
            switch ((browser == null ? "" : browser).toLowerCase()) {
                case "firefox": {
                    FirefoxOptions ff = new FirefoxOptions();
                    ff.addArguments("-headless");
                    return ff;
                }
                case "edge": {
                    EdgeOptions edge = new EdgeOptions();
                    edge.addArguments("--headless=new");
                    return edge;
                }
                case "chrome":
                default: {
                    ChromeOptions ch = new ChromeOptions();
                    ch.addArguments("--headless=new");
                    return ch;
                }
            }
        }
    }
}
