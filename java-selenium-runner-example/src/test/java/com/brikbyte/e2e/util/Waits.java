package com.brikbyte.e2e.util;

import java.time.Duration;
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * Wait helpers for deterministic tests.
 * Keep timeouts small in smoke tests.
 */
public final class Waits {
  private Waits() {}

  public static WebElement visible(WebDriver driver, By by, Duration timeout) {
    return new WebDriverWait(driver, timeout).until(ExpectedConditions.visibilityOfElementLocated(by));
  }

  public static void urlContains(WebDriver driver, String fragment, Duration timeout) {
    new WebDriverWait(driver, timeout).until(ExpectedConditions.urlContains(fragment));
  }
}
