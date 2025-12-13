# java-selenium-runner-example

Minimal Java + Selenium RemoteWebDriver E2E example used by BrikPipe.

## Purpose
- Validate Selenium Grid wiring
- Exercise node-ui-example login → dashboard → logout flow
- Run in CI and locally using the same contracts

## Required Env Vars
- SELENIUM_REMOTE_URL=http://localhost:4444/wd/hub
- E2E_TARGET_URL=http://localhost:3000
- BROWSER=chrome|firefox|edge

## Local Run (summary)
1) Start app + grid
2) Export env vars
3) Run: mvn test
