/**
 * 🧪 Unit-тесты для core-функций
 * Простой тестовый фреймворк
 */

class TestRunner {
  constructor() {
    this.tests = [];
    this.results = [];
    this.container = null;
  }

  describe(description, testFn) {
    console.group(`🧪 ${description}`);
    this.tests.push({ description, testFn });
    console.groupEnd();
  }

  it(description, testFn) {
    try {
      testFn();
      this.results.push({ description, passed: true });
      console.log(`✅ ${description}`);
    } catch (error) {
      this.results.push({ 
        description, 
        passed: false, 
        error: error.message 
      });
      console.error(`❌ ${description}: ${error.message}`);
    }
  }

  assert(condition, message = 'Assertion failed') {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEquals(actual, expected, message = 'Values are not equal') {
    if (actual !== expected) {
      throw new Error(`${message}. Expected: ${expected}, Actual: ${actual}`);
    }
  }

  assertDeepEquals(actual, expected, message = 'Objects are not equal') {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
    }
  }

  assertThrows(fn, errorMessage) {
    try {
      fn();
      throw new Error('Function should have thrown an error');
    } catch (error) {
      if (errorMessage && !error.message.includes(errorMessage)) {
        throw new Error(`Expected error message containing "${errorMessage}", got "${error.message}"`);
      }
    }
  }

  run() {
    console.group('🚀 Запуск тестов');
    this.results = [];
    
    this.tests.forEach(test => {
      console.group(`📋 ${test.description}`);
      test.testFn();
      console.groupEnd();
    });
    
    this.printSummary();
    console.groupEnd();
  }

  printSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log(`\n📊 Итог: ${passed}/${total} тестов пройдено`);
    
    if (passed === total) {
      console.log('🎉 Все тесты пройдены успешно!');
    } else {
      console.error('⚠️ Некоторые тесты не пройдены:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.error(`  ❌ ${r.description}: ${r.error}`));
    }
  }

  renderResults(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="test-results">
        <h3>🧪 Результаты тестирования</h3>
        <div id="testResultsList"></div>
      </div>
    `;
    
    const resultsList = document.getElementById('testResultsList');
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    resultsList.innerHTML = `
      <div class="mb-3">
        <div class="progress">
          <div class="progress-bar bg-success" style="width: ${(passed/total)*100}%">
            ${passed}/${total}
          </div>
        </div>
      </div>
    `;
    
    this.results.forEach(result => {
      const item = document.createElement('div');
      item.className = `test-item p-2 mb-1 ${result.passed ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`;
      item.innerHTML = `
        <div class="d-flex justify-content-between">
          <span>${result.description}</span>
          <span class="badge ${result.passed ? 'bg-success' : 'bg-danger'}">
            ${result.passed ? '✅' : '❌'}
          </span>
        </div>
        ${!result.passed ? `<small class="text-danger">${result.error}</small>` : ''}
      `;
      resultsList.appendChild(item);
    });
  }
}

// Создаем глобальный тестовый раннер
window.TestRunner = new TestRunner();

/**
 * Тесты для DataManager
 */
function runDataManagerTests() {
  window.TestRunner.describe('DataManager тесты', () => {
    window.TestRunner.it('should calculate grade correctly', () => {
      const tasks = [
        { maxScore: 5 },
        { maxScore: 3 },
        { maxScore: 2 }
      ];
      
      // 10 из 10 возможных = 100% = 5
      window.TestRunner.assertEquals(
        window.TableRenderer.calculateGrade(10, tasks),
        '5'
      );
      
      // 7 из 10 = 70% = 4
      window.TestRunner.assertEquals(
        window.TableRenderer.calculateGrade(7, tasks),
        '4'
      );
      
      // 5 из 10 = 50% = 3
      window.TestRunner.assertEquals(
        window.TableRenderer.calculateGrade(5, tasks),
        '3'
      );
      
      // 3 из 10 = 30% = 2
      window.TestRunner.assertEquals(
        window.TableRenderer.calculateGrade(3, tasks),
        '2'
      );
    });

    window.TestRunner.it('should safely calculate percentages', () => {
      // Нормальные случаи
      window.TestRunner.assertEquals(
        safeCalculatePercentage(5, 10),
        50
      );
      
      window.TestRunner.assertEquals(
        safeCalculatePercentage(0, 10),
        0
      );
      
      window.TestRunner.assertEquals(
        safeCalculatePercentage(10, 10),
        100
      );
      
      // Edge cases
      window.TestRunner.assertEquals(
        safeCalculatePercentage(5, 0),
        0
      );
      
      window.TestRunner.assertEquals(
        safeCalculatePercentage(NaN, 10),
        0
      );
      
      window.TestRunner.assertEquals(
        safeCalculatePercentage(5, 'invalid'),
        0
      );
    });

    window.TestRunner.it('should validate data correctly', () => {
      const schema = {
        required: ['name', 'age'],
        numbers: ['age', 'score']
      };
      
      const validData = { name: 'John', age: '25', score: '95' };
      const invalidData = { name: '', age: 'not-a-number' };
      
      // Должен пройти валидацию
      window.TestRunner.assert(
        window.ErrorHandler.validate(validData, schema, 'test')
      );
      
      // Должен бросить ошибку
      window.TestRunner.assertThrows(
        () => window.ErrorHandler.validate(invalidData, schema, 'test'),
        'обязательно для заполнения'
      );
    });
  });
}

/**
 * Тесты для TableRenderer
 */
function runTableRendererTests() {
  window.TestRunner.describe('TableRenderer тесты', () => {
    window.TestRunner.it('should prepare results data correctly', () => {
      const students = ['Иванов', 'Петров'];
      const tasks = [
        { maxScore: 5 },
        { maxScore: 3 }
      ];
      const results = [
        [4, 2], // Иванов: 4 из 5, 2 из 3
        [5, 1]  // Петров: 5 из 5, 1 из 3
      ];
      
      const preparedData = window.TableRenderer.prepareResultsData(
        results, 
        students, 
        tasks
      );
      
      window.TestRunner.assertEquals(preparedData.length, 2);
      window.TestRunner.assertEquals(preparedData[0].student, 'Иванов');
      window.TestRunner.assertEquals(preparedData[0].total, 6); // 4 + 2
      window.TestRunner.assertEquals(preparedData[0].grade, '4'); // 6 из 8 = 75%
      window.TestRunner.assertEquals(preparedData[0].task_0, 4);
      window.TestRunner.assertEquals(preparedData[0].task_1, 2);
    });

    window.TestRunner.it('should generate correct grade badge classes', () => {
      window.TestRunner.assertEquals(
        window.TableRenderer.getGradeBadgeClass('5'),
        'bg-success'
      );
      
      window.TestRunner.assertEquals(
        window.TableRenderer.getGradeBadgeClass('4'),
        'bg-primary'
      );
      
      window.TestRunner.assertEquals(
        window.TableRenderer.getGradeBadgeClass('3'),
        'bg-warning'
      );
      
      window.TestRunner.assertEquals(
        window.TableRenderer.getGradeBadgeClass('2'),
        'bg-danger'
      );
      
      window.TestRunner.assertEquals(
        window.TableRenderer.getGradeBadgeClass('1'),
        'bg-secondary'
      );
      
      window.TestRunner.assertEquals(
        window.TableRenderer.getGradeBadgeClass('unknown'),
        'bg-secondary'
      );
    });
  });
}

/**
 * Тесты для ErrorHandler
 */
function runErrorHandlerTests() {
  window.TestRunner.describe('ErrorHandler тесты', () => {
    window.TestRunner.it('should normalize errors correctly', () => {
      const error = new Error('Test error');
      const normalized = window.ErrorHandler.normalizeError(error);
      
      window.TestRunner.assertEquals(normalized.type, 'RUNTIME_ERROR');
      window.TestRunner.assertEquals(normalized.message, 'Test error');
      window.TestRunner.assert(normalized.stack.includes('Error: Test error'));
    });

    window.TestRunner.it('should handle string errors', () => {
      const normalized = window.ErrorHandler.normalizeError('String error');
      
      window.TestRunner.assertEquals(normalized.type, 'RUNTIME_ERROR');
      window.TestRunner.assertEquals(normalized.message, 'String error');
    });

    window.TestRunner.it('should provide user-friendly messages', () => {
      const networkError = { type: 'NETWORK_ERROR', message: 'Failed to fetch' };
      const message = window.ErrorHandler.getUserFriendlyMessage(
        networkError, 
        'loadData'
      );
      
      window.TestRunner.assert(
        message.includes('Проблемы с соединением') && 
        message.includes('при загрузке данных')
      );
    });

    window.TestRunner.it('should execute functions safely', async () => {
      const errorFn = () => { throw new Error('Test error'); };
      const successFn = () => 'Success';
      
      // Ошибочная функция должна вернуть fallback
      const result1 = await window.ErrorHandler.safeExecute(
        errorFn, 
        'calculateGrade'
      );
      window.TestRunner.assertEquals(result1, 2);
      
      // Успешная функция должна вернуть результат
      const result2 = await window.ErrorHandler.safeExecute(
        successFn, 
        'test'
      );
      window.TestRunner.assertEquals(result2, 'Success');
    });
  });
}

/**
 * Запуск всех тестов
 */
function runAllTests() {
  console.clear();
  console.log('🚀 Запуск всех тестов системы...');
  
  // Регистрируем тесты
  runDataManagerTests();
  runTableRendererTests();
  runErrorHandlerTests();
  
  // Запускаем
  window.TestRunner.run();
  
  // Показываем результаты в UI
  window.TestRunner.renderResults('testResultsContainer');
}

// Добавляем кнопку для запуска тестов в UI
function addTestButton() {
  const testButton = document.createElement('button');
  testButton.className = 'btn btn-sm btn-outline-info fixed-bottom m-3';
  testButton.style.zIndex = '10000';
  testButton.style.left = '10px';
  testButton.style.bottom = '10px';
  testButton.innerHTML = '🧪 Тесты';
  testButton.onclick = runAllTests;
  
  const container = document.createElement('div');
  container.id = 'testResultsContainer';
  container.style.position = 'fixed';
  container.style.bottom = '50px';
  container.style.left = '10px';
  container.style.width = '400px';
  container.style.maxHeight = '500px';
  container.style.overflow = 'auto';
  container.style.backgroundColor = 'white';
  container.style.border = '1px solid #ddd';
  container.style.borderRadius = '5px';
  container.style.padding = '10px';
  container.style.zIndex = '9999';
  container.style.display = 'none';
  
  document.body.appendChild(testButton);
  document.body.appendChild(container);
  
  // Показываем/скрываем контейнер результатов
  testButton.addEventListener('click', () => {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  });
}

// Инициализируем при загрузке
if (document.readyState === 'loading') {
  //document.addEventListener('DOMContentLoaded', addTestButton);
} else {
  addTestButton();
}