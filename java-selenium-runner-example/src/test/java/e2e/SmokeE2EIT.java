package e2e;

import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.AfterEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.junit.jupiter.api.extension.TestWatcher;
import org.openqa.selenium.By;
import org.openqa.selenium.MutableCapabilities;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebDriverException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * SmokeE2EIT
 *
 * Purpose:
 *   Minimal cross-browser smoke test to validate:
 *     - Selenium Grid wiring (RemoteWebDriver)
 *     - Demo UI login -> dashboard -> logout flow
 *
 * BrikPipe Env Contracts:
 *   - SELENIUM_REMOTE_URL : Remote endpoint (e.g., http://localhost:4444/wd/hub)
 *   - E2E_TARGET_URL      : App base URL (e.g., http://host.docker.internal:3000)
 *   - BROWSER             : chrome | firefox | edge
 *
 * Artifact contract:
 *   - Writes screenshots to: target/selenium-artifacts/screenshots
 *   - Exporter should read SELENIUM_SCREENSHOTS_DIR (set in workflow) to match this path
 *
 * Data-testid contracts (must match your UI):
 *   - login-form
 *   - login-email
 *   - login-password
 *   - login-submit
 *   - dashboard-welcome            (NOTE: ensure this matches the UI; not "dashboard-welcome1")
 *   - user-menu-toggle
 *   - user-menu-logout
 */
public class SmokeE2EIT {

    private WebDriver driver;

    // Keep in sync with node-ui-example TEST_USER values.
    private static final String TEST_EMAIL = "test.user@brikbyteos.local";
    private static final String TEST_PASSWORD = "password123!";

    // Where Selenium screenshots should land (exporter will read this)
    private static final Path SELENIUM_SCREENSHOTS_DIR =
        Paths.get("target", "selenium-artifacts", "screenshots");

    // Centralized wait (avoid implicit waits)
    private static final Duration WAIT_TIMEOUT = Duration.ofSeconds(10);

    // -------------------------------------------------------------------------
    // One Extension owns BOTH:
    //  - “mark failure” (TestWatcher)
    //  - “capture + quit” (AfterEachCallback)
    //
    // This avoids: watcher firing after @AfterEach and driver already quit.
    // -------------------------------------------------------------------------
    @RegisterExtension
    SeleniumArtifactsAndTeardown artifacts =
        new SeleniumArtifactsAndTeardown(
            () -> driver,
            () -> driver = null,
            SELENIUM_SCREENSHOTS_DIR
        );

    @BeforeEach
    void setup() throws Exception {
        String remoteUrl = envOrThrow("SELENIUM_REMOTE_URL");
        String browser = envOrDefault("BROWSER", "chrome");

        MutableCapabilities options = CapabilitiesFactory.optionsFor(browser);
        driver = new RemoteWebDriver(new URL(remoteUrl), options);

        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(30));
        // Prefer explicit waits; implicit waits can mask timing issues.
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(0));
    }

    @Test
    void smoke_login_dashboard_logout_flow() {
        String baseUrl = System.getenv().getOrDefault("E2E_TARGET_URL", "http://host.docker.internal:3000");

        // 1) Navigate to /login
        driver.get(baseUrl + "/login");

        // 2) Fill form using data-testid selectors
        WebElement email = waitVisibleByTestId("login-email1");
        WebElement password = waitVisibleByTestId("login-password");
        WebElement submit = waitVisibleByTestId("login-submit");

        email.clear();
        email.sendKeys(TEST_EMAIL);

        password.clear();
        password.sendKeys(TEST_PASSWORD);

        submit.click();

        // 3) Assert dashboard reached (welcome header exists)
        // IMPORTANT: align this with your actual UI test id
        WebElement welcome = waitVisible(By.cssSelector("[data-testid='dashboard-welcome']"));
        Assertions.assertTrue(welcome.getText().toLowerCase().contains("welcome"));

        // 4) Optional: interact with user menu
        WebElement toggle = waitVisibleByTestId("user-menu-toggle");
        Assertions.assertNotNull(toggle);

        // 5) Logout
        WebElement logout = waitVisibleByTestId("user-menu-logout");
        logout.click();

        // 6) After logout, app redirects to /login
        WebElement loginForm = waitVisible(By.cssSelector("[data-testid='login-form']"));
        Assertions.assertNotNull(loginForm);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    private WebElement waitVisible(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, WAIT_TIMEOUT);
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    private WebElement waitVisibleByTestId(String id) {
        return waitVisible(By.cssSelector("[data-testid='" + id + "']"));
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

    // -------------------------------------------------------------------------
    // CapabilitiesFactory
    // -------------------------------------------------------------------------
    static class CapabilitiesFactory {
        static MutableCapabilities optionsFor(String browser) {
            String b = (browser == null) ? "" : browser.toLowerCase();
            switch (b) {
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

    // -------------------------------------------------------------------------
    // SeleniumArtifactsAndTeardown
    //
    // - Tracks whether a test failed (TestWatcher)
    // - Captures screenshot BEFORE quitting the driver (AfterEachCallback)
    // - Always quits driver (even on success) to avoid leaked sessions
    // -------------------------------------------------------------------------
    static class SeleniumArtifactsAndTeardown implements TestWatcher, AfterEachCallback {

        private final java.util.function.Supplier<WebDriver> driverSupplier;
        private final Runnable driverClear;
        private final Path screenshotsDir;

        private static final ExtensionContext.Namespace NS =
            ExtensionContext.Namespace.create("brikbyte", "selenium", "artifacts");

        SeleniumArtifactsAndTeardown(java.util.function.Supplier<WebDriver> driverSupplier,
                                     Runnable driverClear,
                                     Path screenshotsDir) {
            this.driverSupplier = driverSupplier;
            this.driverClear = driverClear;
            this.screenshotsDir = screenshotsDir;
        }

        @Override
        public void testFailed(ExtensionContext context, Throwable cause) {
            context.getStore(NS).put("failed", true);
        }

        @Override
        public void afterEach(ExtensionContext context) {
            boolean failed = Boolean.TRUE.equals(context.getStore(NS).get("failed", Boolean.class));
            WebDriver driver = driverSupplier.get();

            // 1) Capture first (only if failed)
            if (failed) {
                captureScreenshotBestEffort(driver, context);
            }

            // 2) Quit last (always)
            try {
                if (driver != null) driver.quit();
            } catch (Throwable ignored) {
                // never fail tests on teardown
            } finally {
                driverClear.run();
            }
        }

        private void captureScreenshotBestEffort(WebDriver driver, ExtensionContext context) {
            try {
                if (driver == null) return;
                if (!(driver instanceof TakesScreenshot)) return;

                Files.createDirectories(screenshotsDir);

                String browser = System.getenv().getOrDefault("BROWSER", "chrome");
                String testName = context.getDisplayName().replaceAll("[^a-zA-Z0-9-_\\.]", "_");
                String ts = String.valueOf(Instant.now().toEpochMilli());

                Path out = screenshotsDir.resolve(browser + "_" + testName + "_" + ts + ".png");

                byte[] png = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
                Files.write(out, png);

                System.out.println("[SELENIUM] Screenshot captured: " + out);
            } catch (IOException e) {
                System.out.println("[SELENIUM] Screenshot capture failed: " + e.getMessage());
            } catch (WebDriverException e) {
                System.out.println("[SELENIUM] Screenshot capture skipped: " + e.getMessage());
            } catch (Throwable t) {
                System.out.println("[SELENIUM] Screenshot capture unexpected error: " + t.getMessage());
            }
        }
    }
}
