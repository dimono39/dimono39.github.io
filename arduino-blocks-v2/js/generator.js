// generator.js - Генератор Arduino C++ кода (исправленная версия)

class ArduinoGenerator {
    constructor() {
        this.includes = new Set();
        this.globalDeclarations = [];
        this.setupCode = [];
        this.generator = null;
        this.initGenerator();
    }

    initGenerator() {
        this.generator = new Blockly.Generator('Arduino');
        this.initForBlockGenerators();
    }

    initForBlockGenerators() {
        // Ссылка на этот экземпляр для использования в генераторах
        const self = this;

        // ===== Программа Arduino (setup/loop) =====
        this.generator.forBlock['arduino_setup_loop'] = function(block, generator) {
            self.clear();
            
            let setupCode = '';
            let loopCode = '';
            
            const setupBlock = block.getInputTargetBlock('SETUP');
            if (setupBlock) {
                const statements = generator.statementToCode(block, 'SETUP');
                setupCode = statements;
            }
            
            const loopBlock = block.getInputTargetBlock('LOOP');
            if (loopBlock) {
                const statements = generator.statementToCode(block, 'LOOP');
                loopCode = statements;
            }
            
            let fullCode = '';
            fullCode += boardsManager.generateHeader();
            fullCode += '\n';
            
            const includes = self.collectIncludes();
            if (includes) {
                fullCode += includes + '\n\n';
            }
            
            const globals = self.collectGlobalDeclarations();
            if (globals) {
                fullCode += globals + '\n\n';
            }
            
            fullCode += 'void setup() {\n';
            const setupLines = (self.collectSetupCode() + '\n' + setupCode).trim();
            if (setupLines) {
                fullCode += setupLines.split('\n').map(l => '  ' + l).join('\n') + '\n';
            } else {
                fullCode += '  // Инициализация\n';
            }
            fullCode += '}\n\n';
            
            fullCode += 'void loop() {\n';
            if (loopCode.trim()) {
                fullCode += loopCode.split('\n').map(l => '  ' + l).join('\n') + '\n';
            } else {
                fullCode += '  // Основной код\n';
            }
            fullCode += '}\n';
            
            return fullCode;
        };

        // ===== Пины =====
        this.generator.forBlock['arduino_pin_mode'] = function(block, generator) {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 'LED_BUILTIN';
            const mode = block.getFieldValue('MODE') || 'OUTPUT';
            return 'pinMode(' + pin + ', ' + mode + ');\n';
        };

        this.generator.forBlock['arduino_digital_write'] = function(block, generator) {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 'LED_BUILTIN';
            const value = block.getFieldValue('VALUE') || 'HIGH';
            return 'digitalWrite(' + pin + ', ' + value + ');\n';
        };

        this.generator.forBlock['arduino_digital_read'] = function(block, generator) {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '0';
            return ['digitalRead(' + pin + ')', Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        this.generator.forBlock['arduino_analog_write'] = function(block, generator) {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '0';
            const value = generator.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ATOMIC) || '0';
            return 'analogWrite(' + pin + ', ' + value + ');\n';
        };

        this.generator.forBlock['arduino_analog_read'] = function(block, generator) {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 'A0';
            return ['analogRead(' + pin + ')', Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        // ===== Время =====
        this.generator.forBlock['arduino_delay'] = function(block, generator) {
            const time = generator.valueToCode(block, 'TIME', Blockly.Arduino.ORDER_ATOMIC) || '1000';
            return 'delay(' + time + ');\n';
        };

        this.generator.forBlock['arduino_delay_microseconds'] = function(block, generator) {
            const time = generator.valueToCode(block, 'TIME', Blockly.Arduino.ORDER_ATOMIC) || '100';
            return 'delayMicroseconds(' + time + ');\n';
        };

        this.generator.forBlock['arduino_millis'] = function(block, generator) {
            return ['millis()', Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        this.generator.forBlock['arduino_micros'] = function(block, generator) {
            return ['micros()', Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        // ===== Serial =====
        this.generator.forBlock['arduino_serial_begin'] = function(block, generator) {
            const speed = generator.valueToCode(block, 'SPEED', Blockly.Arduino.ORDER_ATOMIC) || '9600';
            return 'Serial.begin(' + speed + ');\n';
        };

        this.generator.forBlock['arduino_serial_print'] = function(block, generator) {
            const text = generator.valueToCode(block, 'TEXT', Blockly.Arduino.ORDER_ATOMIC) || '""';
            return 'Serial.print(' + text + ');\n';
        };

        this.generator.forBlock['arduino_serial_println'] = function(block, generator) {
            const text = generator.valueToCode(block, 'TEXT', Blockly.Arduino.ORDER_ATOMIC) || '""';
            return 'Serial.println(' + text + ');\n';
        };

        this.generator.forBlock['arduino_serial_read'] = function(block, generator) {
            return ['Serial.read()', Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        this.generator.forBlock['arduino_serial_available'] = function(block, generator) {
            return ['Serial.available()', Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        // ===== Тоны =====
        this.generator.forBlock['arduino_tone'] = function(block, generator) {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '8';
            const frequency = generator.valueToCode(block, 'FREQUENCY', Blockly.Arduino.ORDER_ATOMIC) || '440';
            const duration = generator.valueToCode(block, 'DURATION', Blockly.Arduino.ORDER_ATOMIC);
            
            if (duration && duration !== 'undefined') {
                return 'tone(' + pin + ', ' + frequency + ', ' + duration + ');\n';
            }
            return 'tone(' + pin + ', ' + frequency + ');\n';
        };

        this.generator.forBlock['arduino_no_tone'] = function(block, generator) {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '8';
            return 'noTone(' + pin + ');\n';
        };

        // ===== Математика =====
        this.generator.forBlock['arduino_map'] = function(block, generator) {
            const value = generator.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_NONE) || '0';
            const fromLow = generator.valueToCode(block, 'FROM_LOW', Blockly.Arduino.ORDER_NONE) || '0';
            const fromHigh = generator.valueToCode(block, 'FROM_HIGH', Blockly.Arduino.ORDER_NONE) || '1023';
            const toLow = generator.valueToCode(block, 'TO_LOW', Blockly.Arduino.ORDER_NONE) || '0';
            const toHigh = generator.valueToCode(block, 'TO_HIGH', Blockly.Arduino.ORDER_NONE) || '255';
            
            const code = 'map(' + value + ', ' + fromLow + ', ' + fromHigh + ', ' + toLow + ', ' + toHigh + ')';
            return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        this.generator.forBlock['arduino_constrain'] = function(block, generator) {
            const value = generator.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_NONE) || '0';
            const min = generator.valueToCode(block, 'MIN', Blockly.Arduino.ORDER_NONE) || '0';
            const max = generator.valueToCode(block, 'MAX', Blockly.Arduino.ORDER_NONE) || '255';
            
            const code = 'constrain(' + value + ', ' + min + ', ' + max + ')';
            return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        this.generator.forBlock['arduino_random'] = function(block, generator) {
            const min = generator.valueToCode(block, 'MIN', Blockly.Arduino.ORDER_NONE) || '0';
            const max = generator.valueToCode(block, 'MAX', Blockly.Arduino.ORDER_NONE) || '100';
            
            const code = 'random(' + min + ', ' + max + ')';
            return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        // ===== Сенсоры =====
        this.generator.forBlock['sensor_dht_read'] = function(block, generator) {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '2';
            const type = block.getFieldValue('TYPE') || 'DHT11';
            const param = block.getFieldValue('PARAM') || 'temperature';
            
            self.addInclude('#include <DHT.h>');
            self.addGlobalDeclaration('DHT dht_' + pin.replace(/\W/g, '_') + '(' + pin + ', ' + type + ');');
            self.addSetupCode('dht_' + pin.replace(/\W/g, '_') + '.begin();');
            
            let method;
            if (param === 'temperature') method = 'readTemperature';
            else if (param === 'humidity') method = 'readHumidity';
            else method = 'readTemperature';
            
            const code = 'dht_' + pin.replace(/\W/g, '_') + '.' + method + '()';
            return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        this.generator.forBlock['sensor_ultrasonic'] = function(block, generator) {
            const trig = generator.valueToCode(block, 'TRIG', Blockly.Arduino.ORDER_ATOMIC) || '9';
            const echo = generator.valueToCode(block, 'ECHO', Blockly.Arduino.ORDER_ATOMIC) || '10';
            
            self.addGlobalDeclaration(
                'long readUltrasonicDistance(int trigPin, int echoPin) {\n' +
                '  digitalWrite(trigPin, LOW);\n' +
                '  delayMicroseconds(2);\n' +
                '  digitalWrite(trigPin, HIGH);\n' +
                '  delayMicroseconds(10);\n' +
                '  digitalWrite(trigPin, LOW);\n' +
                '  long duration = pulseIn(echoPin, HIGH);\n' +
                '  return duration * 0.034 / 2;\n' +
                '}'
            );
            
            self.addSetupCode('pinMode(' + trig + ', OUTPUT);');
            self.addSetupCode('pinMode(' + echo + ', INPUT);');
            
            const code = 'readUltrasonicDistance(' + trig + ', ' + echo + ')';
            return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        this.generator.forBlock['sensor_pir'] = function(block, generator) {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '7';
            self.addSetupCode('pinMode(' + pin + ', INPUT);');
            
            const code = 'digitalRead(' + pin + ')';
            return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        this.generator.forBlock['sensor_ldr'] = function(block, generator) {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 'A0';
            const code = 'analogRead(' + pin + ')';
            return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
        };

        // ===== Устройства =====
        this.generator.forBlock['actuator_servo_attach'] = function(block, generator) {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '9';
            const pinClean = pin.replace(/\W/g, '_');
            
            self.addInclude('#include <Servo.h>');
            self.addGlobalDeclaration('Servo servo_' + pinClean + ';');
            
            return 'servo_' + pinClean + '.attach(' + pin + ');\n';
        };

        this.generator.forBlock['actuator_servo'] = function(block, generator) {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '9';
            const angle = generator.valueToCode(block, 'ANGLE', Blockly.Arduino.ORDER_ATOMIC) || '90';
            const pinClean = pin.replace(/\W/g, '_');
            
            // Проверяем, добавлены ли уже объявления
            if (!self.globalDeclarations.some(d => d.includes('Servo servo_' + pinClean))) {
                self.addInclude('#include <Servo.h>');
                self.addGlobalDeclaration('Servo servo_' + pinClean + ';');
                self.addSetupCode('servo_' + pinClean + '.attach(' + pin + ');');
            }
            
            return 'servo_' + pinClean + '.write(' + angle + ');\n';
        };

        this.generator.forBlock['output_led'] = function(block, generator) {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 'LED_BUILTIN';
            const state = block.getFieldValue('STATE') || 'HIGH';
            
            self.addSetupCode('pinMode(' + pin + ', OUTPUT);');
            return 'digitalWrite(' + pin + ', ' + state + ');\n';
        };

        this.generator.forBlock['output_rgb_led'] = function(block, generator) {
            const redPin = generator.valueToCode(block, 'RED', Blockly.Arduino.ORDER_ATOMIC) || '9';
            const greenPin = generator.valueToCode(block, 'GREEN', Blockly.Arduino.ORDER_ATOMIC) || '10';
            const bluePin = generator.valueToCode(block, 'BLUE', Blockly.Arduino.ORDER_ATOMIC) || '11';
            const red = generator.valueToCode(block, 'RED_VAL', Blockly.Arduino.ORDER_ATOMIC) || '0';
            const green = generator.valueToCode(block, 'GREEN_VAL', Blockly.Arduino.ORDER_ATOMIC) || '0';
            const blue = generator.valueToCode(block, 'BLUE_VAL', Blockly.Arduino.ORDER_ATOMIC) || '0';
            
            self.addSetupCode('pinMode(' + redPin + ', OUTPUT);');
            self.addSetupCode('pinMode(' + greenPin + ', OUTPUT);');
            self.addSetupCode('pinMode(' + bluePin + ', OUTPUT);');
            
            return 'analogWrite(' + redPin + ', ' + red + ');\n' +
                   'analogWrite(' + greenPin + ', ' + green + ');\n' +
                   'analogWrite(' + bluePin + ', ' + blue + ');\n';
        };

        this.generator.forBlock['output_buzzer'] = function(block, generator) {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '8';
            const frequency = generator.valueToCode(block, 'FREQUENCY', Blockly.Arduino.ORDER_ATOMIC) || '440';
            const duration = generator.valueToCode(block, 'DURATION', Blockly.Arduino.ORDER_ATOMIC) || '500';
            
            self.addSetupCode('pinMode(' + pin + ', OUTPUT);');
            
            return 'tone(' + pin + ', ' + frequency + ', ' + duration + ');\n' +
                   'delay(' + duration + ');\n' +
                   'noTone(' + pin + ');\n';
        };

        this.generator.forBlock['output_relay'] = function(block, generator) {
            const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '4';
            const state = block.getFieldValue('STATE') || 'LOW';
            
            self.addSetupCode('pinMode(' + pin + ', OUTPUT);');
            return 'digitalWrite(' + pin + ', ' + state + ');\n';
        };

        // ===== Пользовательские блоки =====
        blocksManager.customBlocks.forEach(function(customBlock) {
            self.generator.forBlock[customBlock.id] = function(block, generator) {
                let code = customBlock.code;
                
                const pin = generator.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC);
                if (pin && pin !== 'undefined') {
                    code = code.replace(/\{\{pin\}\}/g, pin);
                } else {
                    code = code.replace(/\{\{pin\}\}/g, '0');
                }
                
                const value = generator.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ATOMIC);
                if (value && value !== 'undefined') {
                    code = code.replace(/\{\{value\}\}/g, value);
                } else {
                    code = code.replace(/\{\{value\}\}/g, '0');
                }
                
                if (customBlock.type === 'statement') {
                    return code + '\n';
                } else {
                    return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
                }
            };
        });
    }

    // Вспомогательные методы
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

    collectIncludes() {
        return Array.from(this.includes).join('\n');
    }

    collectGlobalDeclarations() {
        return this.globalDeclarations.join('\n');
    }

    collectSetupCode() {
        return this.setupCode.join('\n');
    }

    // Основной метод генерации кода
    generate(workspace) {
        this.clear();
        
        try {
            let code = this.generator.workspaceToCode(workspace);
            
            // Если есть блок setup_loop, код уже готов
            if (code.includes('void setup()') && code.includes('void loop()')) {
                return this.cleanCode(code);
            }
            
            // Иначе оборачиваем в стандартную структуру
            let fullCode = '';
            fullCode += boardsManager.generateHeader();
            fullCode += '\n';
            
            const includes = this.collectIncludes();
            if (includes) {
                fullCode += includes + '\n\n';
            }
            
            const globals = this.collectGlobalDeclarations();
            if (globals) {
                fullCode += globals + '\n\n';
            }
            
            fullCode += 'void setup() {\n';
            const setupLines = this.collectSetupCode();
            if (setupLines.trim()) {
                fullCode += setupLines.split('\n').map(l => '  ' + l).join('\n') + '\n';
            } else {
                fullCode += '  // Инициализация\n';
            }
            fullCode += '}\n\n';
            
            fullCode += 'void loop() {\n';
            if (code.trim()) {
                fullCode += code.trim().split('\n').map(l => '  ' + l).join('\n') + '\n';
            } else {
                fullCode += '  // Основной цикл\n';
            }
            fullCode += '}\n';
            
            return this.cleanCode(fullCode);
        } catch (error) {
            console.error('Ошибка генерации:', error);
            throw new Error('Ошибка генерации кода: ' + error.message);
        }
    }

    cleanCode(code) {
        // Убираем множественные пустые строки
        code = code.replace(/\n{3,}/g, '\n\n');
        // Убираем пробелы в конце строк
        code = code.replace(/[ \t]+$/gm, '');
        // Гарантируем финальный перенос строки
        if (!code.endsWith('\n')) code += '\n';
        return code;
    }

    // Валидация кода
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
                message: 'Несоответствие скобок: открыто ' + openBraces + ', закрыто ' + closeBraces
            });
        }
        
        if (!code.includes('pinMode') && (code.includes('digitalWrite') || code.includes('analogWrite'))) {
            issues.push({ 
                type: 'warning', 
                message: 'Используются функции вывода без предварительной настройки pinMode()'
            });
        }
        
        return issues;
    }
}

const arduinoGenerator = new ArduinoGenerator();