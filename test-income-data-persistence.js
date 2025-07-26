// 소득 데이터 저장 테스트 스크립트
async function testIncomeDataPersistence() {
  const testData = {
    wages: 50000,
    interestIncome: 1200,
    dividends: 800,
    capitalGains: 45000,
    totalIncome: 97000
  };

  try {
    // 1. 현재 데이터 확인
    console.log('=== 현재 저장된 데이터 확인 ===');
    const getCurrentData = await fetch('/api/tax-return', {
      credentials: 'include'
    });
    const currentData = await getCurrentData.json();
    console.log('현재 소득 데이터:', currentData.income);

    // 2. 새 데이터로 업데이트
    console.log('\n=== 테스트 데이터로 업데이트 ===');
    const updateResponse = await fetch(`/api/tax-return/${currentData.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        ...currentData,
        income: {
          ...currentData.income,
          ...testData
        }
      }),
    });

    if (updateResponse.ok) {
      console.log('✓ 데이터 업데이트 성공');
    } else {
      console.error('✗ 데이터 업데이트 실패:', updateResponse.status);
    }

    // 3. 업데이트된 데이터 확인
    console.log('\n=== 업데이트 후 데이터 확인 ===');
    const getUpdatedData = await fetch('/api/tax-return', {
      credentials: 'include'
    });
    const updatedData = await getUpdatedData.json();
    console.log('업데이트된 소득 데이터:', updatedData.income);

    // 4. 데이터 검증
    console.log('\n=== 데이터 검증 ===');
    const income = updatedData.income;
    const tests = [
      { field: 'wages', expected: testData.wages, actual: income.wages },
      { field: 'interestIncome', expected: testData.interestIncome, actual: income.interestIncome },
      { field: 'dividends', expected: testData.dividends, actual: income.dividends },
      { field: 'capitalGains', expected: testData.capitalGains, actual: income.capitalGains },
      { field: 'totalIncome', expected: testData.totalIncome, actual: income.totalIncome }
    ];

    let allPassed = true;
    tests.forEach(test => {
      const passed = test.actual === test.expected;
      console.log(`${passed ? '✓' : '✗'} ${test.field}: 예상값 ${test.expected}, 실제값 ${test.actual}`);
      if (!passed) allPassed = false;
    });

    console.log(`\n=== 테스트 결과: ${allPassed ? '전체 통과' : '일부 실패'} ===`);
    
    return allPassed;
  } catch (error) {
    console.error('테스트 실행 중 오류:', error);
    return false;
  }
}

// 테스트 실행
testIncomeDataPersistence().then(result => {
  console.log(`최종 결과: ${result ? '성공' : '실패'}`);
});