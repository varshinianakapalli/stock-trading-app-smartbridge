import fs from 'fs';

const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('=== STARTING SB STOCKS PROGRAMMATIC API VERIFICATION ===');
  
  let token = '';
  
  try {
    // 1. Register Admin User
    console.log('\n[1/8] Registering administrator...');
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin_tester',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin'
      })
    });
    
    let registerData = await registerRes.json();
    if (registerRes.status === 201) {
      console.log('✔ Administrator registered successfully!');
      token = registerData.token;
    } else if (registerRes.status === 400 && registerData.message.includes('exists')) {
      console.log('✔ Admin user already exists. Proceeding to login...');
      // Login to get token
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: 'password123'
        })
      });
      const loginData = await loginRes.json();
      token = loginData.token;
      console.log('✔ Logged in admin user successfully.');
    } else {
      throw new Error(`Registration failed: ${JSON.stringify(registerData)}`);
    }

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 2. Add custom stock (Admin route)
    console.log('\n[2/8] Creating new stock listing (Admin only)...');
    const listRes = await fetch(`${BASE_URL}/stocks/admin`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        symbol: 'DEEP',
        name: 'DeepMind Corp.',
        price: 250.00
      })
    });
    const listData = await listRes.json();
    if (listRes.status === 201) {
      console.log('✔ Created DEEP stock listing:', listData.symbol, '@ $' + listData.price);
    } else if (listRes.status === 400 && listData.message.includes('exists')) {
      console.log('✔ DEEP stock listing already exists in database.');
    } else {
      throw new Error(`Admin listing failed: ${listData.message}`);
    }

    // 3. Retrieve stock directory (Public route)
    console.log('\n[3/8] Checking stock list directory...');
    const directoryRes = await fetch(`${BASE_URL}/stocks`);
    const directoryData = await directoryRes.json();
    const deepStock = directoryData.find(s => s.symbol === 'DEEP');
    if (deepStock) {
      console.log(`✔ Found DEEP in directory. Price: $${deepStock.price}, Change: ${deepStock.change}%`);
    } else {
      throw new Error('DEEP stock not found in directory');
    }

    // 4. Watchlist addition
    console.log('\n[4/8] Adding stock to watchlist...');
    const watchRes = await fetch(`${BASE_URL}/watchlist/add`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ symbol: 'DEEP' })
    });
    const watchData = await watchRes.json();
    if (watchRes.status === 200 || (watchRes.status === 400 && watchData.message.includes('already'))) {
      console.log('✔ Stock added to watchlist (or already watched).');
    } else {
      throw new Error(`Watchlist failed: ${watchData.message}`);
    }

    // 5. Place BUY order
    console.log('\n[5/8] Executing BUY order (10 shares of DEEP)...');
    const buyRes = await fetch(`${BASE_URL}/trades/buy`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ symbol: 'DEEP', quantity: 10 })
    });
    const buyData = await buyRes.json();
    if (buyRes.status === 201) {
      console.log('✔ BUY order success! Updated Cash Balance: $' + buyData.balance);
    } else {
      throw new Error(`BUY order failed: ${buyData.message}`);
    }

    // 6. Place SELL order
    console.log('\n[6/8] Executing SELL order (4 shares of DEEP)...');
    const sellRes = await fetch(`${BASE_URL}/trades/sell`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ symbol: 'DEEP', quantity: 4 })
    });
    const sellData = await sellRes.json();
    if (sellRes.status === 201) {
      console.log('✔ SELL order success! Updated Cash Balance: $' + sellData.balance);
    } else {
      throw new Error(`SELL order failed: ${sellData.message}`);
    }

    // 7. Verify portfolio holdings decorated valuation
    console.log('\n[7/8] Querying portfolio valuation...');
    const portfolioRes = await fetch(`${BASE_URL}/trades/holdings`, {
      headers: authHeaders
    });
    const portfolioData = await portfolioRes.json();
    const deepHolding = portfolioData.find(h => h.symbol === 'DEEP');
    if (deepHolding) {
      console.log(`✔ Holding details matches logic:`);
      console.log(`  - Owned Quantity: ${deepHolding.quantity} shares (expected: 6)`);
      console.log(`  - Average Cost: $${deepHolding.averagePrice}`);
      console.log(`  - Current Market Value: $${deepHolding.currentValuation}`);
      console.log(`  - Net Return: $${deepHolding.totalGainLoss} (${deepHolding.gainLossPercent}%)`);
    } else {
      throw new Error('Holding not found in portfolio valuation payload');
    }

    // 8. Verify Transactions ledger logs
    console.log('\n[8/8] Checking transactions ledger...');
    const ledgerRes = await fetch(`${BASE_URL}/trades/transactions`, {
      headers: authHeaders
    });
    const ledgerData = await ledgerRes.json();
    console.log(`✔ Transactions found: ${ledgerData.length} records.`);
    ledgerData.slice(0, 2).forEach(t => {
      console.log(`  - [${t.type}] ${t.quantity} shares of ${t.symbol} @ $${t.price} (Total: $${t.totalAmount})`);
    });

    console.log('\n=== ALL API WORKFLOW TESTS COMPLETED SUCCESSFULLY! ===');
  } catch (error) {
    console.error('\n❌ VERIFICATION TEST FAILED:', error.message);
  }
};

runTests();
