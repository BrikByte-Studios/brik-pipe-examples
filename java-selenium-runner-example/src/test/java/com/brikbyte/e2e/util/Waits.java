package com.brikbyte.e2e.util;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * Waits
 * -----
 * Tiny explicit-wait helpers used by smoke tests.
 */
public final class Waits {

  private Waits() {}

  public static void visible(WebDriver driver, By locator, Duration timeout) {
    new WebDriverWait(driver, timeout).until(ExpectedConditions.visibilityOfElementLocated(locator));
  }

  public static void titleContains(WebDriver driver, String partialTitle, Duration timeout) {
    new WebDriverWait(driver, timeout).until(ExpectedConditions.titleContains(partialTitle));
  }
}
