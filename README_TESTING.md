# Math-Bridge-FE Automated Testing

This repository includes comprehensive Playwright end-to-end tests for the Math-Bridge-FE parent portal.

## Quick Start

### Installation
```bash
npm install
```

### Run Tests
```bash
# Run all tests (headless)
npm test

# Run tests with browser visible
npm run test:headed

# Run tests in interactive UI mode
npm run test:ui

# View test report
npm run test:report
```

## Test Coverage

The test suite includes **19 automated test cases** covering:

### 1. Login/Logout (5 tests)
- ✅ Login with valid credentials
- ✅ Login with invalid password
- ✅ Login with invalid email format
- ✅ Login with empty fields
- ✅ Standard logout

### 2. Navigation (5 tests)
- ✅ Access Dashboard tab
- ✅ Access Children tab
- ✅ Access Contracts tab
- ✅ Access Sessions tab
- ✅ Access Wallet/Payment tab

### 3. Child Management (2 tests)
- ✅ Create child with all required fields
- ✅ Create child with missing required fields

### 4. Contract Management (2 tests)
- ✅ View create contract form
- ✅ Create contract without selecting child

### 5. Wallet Operations (3 tests)
- ✅ View wallet balance
- ✅ Access top-up form
- ✅ Top up with invalid amount

### 6. Session Viewing (2 tests)
- ✅ View sessions list
- ✅ View session details

## Test Files

- **`playwright.config.ts`** - Playwright configuration
- **`tests/e2e.spec.ts`** - Main test suite (19 test cases)
- **`MANUAL_TEST_REPORT.md`** - Detailed manual test plan (53 test cases)
- **`TEST_EXECUTION_REPORT.md`** - Comprehensive test execution report

## Test Credentials

The tests use the following test account:
- **Email:** lncaomy@gmail.com
- **Password:** Phineas2005!

⚠️ **Note:** For production use, credentials should be stored in environment variables.

## Test Configuration

Tests are configured to run against: **https://web.vibe88.tech/**

To change the base URL, edit `playwright.config.ts`:
```typescript
use: {
  baseURL: 'https://your-url-here.com',
  // ... other options
}
```

## Test Features

### Robust Element Selection
Tests use multiple selector strategies to handle UI variations:
- Text content matching
- Input types
- Name attributes
- Placeholders
- CSS selectors

### Graceful Error Handling
- Tests skip gracefully if elements are not found
- Multiple fallback strategies
- Appropriate timeouts and wait strategies

### Helper Functions
- `login(page, email, password)` - Handles login flow
- `logout(page)` - Handles logout flow with fallback strategies

### Test Artifacts
On test execution, Playwright generates:
- Screenshots (on failure)
- Videos (on failure)
- Execution traces (on retry)
- HTML report
- JSON report

## Running Specific Tests

### Run a specific test file
```bash
npx playwright test tests/e2e.spec.ts
```

### Run a specific test by name
```bash
npx playwright test -g "LOGIN-PERFECT-001"
```

### Run tests matching a pattern
```bash
npx playwright test -g "Login"
```

## Debugging Tests

### Run in debug mode
```bash
npx playwright test --debug
```

### View test trace
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

### Generate and view report
```bash
npx playwright show-report
```

## Test Results

Test artifacts are stored in:
- `test-results/` - Individual test artifacts (screenshots, videos, traces)
- `playwright-report/` - HTML test report

## CI/CD Integration

To run tests in CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm install

- name: Install Playwright browsers
  run: npx playwright install chromium

- name: Run tests
  run: npm test

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Known Limitations

### Current Environment
Tests are currently blocked by network DNS resolution in the sandboxed environment:
- Error: `net::ERR_NAME_NOT_RESOLVED at https://web.vibe88.tech/`
- Solution: Run tests in environment with network access to the target URL

### Test Data
- Tests use production account (should use test environment)
- No automatic cleanup of created test data
- Credentials are hardcoded (should use environment variables)

## Best Practices Implemented

✅ **Modular Test Structure** - Tests organized by feature area  
✅ **Reusable Functions** - Login/logout helpers  
✅ **Multiple Selector Strategies** - Robust element finding  
✅ **Appropriate Waits** - networkidle, waitForSelector  
✅ **Error Scenarios** - Both happy path and error cases  
✅ **Graceful Degradation** - Tests skip if features unavailable  

## Future Enhancements

Potential improvements for the test suite:

1. **Page Object Model** - Implement POM for better maintainability
2. **Test Data Management** - Externalize test data
3. **Environment Variables** - Store credentials securely
4. **Data Cleanup** - Automatic cleanup of test data
5. **Visual Regression** - Add screenshot comparison tests
6. **Performance Testing** - Add performance benchmarks
7. **Accessibility Testing** - Add a11y validation
8. **Cross-Browser Testing** - Add Firefox, Safari, Edge
9. **Mobile Testing** - Add mobile viewport tests
10. **API Testing** - Add API integration tests

## Documentation

- **MANUAL_TEST_REPORT.md** - 53 detailed manual test cases with perfect and error scenarios
- **TEST_EXECUTION_REPORT.md** - Comprehensive test execution report with change log
- **README_TESTING.md** - This file

## Support

For issues or questions about the test suite:
1. Check the test execution report: `TEST_EXECUTION_REPORT.md`
2. Review the manual test plan: `MANUAL_TEST_REPORT.md`
3. View Playwright documentation: https://playwright.dev/

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-13 | Initial test suite creation with 19 automated tests |

---

**Last Updated:** 2025-11-13  
**Test Framework:** Playwright v1.56.1  
**Node Version:** v20.18.1  
**Status:** Ready for execution (requires network access)
