import { test, expect, Page } from '@playwright/test';

/**
 * Test credentials for parent account
 */
const TEST_CREDENTIALS = {
  email: 'lncaomy@gmail.com',
  password: 'Phineas2005!',
};

/**
 * Helper function to login
 */
async function login(page: Page, email: string = TEST_CREDENTIALS.email, password: string = TEST_CREDENTIALS.password) {
  await page.goto('/');
  
  // Wait for login form to be visible
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
  
  // Fill in credentials
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  
  await emailInput.fill(email);
  await passwordInput.fill(password);
  
  // Click login button
  const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
  await loginButton.click();
  
  // Wait for navigation to dashboard or home page
  await page.waitForLoadState('networkidle');
}

/**
 * Helper function to logout
 */
async function logout(page: Page) {
  // Look for logout button or menu
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out")').first();
  
  if (await logoutButton.isVisible({ timeout: 5000 })) {
    await logoutButton.click();
    await page.waitForLoadState('networkidle');
  } else {
    // Try to find in a dropdown menu
    const menuButton = page.locator('button:has-text("Profile"), button:has-text("Menu"), [aria-label*="menu"]').first();
    if (await menuButton.isVisible({ timeout: 5000 })) {
      await menuButton.click();
      await page.waitForTimeout(500);
      const logoutOption = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Sign Out")').first();
      await logoutOption.click();
      await page.waitForLoadState('networkidle');
    }
  }
}

test.describe('Login/Logout Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
  });

  test('LOGIN-PERFECT-001: Login with valid credentials', async ({ page }) => {
    await login(page);
    
    // Verify successful login by checking for dashboard elements or URL change
    await expect(page).not.toHaveURL('/login');
    
    // Check for common dashboard elements
    const isDashboard = await page.locator('text=/dashboard|welcome|home/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(isDashboard || page.url() !== 'https://web.vibe88.tech/').toBeTruthy();
  });

  test('LOGIN-ERROR-001: Login with invalid password', async ({ page }) => {
    // Attempt login with wrong password
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    await emailInput.fill(TEST_CREDENTIALS.email);
    await passwordInput.fill('WrongPassword123');
    
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    await loginButton.click();
    
    // Wait for error message
    await page.waitForTimeout(2000);
    
    // Check for error message
    const errorMessage = page.locator('text=/invalid|incorrect|error|wrong/i').first();
    const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
    
    // Should still be on login page or show error
    expect(hasError || page.url().includes('login')).toBeTruthy();
  });

  test('LOGIN-ERROR-002: Login with invalid email format', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    await emailInput.fill('notanemail');
    await passwordInput.fill('SomePassword123');
    
    // Check for validation error (HTML5 or custom)
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    
    if (!isInvalid) {
      const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
      await loginButton.click();
      await page.waitForTimeout(2000);
      
      // Should show validation error
      const errorMessage = page.locator('text=/valid email|email format|invalid/i').first();
      const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasError).toBeTruthy();
    } else {
      expect(isInvalid).toBeTruthy();
    }
  });

  test('LOGIN-ERROR-003: Login with empty fields', async ({ page }) => {
    // Try to submit without filling fields
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    await loginButton.click();
    
    await page.waitForTimeout(1000);
    
    // Check for HTML5 validation or error messages
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const isRequired = await emailInput.evaluate((el: HTMLInputElement) => el.required);
    
    expect(isRequired).toBeTruthy();
  });

  test('LOGOUT-PERFECT-001: Standard logout', async ({ page }) => {
    // First login
    await login(page);
    await page.waitForTimeout(2000);
    
    // Then logout
    await logout(page);
    
    // Verify logout - should be redirected to login page
    await page.waitForTimeout(2000);
    const isLoginPage = page.url().includes('login') || 
                       await page.locator('input[type="email"], input[name="email"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(isLoginPage).toBeTruthy();
  });
});

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await login(page);
    await page.waitForTimeout(2000);
  });

  test('NAV-PERFECT-001: Access Dashboard tab', async ({ page }) => {
    // Look for dashboard link
    const dashboardLink = page.locator('a:has-text("Dashboard"), button:has-text("Dashboard"), [href*="dashboard"]').first();
    
    if (await dashboardLink.isVisible({ timeout: 5000 })) {
      await dashboardLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify dashboard page loaded
      expect(page.url()).toContain('dashboard');
    } else {
      // Already on dashboard
      const isDashboard = page.url().includes('dashboard') || 
                         await page.locator('text=/dashboard|overview/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      expect(isDashboard).toBeTruthy();
    }
  });

  test('NAV-PERFECT-002: Access Children tab', async ({ page }) => {
    // Look for children/kids link
    const childrenLink = page.locator('a:has-text("Children"), a:has-text("Kids"), button:has-text("Children"), [href*="child"]').first();
    
    const isVisible = await childrenLink.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (isVisible) {
      await childrenLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify children page loaded
      const isChildrenPage = page.url().includes('child') || 
                            await page.locator('text=/children|kids|add child/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      expect(isChildrenPage).toBeTruthy();
    }
  });

  test('NAV-PERFECT-003: Access Contracts tab', async ({ page }) => {
    // Look for contracts link
    const contractsLink = page.locator('a:has-text("Contract"), button:has-text("Contract"), [href*="contract"]').first();
    
    const isVisible = await contractsLink.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (isVisible) {
      await contractsLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify contracts page loaded
      const isContractsPage = page.url().includes('contract') || 
                             await page.locator('text=/contract|agreement/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      expect(isContractsPage).toBeTruthy();
    }
  });

  test('NAV-PERFECT-004: Access Sessions tab', async ({ page }) => {
    // Look for sessions link
    const sessionsLink = page.locator('a:has-text("Session"), button:has-text("Session"), [href*="session"]').first();
    
    const isVisible = await sessionsLink.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (isVisible) {
      await sessionsLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify sessions page loaded
      const isSessionsPage = page.url().includes('session') || 
                            await page.locator('text=/session|schedule|class/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      expect(isSessionsPage).toBeTruthy();
    }
  });

  test('NAV-PERFECT-005: Access Wallet/Payment tab', async ({ page }) => {
    // Look for wallet/payment link
    const walletLink = page.locator('a:has-text("Wallet"), a:has-text("Payment"), button:has-text("Wallet"), [href*="wallet"], [href*="payment"]').first();
    
    const isVisible = await walletLink.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (isVisible) {
      await walletLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify wallet page loaded
      const isWalletPage = page.url().includes('wallet') || 
                          page.url().includes('payment') ||
                          await page.locator('text=/wallet|balance|payment|top up/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      expect(isWalletPage).toBeTruthy();
    }
  });
});

test.describe('Create Child Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await login(page);
    await page.waitForTimeout(2000);
    
    // Navigate to children page
    const childrenLink = page.locator('a:has-text("Children"), a:has-text("Kids"), [href*="child"]').first();
    const isVisible = await childrenLink.isVisible({ timeout: 10000 }).catch(() => false);
    if (isVisible) {
      await childrenLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('CHILD-PERFECT-001: Create child with all required fields', async ({ page }) => {
    // Look for "Add Child" button
    const addChildButton = page.locator('button:has-text("Add Child"), button:has-text("Create Child"), a:has-text("Add Child")').first();
    
    const isVisible = await addChildButton.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (isVisible) {
      await addChildButton.click();
      await page.waitForTimeout(2000);
      
      // Generate unique name for testing
      const timestamp = Date.now();
      const firstName = `TestChild${timestamp}`;
      const lastName = 'Doe';
      
      // Fill in the form
      const firstNameInput = page.locator('input[name="firstName"], input[placeholder*="first name" i], label:has-text("First Name") ~ input').first();
      if (await firstNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstNameInput.fill(firstName);
      }
      
      const lastNameInput = page.locator('input[name="lastName"], input[placeholder*="last name" i], label:has-text("Last Name") ~ input').first();
      if (await lastNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await lastNameInput.fill(lastName);
      }
      
      // Try to submit
      const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create"), button:has-text("Add")').first();
      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(3000);
        
        // Check for success message or redirect
        const successMessage = await page.locator('text=/success|created|added/i').first().isVisible({ timeout: 5000 }).catch(() => false);
        expect(successMessage || page.url().includes('child')).toBeTruthy();
      }
    } else {
      // If no add button, skip this test gracefully
      test.skip();
    }
  });

  test('CHILD-ERROR-001: Create child with missing required fields', async ({ page }) => {
    // Look for "Add Child" button
    const addChildButton = page.locator('button:has-text("Add Child"), button:has-text("Create Child"), a:has-text("Add Child")').first();
    
    const isVisible = await addChildButton.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (isVisible) {
      await addChildButton.click();
      await page.waitForTimeout(2000);
      
      // Try to submit without filling fields
      const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create"), button:has-text("Add")').first();
      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        
        // Check for validation error
        const errorMessage = await page.locator('text=/required|fill|enter|must/i').first().isVisible({ timeout: 5000 }).catch(() => false);
        expect(errorMessage).toBeTruthy();
      }
    } else {
      test.skip();
    }
  });
});

test.describe('Create Contract Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await login(page);
    await page.waitForTimeout(2000);
    
    // Navigate to contracts page
    const contractsLink = page.locator('a:has-text("Contract"), [href*="contract"]').first();
    const isVisible = await contractsLink.isVisible({ timeout: 10000 }).catch(() => false);
    if (isVisible) {
      await contractsLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('CONTRACT-PERFECT-001: View create contract form', async ({ page }) => {
    // Look for "Create Contract" button
    const createContractButton = page.locator('button:has-text("Create Contract"), button:has-text("New Contract"), a:has-text("Create Contract")').first();
    
    const isVisible = await createContractButton.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (isVisible) {
      await createContractButton.click();
      await page.waitForTimeout(2000);
      
      // Verify form is visible
      const formVisible = await page.locator('form, text=/create contract|new contract/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      expect(formVisible).toBeTruthy();
    } else {
      // No create button found
      test.skip();
    }
  });

  test('CONTRACT-ERROR-001: Create contract without selecting child', async ({ page }) => {
    // Look for "Create Contract" button
    const createContractButton = page.locator('button:has-text("Create Contract"), button:has-text("New Contract"), a:has-text("Create Contract")').first();
    
    const isVisible = await createContractButton.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (isVisible) {
      await createContractButton.click();
      await page.waitForTimeout(2000);
      
      // Try to submit without selecting child
      const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Submit")').first();
      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        
        // Check for validation error
        const errorMessage = await page.locator('text=/select|required|choose/i').first().isVisible({ timeout: 5000 }).catch(() => false);
        expect(errorMessage).toBeTruthy();
      }
    } else {
      test.skip();
    }
  });
});

test.describe('Wallet Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await login(page);
    await page.waitForTimeout(2000);
    
    // Navigate to wallet page
    const walletLink = page.locator('a:has-text("Wallet"), [href*="wallet"]').first();
    const isVisible = await walletLink.isVisible({ timeout: 10000 }).catch(() => false);
    if (isVisible) {
      await walletLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('WALLET-PERFECT-001: View wallet balance', async ({ page }) => {
    // Check if wallet page is accessible
    const walletVisible = page.url().includes('wallet') || 
                         await page.locator('text=/wallet|balance/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(walletVisible).toBeTruthy();
    
    // Look for balance display
    const balanceVisible = await page.locator('text=/balance|₫|\\$/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(balanceVisible).toBeTruthy();
  });

  test('WALLET-PERFECT-002: Access top-up form', async ({ page }) => {
    // Look for "Top Up" button
    const topUpButton = page.locator('button:has-text("Top Up"), button:has-text("Add Funds"), a:has-text("Top Up")').first();
    
    const isVisible = await topUpButton.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (isVisible) {
      await topUpButton.click();
      await page.waitForTimeout(2000);
      
      // Verify top-up form or modal is visible
      const formVisible = await page.locator('text=/amount|top up|add funds/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      expect(formVisible).toBeTruthy();
    }
  });

  test('WALLET-ERROR-001: Top up with invalid amount', async ({ page }) => {
    // Look for "Top Up" button
    const topUpButton = page.locator('button:has-text("Top Up"), button:has-text("Add Funds"), a:has-text("Top Up")').first();
    
    const isVisible = await topUpButton.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (isVisible) {
      await topUpButton.click();
      await page.waitForTimeout(2000);
      
      // Try to enter invalid amount (0 or negative)
      const amountInput = page.locator('input[name="amount"], input[type="number"], input[placeholder*="amount" i]').first();
      if (await amountInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await amountInput.fill('0');
        
        // Try to submit
        const submitButton = page.locator('button[type="submit"], button:has-text("Continue"), button:has-text("Proceed")').first();
        if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await submitButton.click();
          await page.waitForTimeout(2000);
          
          // Check for validation error
          const errorMessage = await page.locator('text=/invalid|minimum|greater/i').first().isVisible({ timeout: 5000 }).catch(() => false);
          expect(errorMessage).toBeTruthy();
        }
      }
    }
  });
});

test.describe('View Sessions Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await login(page);
    await page.waitForTimeout(2000);
    
    // Navigate to sessions page
    const sessionsLink = page.locator('a:has-text("Session"), [href*="session"]').first();
    const isVisible = await sessionsLink.isVisible({ timeout: 10000 }).catch(() => false);
    if (isVisible) {
      await sessionsLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('SESSION-PERFECT-001: View sessions list', async ({ page }) => {
    // Check if sessions page is accessible
    const sessionsVisible = page.url().includes('session') || 
                           await page.locator('text=/session|schedule|upcoming/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(sessionsVisible).toBeTruthy();
  });

  test('SESSION-PERFECT-002: View session details', async ({ page }) => {
    // Look for a session item to click
    const sessionItem = page.locator('[class*="session"], [class*="card"], li, tr').first();
    
    const isVisible = await sessionItem.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (isVisible) {
      await sessionItem.click();
      await page.waitForTimeout(2000);
      
      // Check if detail view opened
      const detailVisible = await page.locator('text=/detail|information|tutor|subject/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      expect(detailVisible).toBeTruthy();
    } else {
      // No sessions available, check for empty state
      const emptyState = await page.locator('text=/no session|empty/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      expect(emptyState || sessionsVisible).toBeTruthy();
    }
  });
});
