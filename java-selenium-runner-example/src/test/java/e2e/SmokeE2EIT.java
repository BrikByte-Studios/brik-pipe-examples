package e2e;

import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
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

public class SmokeE2EIT {

    private WebDriver driver;

    private static final String TEST_EMAIL = "test.user@brikbyteos.local";
    private static final String TEST_PASSWORD = "password123!";

    // Where Selenium screenshots should land (exporter will read this)
    private static final Path SELENIUM_SCREENSHOTS_DIR =
        Paths.get("target", "selenium-artifacts", "screenshots");

    // Capture screenshots only when a test fails
    @RegisterExtension
    TestWatcher screenshotOnFailure = new TestWatcher() {
        @Override
        public void testFailed(ExtensionContext context, Throwable cause) {
            try {
                if (driver == null) return;
                if (!(driver instanceof TakesScreenshot)) return;

                Files.createDirectories(SELENIUM_SCREENSHOTS_DIR);

                String browser = envOrDefault("BROWSER", "chrome");
                String testName = context.getDisplayName().replaceAll("[^a-zA-Z0-9-_\\.]", "_");
                String ts = String.valueOf(Instant.now().toEpochMilli());

                Path out = SELENIUM_SCREENSHOTS_DIR.resolve(
                    browser + "_" + testName + "_" + ts + ".png"
                );

                byte[] png = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
                Files.write(out, png);

                System.out.println("[SELENIUM] Screenshot captured: " + out.toString());
            } catch (IOException e) {
                System.out.println("[SELENIUM] Screenshot capture failed: " + e.getMessage());
            } catch (WebDriverException e) {
                System.out.println("[SELENIUM] Screenshot capture skipped: " + e.getMessage());
            }
        }
    };

    @BeforeEach
    void setup() throws Exception {
        String remoteUrl = envOrThrow("SELENIUM_REMOTE_URL");
        String browser = envOrDefault("BROWSER", "chrome");

        MutableCapabilities options = CapabilitiesFactory.optionsFor(browser);
        driver = new RemoteWebDriver(new URL(remoteUrl), options);

        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(30));
        // Prefer explicit waits for E2E flows; implicit waits can mask timing issues
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(0));
    }

    @AfterEach
    void teardown() {
        if (driver != null) driver.quit();
    }

    @Test
    void smoke_login_dashboard_logout_flow() {
        String baseUrl = System.getenv().getOrDefault("E2E_TARGET_URL", "http://host.docker.internal:3000");

        driver.get(baseUrl + "/login");

        WebElement email = byTestId("login-email");
        WebElement password = byTestId("login-password");
        WebElement submit = byTestId("login-submit");

        email.clear();
        email.sendKeys(TEST_EMAIL);

        password.clear();
        password.sendKeys(TEST_PASSWORD);

        submit.click();

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        WebElement welcome = wait.until(ExpectedConditions.visibilityOfElementLocated(
            By.cssSelector("[data-testid='dashboard-welcome1']")
        ));

        Assertions.assertTrue(welcome.getText().toLowerCase().contains("welcome"));

        WebElement toggle = byTestId("user-menu-toggle");
        Assertions.assertNotNull(toggle);

        WebElement logout = byTestId("user-menu-logout");
        logout.click();

        WebElement loginForm = wait.until(ExpectedConditions.visibilityOfElementLocated(
            By.cssSelector("[data-testid='login-form']")
        ));
        Assertions.assertNotNull(loginForm);
    }

    private WebElement byTestId(String id) {
        return driver.findElement(By.cssSelector("[data-testid='" + id + "']"));
    }

    private static String envOrThrow(String key) {
        String v = System.getenv(key);
        if (v == null || v.isBlank()) throw new IllegalStateException("Missing required env var: " + key);
        return v;
    }

    private static String envOrDefault(String key, String def) {
        String v = System.getenv(key);
        return (v == null || v.isBlank()) ? def : v;
    }

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
