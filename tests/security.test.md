# Security Testing Checklist

## Cross-User Access Tests

### Setup
1. Create two test accounts:
   - User A: testa@example.com / password123
   - User B: testb@example.com / password123
2. Log in as User A in main browser window
3. Log in as User B in incognito/private window

---

## Test 1: Portfolio Isolation

**Objective**: Verify User B cannot access User A's portfolios

### Steps
1. **User A**: Create portfolio "Test Portfolio A"
   - Note portfolio ID from URL: `/portfolios/{portfolioId}`
   - Example: `550e8400-e29b-41d4-a716-446655440000`

2. **User B**: Navigate directly to User A's portfolio
   - In incognito window, type URL: `http://localhost:5174/portfolios/550e8400-e29b-41d4-a716-446655440000`
   - Should see: "Carteira não encontrada" (Portfolio not found)
   - Or: Redirect to `/portfolios` or `/dashboard`

3. **User B**: Query via console
   ```javascript
   const { data } = await supabase
     .from('portfolios')
     .select('*')
     .eq('id', '550e8400-e29b-41d4-a716-446655440000')
   
   console.log(data) // Should be: null or []
   ```

**Expected Result**: ✓ PASS - User B cannot see User A's portfolio

---

## Test 2: Asset Isolation

**Objective**: Verify User B cannot access User A's portfolio assets

### Steps
1. **User A**: Add asset to "Test Portfolio A"
   - Add: PETR4, 100 units @ R$ 20.00
   - Note portfolio ID

2. **User B**: Query assets via console
   ```javascript
   const { data } = await supabase
     .from('portfolio_assets')
     .select('*')
     .eq('portfolio_id', '550e8400-e29b-41d4-a716-446655440000')
   
   console.log(data) // Should be: null (RLS blocks)
   ```

3. **User B**: Query all assets (should only see own)
   ```javascript
   const { data } = await supabase
     .from('portfolio_assets')
     .select('*')
   
   console.log(data) // Should be: [] or User B's assets only
   ```

**Expected Result**: ✓ PASS - User B cannot see User A's assets

---

## Test 3: Admin Access Denial

**Objective**: Verify non-admin users cannot execute admin RPCs

### Steps
1. **User B** (regular user): Try to call admin RPC
   ```javascript
   const { data, error } = await supabase.rpc('update_app_settings', {
     p_app_name: 'Hacked Name',
     p_app_description: 'Evil description'
   })
   
   console.log(error) // Should contain "permission denied"
   ```

2. **User B**: Try to toggle user block (admin only)
   ```javascript
   const { data, error } = await supabase.rpc('toggle_user_block', {
     p_target_user_id: 'some-user-id',
     p_blocked: true
   })
   
   console.log(error) // Should contain "permission denied"
   ```

**Expected Result**: ✓ PASS - RPCs return permission error

---

## Test 4: Data Import Isolation

**Objective**: Verify portfolio imports are isolated by user

### Steps
1. **User A**: Synchronize portfolio with text paste
   - Create portfolio, add asset via text import
   - Note data_source_id

2. **User B**: Query portfolio_imports
   ```javascript
   const { data } = await supabase
     .from('portfolio_imports')
     .select('*')
   
   console.log(data) // Should be: [] or User B's imports only
   ```

**Expected Result**: ✓ PASS - User B cannot see User A's imports

---

## Test 5: AI Analysis Isolation

**Objective**: Verify AI analyses are isolated by user

### Steps
1. **User A**: Request AI analysis
   - Click "🤖 Análise com IA" on portfolio
   - Wait for analysis to complete

2. **User B**: Query ai_analyses
   ```javascript
   const { data } = await supabase
     .from('ai_analyses')
     .select('*')
   
   console.log(data) // Should be: [] or User B's analyses only
   ```

3. **User B**: Try to access specific analysis ID
   ```javascript
   const { data } = await supabase
     .from('ai_analyses')
     .select('*')
     .eq('id', 'analysis-id-from-user-a')
   
   console.log(data) // Should be: null
   ```

**Expected Result**: ✓ PASS - User B cannot see User A's analyses

---

## Test 6: Session Token Security

**Objective**: Verify session tokens are secure

### Steps
1. **Browser DevTools** (Any window)
   - Open DevTools → Application → Cookies
   - Look for `sb-*` cookies (Supabase auth tokens)

2. **Verify cookie flags**
   - ✓ Should have: **Secure** flag (HTTPS only)
   - ✓ Should have: **HttpOnly** flag (JavaScript cannot access)
   - ✓ Should have: **SameSite=Lax** or **Strict**

3. **Check localStorage**
   - Open DevTools → Application → Local Storage → http://localhost:5174
   - ✓ Should NOT contain: Raw auth tokens
   - ✓ Should only contain: Non-sensitive data (theme, user preferences)

**Expected Result**: ✓ PASS - Tokens are secure

---

## Test 7: SQL Injection Prevention

**Objective**: Verify input validation prevents SQL injection

### Steps
1. **Portfolio Creation**
   - Create portfolio with name: `'); DROP TABLE portfolios; --`
   - Should succeed (safe due to parameterized queries)
   - Portfolio name should display as literal string

2. **Asset Import**
   - Paste malicious text:
     ```
     PETR4' OR '1'='1 100 20.50 21.30
     ```
   - Parser should reject or sanitize
   - Should show: "Nenhum ativo encontrado" or parse as literal

**Expected Result**: ✓ PASS - Input is safely parameterized

---

## Test 8: CORS Policy

**Objective**: Verify CORS restricts unauthorized origins

### Steps
1. **From external site**, try to call Supabase API
   ```javascript
   // Open browser console on unrelated site (e.g., google.com)
   const response = await fetch('https://vfglcvmcsiwvqtkpjchl.supabase.co/rest/v1/profiles', {
     headers: {
       'Authorization': 'Bearer ' + token,
       'apikey': 'sb_publishable_...'
     }
   })
   
   // Should fail with CORS error in console
   ```

2. **Check CORS headers**
   - Network tab should show CORS error for cross-origin requests
   - `Access-Control-Allow-Origin` should not be `*` for sensitive endpoints

**Expected Result**: ✓ PASS - CORS blocks unauthorized origins

---

## Test 9: API Key Exposure

**Objective**: Verify sensitive keys are not exposed in client code

### Steps
1. **Check .env**
   ```bash
   cat .env
   # Should NOT contain: OPENROUTER_API_KEY (real key)
   # Should contain: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
   ```

2. **Build output**
   ```bash
   npm run build
   # Check dist/ for hardcoded keys
   grep -r "sk-or-v1" dist/
   # Should return: (empty, no matches)
   ```

3. **Network tab**
   - Open DevTools → Network
   - Look at XHR requests to OpenRouter
   - Should NOT exist (calls go through Edge Function)

**Expected Result**: ✓ PASS - Keys are not exposed

---

## Test 10: Rate Limiting (Advisory)

**Objective**: Verify rate limit warnings appear

### Steps
1. **Rapid AI Requests**
   - Open portfolio
   - Click "🤖 Análise com IA" 10 times in rapid succession
   - Should see: Rate limit warning after ~5 requests

2. **Check client-side enforcement**
   ```javascript
   // useRateLimit hook should prevent duplicate submissions
   // Button should be disabled if limit exceeded
   ```

**Expected Result**: ⚠️ ADVISORY - Client-side rate limits shown (server-side enforcement recommended for production)

---

## Regression Tests

Run these after any code changes:

- [ ] User login still works
- [ ] Portfolio creation/edit/delete works
- [ ] Asset import still works
- [ ] Admin settings page loads (for admins)
- [ ] Dashboard loads for all users
- [ ] AI analysis still works (if OpenRouter key configured)

---

## Sign-Off

- **Date Tested**: _______________
- **Tester Name**: _______________
- **All Tests Passed**: [ ] Yes [ ] No
- **Issues Found**: _______________
  - (List any failed tests or anomalies)

---

**Note**: This checklist covers manual security testing. Automated testing (Jest, Cypress) recommended for regression suite.
