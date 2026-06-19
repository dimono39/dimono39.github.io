// generator.js - Генератор Arduino C++ кода из блоков (исправленная версия)

class ArduinoGenerator {
    constructor() {
        this.generator = new Blockly.Generator('Arduino');
        this.initGenerators();
        this.initForBlockGenerators();
    }

    // Инициализация генераторов через forBlock (новый API)
    initForBlockGenerators() {
        // ===== Основной блок программы (setup/loop) =====
        this.generator.forBlock['arduino_setup_loop'] = (block, generator) => {
            let setupCode = '';
            let loopCode = '';
            
            // Получаем вложенные блоки setup
            const setupBlock = block.getInputTargetBlock('SETUP');
            if (setupBlock) {
                setupCode = generator.blockToCode(setupBlock);
            }
            
            // Получаем вложенные блоки loop
            const loopBlock = block.getInputTargetBlock('LOOP');
            if (loopBlock) {
                loopCode = generator.blockToCode(loopBlock);
            }
            
            // Добавляем глобальные объявления
            const globalCode = this.collectGlobalDeclarations();
            
            let fullCode = '';
            fullCode += boardsManager.generateHeader();
            fullCode += '\n';
            fullCode += this.collectIncludes();
            fullCode += '\n';
            fullCode += globalCode;
            fullCode += '\nvoid setup() {\n';
            fullCode += setupCode || '  // Инициализация\n';
            fullCode += '}\n\n';
            fullCode += 'void loop() {\n';
            fullCode += loopCode || '  // Основной код\n';
            fullCode += '}\n';
            
            return fullCode;
        };

        // ===== Блоки пинов =====
        this.generator.forBlock['arduino_pin_mode'] = (block, generator) => {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 'LED_BUILTIN';
            const mode = block.getFieldValue('MODE');
            return `pinMode(${pin}, ${mode});\n`;
        };

        this.generator.forBlock['arduino_digital_write'] = (block, generator) => {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 'LED_BUILTIN';
            const value = block.getFieldValue('VALUE');
            return `digitalWrite(${pin}, ${value});\n`;
        };

        this.generator.forBlock['arduino_digital_read'] = (block, generator) => {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '0';
            const code = `digitalRead(${pin})`;
            return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        this.generator.forBlock['arduino_analog_write'] = (block, generator) => {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '0';
            const value = generator.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ATOMIC) || '0';
            return `analogWrite(${pin}, ${value});\n`;
        };

        this.generator.forBlock['arduino_analog_read'] = (block, generator) => {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 'A0';
            const code = `analogRead(${pin})`;
            return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        // ===== Блоки времени =====
        this.generator.forBlock['arduino_delay'] = (block, generator) => {
            const time = generator.valueToCode(block, 'TIME', Blockly.Arduino.ORDER_ATOMIC) || '1000';
            return `delay(${time});\n`;
        };

        this.generator.forBlock['arduino_delay_microseconds'] = (block, generator) => {
            const time = generator.valueToCode(block, 'TIME', Blockly.Arduino.ORDER_ATOMIC) || '100';
            return `delayMicroseconds(${time});\n`;
        };

        this.generator.forBlock['arduino_millis'] = (block, generator) => {
            return ['millis()', Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        this.generator.forBlock['arduino_micros'] = (block, generator) => {
            return ['micros()', Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        // ===== Блоки Serial =====
        this.generator.forBlock['arduino_serial_begin'] = (block, generator) => {
            const speed = generator.valueToCode(block, 'SPEED', Blockly.Arduino.ORDER_ATOMIC) || '9600';
            return `Serial.begin(${speed});\n`;
        };

        this.generator.forBlock['arduino_serial_print'] = (block, generator) => {
            const text = generator.valueToCode(block, 'TEXT', Blockly.Arduino.ORDER_ATOMIC) || '""';
            return `Serial.print(${text});\n`;
        };

        this.generator.forBlock['arduino_serial_println'] = (block, generator) => {
            const text = generator.valueToCode(block, 'TEXT', Blockly.Arduino.ORDER_ATOMIC) || '""';
            return `Serial.println(${text});\n`;
        };

        this.generator.forBlock['arduino_serial_read'] = (block, generator) => {
            return ['Serial.read()', Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        this.generator.forBlock['arduino_serial_available'] = (block, generator) => {
            return ['Serial.available()', Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        // ===== Математические функции =====
        this.generator.forBlock['arduino_map'] = (block, generator) => {
            const value = generator.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_NONE) || '0';
            const fromLow = generator.valueToCode(block, 'FROM_LOW', Blockly.Arduino.ORDER_NONE) || '0';
            const fromHigh = generator.valueToCode(block, 'FROM_HIGH', Blockly.Arduino.ORDER_NONE) || '1023';
            const toLow = generator.valueToCode(block, 'TO_LOW', Blockly.Arduino.ORDER_NONE) || '0';
            const toHigh = generator.valueToCode(block, 'TO_HIGH', Blockly.Arduino.ORDER_NONE) || '255';
            const code = `map(${value}, ${fromLow}, ${fromHigh}, ${toLow}, ${toHigh})`;
            return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        this.generator.forBlock['arduino_constrain'] = (block, generator) => {
            const value = generator.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_NONE) || '0';
            const min = generator.valueToCode(block, 'MIN', Blockly.Arduino.ORDER_NONE) || '0';
            const max = generator.valueToCode(block, 'MAX', Blockly.Arduino.ORDER_NONE) || '255';
            const code = `constrain(${value}, ${min}, ${max})`;
            return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        this.generator.forBlock['arduino_random'] = (block, generator) => {
            const min = generator.valueToCode(block, 'MIN', Blockly.Arduino.ORDER_NONE) || '0';
            const max = generator.valueToCode(block, 'MAX', Blockly.Arduino.ORDER_NONE) || '100';
            const code = `random(${min}, ${max})`;
            return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        // ===== Тональные сигналы =====
        this.generator.forBlock['arduino_tone'] = (block, generator) => {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '8';
            const frequency = generator.valueToCode(block, 'FREQUENCY', Blockly.Arduino.ORDER_ATOMIC) || '440';
            const duration = generator.valueToCode(block, 'DURATION', Blockly.Arduino.ORDER_ATOMIC);
            if (duration) {
                return `tone(${pin}, ${frequency}, ${duration});\n`;
            }
            return `tone(${pin}, ${frequency});\n`;
        };

        this.generator.forBlock['arduino_no_tone'] = (block, generator) => {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '8';
            return `noTone(${pin});\n`;
        };

        // ===== Сенсоры =====
        this.generator.forBlock['sensor_dht_read'] = (block, generator) => {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '2';
            const type = block.getFieldValue('TYPE');
            const param = block.getFieldValue('PARAM');
            
            // Добавляем глобальные объявления
            this.addInclude('#include <DHT.h>');
            this.addGlobalDeclaration(`DHT dht_${pin}(${pin}, ${type});`);
            this.addSetupCode(`dht_${pin}.begin();`);
            
            let method;
            if (param === 'temperature') method = 'readTemperature';
            else if (param === 'humidity') method = 'readHumidity';
            else method = 'readTemperature';
            
            const code = `dht_${pin}.${method}()`;
            return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        this.generator.forBlock['sensor_ultrasonic'] = (block, generator) => {
            const trig = generator.valueToCode(block, 'TRIG', Blockly.Arduino.ORDER_ATOMIC) || '9';
            const echo = generator.valueToCode(block, 'ECHO', Blockly.Arduino.ORDER_ATOMIC) || '10';
            
            // Добавляем функцию измерения расстояния
            this.addGlobalDeclaration(`
long readUltrasonicDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH);
  return duration * 0.034 / 2;
}`);
            
            this.addSetupCode(`pinMode(${trig}, OUTPUT);\npinMode(${echo}, INPUT);`);
            
            const code = `readUltrasonicDistance(${trig}, ${echo})`;
            return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        this.generator.forBlock['sensor_pir'] = (block, generator) => {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '7';
            this.addSetupCode(`pinMode(${pin}, INPUT);`);
            const code = `digitalRead(${pin})`;
            return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        this.generator.forBlock['sensor_ldr'] = (block, generator) => {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 'A0';
            const code = `analogRead(${pin})`;
            return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        // ===== Устройства =====
        this.generator.forBlock['actuator_servo_attach'] = (block, generator) => {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '9';
            this.addInclude('#include <Servo.h>');
            this.addGlobalDeclaration(`Servo servo_${pin};`);
            return `servo_${pin}.attach(${pin});\n`;
        };

        this.generator.forBlock['actuator_servo'] = (block, generator) => {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '9';
            const angle = generator.valueToCode(block, 'ANGLE', Blockly.Arduino.ORDER_ATOMIC) || '90';
            
            // Проверяем, есть ли уже attach
            if (!this.hasGlobalDeclaration(`Servo servo_${pin}`)) {
                this.addInclude('#include <Servo.h>');
                this.addGlobalDeclaration(`Servo servo_${pin};`);
                this.addSetupCode(`servo_${pin}.attach(${pin});`);
            }
            
            return `servo_${pin}.write(${angle});\n`;
        };

        this.generator.forBlock['output_led'] = (block, generator) => {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 'LED_BUILTIN';
            const state = block.getFieldValue('STATE');
            this.addSetupCode(`pinMode(${pin}, OUTPUT);`);
            return `digitalWrite(${pin}, ${state});\n`;
        };

        this.generator.forBlock['output_rgb_led'] = (block, generator) => {
            const redPin = generator.valueToCode(block, 'RED', Blockly.Arduino.ORDER_ATOMIC) || '9';
            const greenPin = generator.valueToCode(block, 'GREEN', Blockly.Arduino.ORDER_ATOMIC) || '10';
            const bluePin = generator.valueToCode(block, 'BLUE', Blockly.Arduino.ORDER_ATOMIC) || '11';
            const red = generator.valueToCode(block, 'RED_VAL', Blockly.Arduino.ORDER_ATOMIC) || '0';
            const green = generator.valueToCode(block, 'GREEN_VAL', Blockly.Arduino.ORDER_ATOMIC) || '0';
            const blue = generator.valueToCode(block, 'BLUE_VAL', Blockly.Arduino.ORDER_ATOMIC) || '0';
            
            this.addSetupCode(`pinMode(${redPin}, OUTPUT);\npinMode(${greenPin}, OUTPUT);\npinMode(${bluePin}, OUTPUT);`);
            
            return `analogWrite(${redPin}, ${red});\nanalogWrite(${greenPin}, ${green});\nanalogWrite(${bluePin}, ${blue});\n`;
        };

        this.generator.forBlock['output_buzzer'] = (block, generator) => {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '8';
            const frequency = generator.valueToCode(block, 'FREQUENCY', Blockly.Arduino.ORDER_ATOMIC) || '440';
            const duration = generator.valueToCode(block, 'DURATION', Blockly.Arduino.ORDER_ATOMIC) || '500';
            
            this.addSetupCode(`pinMode(${pin}, OUTPUT);`);
            
            return `tone(${pin}, ${frequency}, ${duration});\ndelay(${duration});\nnoTone(${pin});\n`;
        };

        this.generator.forBlock['output_relay'] = (block, generator) => {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '4';
            const state = block.getFieldValue('STATE');
            this.addSetupCode(`pinMode(${pin}, OUTPUT);`);
            return `digitalWrite(${pin}, ${state});\n`;
        };

        // ===== Пользовательские блоки =====
        blocksManager.customBlocks.forEach(customBlock => {
            this.generator.forBlock[customBlock.id] = (block, generator) => {
                const value = generator.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ATOMIC) || '0';
                return customBlock.code.replace(/\{\{value\}\}/g, value) + '\n';
            };
        });
    }

    // Вспомогательные методы для сбора кода
    constructor() {
        this.includes = new Set();
        this.globalDeclarations = [];
        this.setupCode = [];
        this.generator = new Blockly.Generator('Arduino');
    }

    clear() {
        this.includes.clear();
        this.globalDeclarations = [];
        this.setupCode = [];
    }

    addInclude(include) {
        this.includes.add(include);
    }

    addGlobalDeclaration(code) {
        if (!this.globalDeclarations.includes(code)) {
            this.globalDeclarations.push(code);
        }
    }

    addSetupCode(code) {
        if (!this.setupCode.includes(code)) {
            this.setupCode.push(code);
        }
    }

    hasGlobalDeclaration(pattern) {
        return this.globalDeclarations.some(decl => decl.includes(pattern));
    }

    collectIncludes() {
        return Array.from(this.includes).join('\n');
    }

    collectGlobalDeclarations() {
        return this.globalDeclarations.join('\n');
    }

    collectSetupCode() {
        return this.setupCode.join('\n');
    }

    // Генерация кода
    generate(workspace) {
        this.clear();
        
        try {
            const code = this.generator.workspaceToCode(workspace);
            
            // Если использовался блок setup_loop, код уже готов
            if (code.trim().startsWith('/*')) {
                return this.cleanCode(code);
            }
            
            // Иначе оборачиваем в setup/loop
            let fullCode = '';
            fullCode += boardsManager.generateHeader();
            fullCode += '\n';
            fullCode += this.collectIncludes();
            fullCode += '\n\n';
            fullCode += this.collectGlobalDeclarations();
            fullCode += '\n\n';
            fullCode += 'void setup() {\n';
            fullCode += '  ' + this.collectSetupCode().split('\n').join('\n  ') || '  // Инициализация';
            fullCode += '\n}\n\n';
            fullCode += 'void loop() {\n';
            fullCode += '  ' + code.trim().split('\n').join('\n  ') || '  // Основной цикл';
            fullCode += '\n}\n';
            
            return this.cleanCode(fullCode);
        } catch (error) {
            console.error('Ошибка генерации:', error);
            throw error;
        }
    }

    cleanCode(code) {
        // Убираем множественные пустые строки
        code = code.replace(/\n{3,}/g, '\n\n');
        // Убираем пробелы в конце строк
        code = code.replace(/[ \t]+$/gm, '');
        // Добавляем финальный перенос строки
        if (!code.endsWith('\n')) code += '\n';
        return code;
    }

    // Проверка синтаксиса
    validate(code) {
        const issues = [];
        
        if (!code.includes('void setup()')) {
            issues.push({ type: 'error', message: 'Отсутствует функция setup()' });
        }
        if (!code.includes('void loop()')) {
            issues.push({ type: 'error', message: 'Отсутствует функция loop()' });
        }
        
        const openBraces = (code.match(/\{/g) || []).length;
        const closeBraces = (code.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            issues.push({ 
                type: 'error', 
                message: `Несоответствие скобок: открыто ${openBraces}, закрыто ${closeBraces}` 
            });
        }
        
        if (!code.includes('pinMode') && (code.includes('digitalWrite') || code.includes('analogWrite'))) {
            issues.push({ 
                type: 'warning', 
                message: 'Используются функции вывода без настройки pinMode' 
            });
        }
        
        return issues;
    }
}

const arduinoGenerator = new ArduinoGenerator();