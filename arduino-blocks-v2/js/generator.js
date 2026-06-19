// generator.js - Полный генератор Arduino C++ (исправленная версия)

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
		this.generator.INDENT = '  ';
		
		// ===== ВАЖНО: Определяем ВСЕ порядки операций =====
		this.generator.ORDER_ATOMIC = 0;           // 0 "" ...
		this.generator.ORDER_COLLECTION = 1;       // for array/object literals
		this.generator.ORDER_FUNCTION_CALL = 2;    // foo()
		this.generator.ORDER_MEMBER = 2.1;         // x.y
		this.generator.ORDER_NEW = 2.2;            // new Foo()
		this.generator.ORDER_UNARY_POSTFIX = 3;    // x++
		this.generator.ORDER_UNARY_PREFIX = 4;     // ++x
		this.generator.ORDER_UNARY_NEGATION = 4.1; // -x
		this.generator.ORDER_UNARY_LOGICAL = 4.2;  // !x
		this.generator.ORDER_MULTIPLICATIVE = 5;   // * / %
		this.generator.ORDER_ADDITIVE = 6;         // + -
		this.generator.ORDER_SHIFT = 7;            // << >>
		this.generator.ORDER_RELATIONAL = 8;       // < <= > >=
		this.generator.ORDER_EQUALITY = 9;         // == !=
		this.generator.ORDER_BITWISE_AND = 10;     // &
		this.generator.ORDER_BITWISE_XOR = 11;     // ^
		this.generator.ORDER_BITWISE_OR = 12;      // |
		this.generator.ORDER_LOGICAL_AND = 13;     // &&
		this.generator.ORDER_LOGICAL_OR = 14;      // ||
		this.generator.ORDER_CONDITIONAL = 15;     // ?:
		this.generator.ORDER_ASSIGNMENT = 16;      // = += -= etc.
		this.generator.ORDER_COMMA = 17;           // ,
		this.generator.ORDER_NONE = 99;            // (...)
		
		// Резервные слова Arduino
		this.generator.RESERVED_WORDS_ = 
			'setup,loop,if,else,for,while,return,void,int,float,long,char,String,' +
			'bool,boolean,byte,const,static,unsigned,volatile,HIGH,LOW,INPUT,OUTPUT,' +
			'INPUT_PULLUP,true,false,NULL,serial,Serial,pinMode,digitalWrite,' +
			'digitalRead,analogWrite,analogRead,delay,delayMicroseconds,millis,' +
			'micros,begin,print,println,read,available,tone,noTone,map,constrain,' +
			'random,abs,sin,cos,tan,sqrt,pow,round,ceil,floor';
		
		// Инициализируем nameDB_
		this.generator.nameDB_ = new Blockly.Names(this.generator.RESERVED_WORDS_);
		
		// Метод для получения имени переменной
		this.generator.getVariableName = function(name) {
			return this.nameDB_.getName(name, Blockly.Names.NameType.VARIABLE);
		};
		
		// Метод для получения имени процедуры
		this.generator.getProcedureName = function(name) {
			return this.nameDB_.getName(name, Blockly.Names.NameType.PROCEDURE);
		};
		
		// ===== КРИТИЧЕСКИ ВАЖНО: Инициализация функций =====
		this.generator.init = function(workspace) {
			if (!this.nameDB_) {
				this.nameDB_ = new Blockly.Names(this.RESERVED_WORDS_ || '');
			}
			if (!this.forBlock) {
				this.forBlock = {};
			}
		};
		
		// ===== Функция очистки пробелов =====
		this.generator.scrub_ = function(block, code, opt_thisOnly) {
			const nextBlock = block.getNextBlock();
			if (nextBlock && !opt_thisOnly) {
				const nextCode = this.blockToCode(nextBlock);
				return code + '\n' + nextCode;
			}
			return code;
		};
		
		// ===== Функция для statement блоков =====
		this.generator.scrubNakedValue = function(line) {
			return line + ';\n';
		};
		
		this.initForBlockGenerators();
	}

    initForBlockGenerators() {
        const self = this;
        const Arduino = this.generator;

        // ===== ВСЕ ГЕНЕРАТОРЫ БЛОКОВ =====
        
        // Программа Arduino
        Arduino.forBlock['arduino_setup_loop'] = function(block, generator) {
            self.clear();
            
            const setupCode = getAllBlocksInStatement(block, 'SETUP', generator);
            const loopCode = getAllBlocksInStatement(block, 'LOOP', generator);
            
            let fullCode = boardsManager.generateHeader() + '\n';
            
            const includes = self.collectIncludes();
            if (includes) fullCode += includes + '\n\n';
            
            const globals = self.collectGlobalDeclarations();
            if (globals) fullCode += globals + '\n\n';
            
            fullCode += 'void setup() {\n';
            const setupAll = (self.collectSetupCode() + '\n' + setupCode).trim();
            if (setupAll) {
                setupAll.split('\n').filter(l => l.trim()).forEach(l => {
                    fullCode += '  ' + l.trim() + '\n';
                });
            } else {
                fullCode += '  // Инициализация\n';
            }
            fullCode += '}\n\n';
            
            fullCode += 'void loop() {\n';
            if (loopCode.trim()) {
                loopCode.split('\n').filter(l => l.trim()).forEach(l => {
                    fullCode += '  ' + l.trim() + '\n';
                });
            } else {
                fullCode += '  // Основной цикл\n';
            }
            fullCode += '}\n';
            
            return fullCode;
        };

        // ===== УПРАВЛЕНИЕ =====
        Arduino.forBlock['controls_if'] = function(block, generator) {
            let code = '';
            let n = 0;
            let condition = generator.valueToCode(block, 'IF' + n, Arduino.ORDER_NONE) || 'false';
            let branch = generator.statementToCode(block, 'DO' + n);
            code = 'if (' + condition + ') {\n' + branch + '}';
            
            for (n = 1; n <= block.elseifCount_; n++) {
                condition = generator.valueToCode(block, 'IF' + n, Arduino.ORDER_NONE) || 'false';
                branch = generator.statementToCode(block, 'DO' + n);
                code += ' else if (' + condition + ') {\n' + branch + '}';
            }
            
            if (block.elseCount_) {
                branch = generator.statementToCode(block, 'ELSE');
                code += ' else {\n' + branch + '}';
            }
            
            return code + '\n';
        };

        Arduino.forBlock['controls_ifelse'] = function(block, generator) {
            const condition = generator.valueToCode(block, 'IF0', Arduino.ORDER_NONE) || 'false';
            const branch1 = generator.statementToCode(block, 'DO0');
            const branch2 = generator.statementToCode(block, 'ELSE');
            return 'if (' + condition + ') {\n' + branch1 + '} else {\n' + branch2 + '}\n';
        };

        Arduino.forBlock['controls_repeat_ext'] = function(block, generator) {
            const times = generator.valueToCode(block, 'TIMES', Arduino.ORDER_NONE) || '0';
            const branch = generator.statementToCode(block, 'DO');
            return 'for (int _i = 0; _i < ' + times + '; _i++) {\n' + branch + '}\n';
        };

        Arduino.forBlock['controls_whileUntil'] = function(block, generator) {
            const mode = block.getFieldValue('MODE');
            const condition = generator.valueToCode(block, 'BOOL', Arduino.ORDER_NONE) || 'false';
            const branch = generator.statementToCode(block, 'DO');
            
            if (mode === 'UNTIL') {
                return 'while (!(' + condition + ')) {\n' + branch + '}\n';
            }
            return 'while (' + condition + ') {\n' + branch + '}\n';
        };

        Arduino.forBlock['controls_for'] = function(block, generator) {
            const varName = generator.getVariableName(block.getFieldValue('VAR'));
            const from = generator.valueToCode(block, 'FROM', Arduino.ORDER_NONE) || '0';
            const to = generator.valueToCode(block, 'TO', Arduino.ORDER_NONE) || '0';
            const step = generator.valueToCode(block, 'BY', Arduino.ORDER_NONE) || '1';
            const branch = generator.statementToCode(block, 'DO');
            
            return 'for (int ' + varName + ' = ' + from + '; ' +
                   varName + ' <= ' + to + '; ' + varName + ' += ' + step + ') {\n' +
                   branch + '}\n';
        };

        Arduino.forBlock['controls_flow_statements'] = function(block) {
            const flow = block.getFieldValue('FLOW');
            return flow.toLowerCase() + ';\n';
        };

        // ===== ЛОГИКА =====
        Arduino.forBlock['logic_compare'] = function(block, generator) {
            const op = block.getFieldValue('OP');
            const a = generator.valueToCode(block, 'A', Arduino.ORDER_NONE) || '0';
            const b = generator.valueToCode(block, 'B', Arduino.ORDER_NONE) || '0';
            
            const operators = { 'EQ': '==', 'NEQ': '!=', 'LT': '<', 'LTE': '<=', 'GT': '>', 'GTE': '>=' };
            const code = a + ' ' + (operators[op] || '==') + ' ' + b;
            return [code, Arduino.ORDER_RELATIONAL];
        };

        Arduino.forBlock['logic_operation'] = function(block, generator) {
            const op = block.getFieldValue('OP');
            const a = generator.valueToCode(block, 'A', Arduino.ORDER_NONE) || 'false';
            const b = generator.valueToCode(block, 'B', Arduino.ORDER_NONE) || 'false';
            const operator = (op === 'AND') ? '&&' : '||';
            return [a + ' ' + operator + ' ' + b, Arduino.ORDER_LOGICAL_AND];
        };

        Arduino.forBlock['logic_negate'] = function(block, generator) {
            const value = generator.valueToCode(block, 'BOOL', Arduino.ORDER_NONE) || 'false';
            return ['!' + value, Arduino.ORDER_LOGICAL_NOT];
        };

        Arduino.forBlock['logic_boolean'] = function(block) {
            return [block.getFieldValue('BOOL').toLowerCase(), Arduino.ORDER_ATOMIC];
        };

        Arduino.forBlock['logic_null'] = function() {
            return ['NULL', Arduino.ORDER_ATOMIC];
        };

        // ===== МАТЕМАТИКА =====
        Arduino.forBlock['math_number'] = function(block) {
            const num = block.getFieldValue('NUM');
            return [num || '0', Arduino.ORDER_ATOMIC];
        };

        Arduino.forBlock['math_arithmetic'] = function(block, generator) {
            const op = block.getFieldValue('OP');
            const a = generator.valueToCode(block, 'A', Arduino.ORDER_NONE) || '0';
            const b = generator.valueToCode(block, 'B', Arduino.ORDER_NONE) || '0';
            
            const operators = { 'ADD': '+', 'MINUS': '-', 'MULTIPLY': '*', 'DIVIDE': '/', 'POWER': '^' };
            const operator = operators[op] || '+';
            
            if (operator === '^') {
                return ['pow(' + a + ', ' + b + ')', Arduino.ORDER_FUNCTION_CALL];
            }
            
            const code = a + ' ' + operator + ' ' + b;
            const order = (operator === '+' || operator === '-') ? Arduino.ORDER_ADDITIVE : Arduino.ORDER_MULTIPLICATIVE;
            return [code, order];
        };

        Arduino.forBlock['math_single'] = function(block, generator) {
            const op = block.getFieldValue('OP');
            const value = generator.valueToCode(block, 'NUM', Arduino.ORDER_NONE) || '0';
            
            const functions = { 'ROOT': 'sqrt', 'ABS': 'abs', 'NEG': '-', 'LN': 'log', 'LOG10': 'log10' };
            const func = functions[op] || 'abs';
            
            if (func === '-') return ['-' + value, Arduino.ORDER_UNARY_NEGATION];
            return [func + '(' + value + ')', Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['math_constant'] = function(block) {
            const constants = { 'PI': 'PI', 'E': '2.71828', 'GOLDEN_RATIO': '1.61803', 'SQRT2': '1.41421' };
            return [constants[block.getFieldValue('CONSTANT')] || '0', Arduino.ORDER_ATOMIC];
        };

        Arduino.forBlock['math_round'] = function(block, generator) {
            const op = block.getFieldValue('OP');
            const num = generator.valueToCode(block, 'NUM', Arduino.ORDER_NONE) || '0';
            const funcs = { 'ROUND': 'round', 'ROUNDUP': 'ceil', 'ROUNDDOWN': 'floor' };
            return [(funcs[op] || 'round') + '(' + num + ')', Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['math_modulo'] = function(block, generator) {
            const a = generator.valueToCode(block, 'DIVIDEND', Arduino.ORDER_NONE) || '0';
            const b = generator.valueToCode(block, 'DIVISOR', Arduino.ORDER_NONE) || '1';
            return [a + ' % ' + b, Arduino.ORDER_MULTIPLICATIVE];
        };

        // ===== ВАЖНО: math_change =====
        Arduino.forBlock['math_change'] = function(block, generator) {
            const varName = generator.getVariableName(block.getFieldValue('VAR'));
            const delta = generator.valueToCode(block, 'DELTA', Arduino.ORDER_NONE) || '1';
            return varName + ' += ' + delta + ';\n';
        };

        // ===== ПЕРЕМЕННЫЕ =====
        Arduino.forBlock['variables_get'] = function(block, generator) {
            const varName = generator.getVariableName(block.getFieldValue('VAR'));
            return [varName, Arduino.ORDER_ATOMIC];
        };

        Arduino.forBlock['variables_set'] = function(block, generator) {
            const varName = generator.getVariableName(block.getFieldValue('VAR'));
            const value = generator.valueToCode(block, 'VALUE', Arduino.ORDER_NONE) || '0';
            return varName + ' = ' + value + ';\n';
        };

        // ===== ТЕКСТ =====
        Arduino.forBlock['text'] = function(block) {
            const text = block.getFieldValue('TEXT') || '';
            return ['String("' + text.replace(/"/g, '\\"') + '")', Arduino.ORDER_ATOMIC];
        };

        Arduino.forBlock['text_join'] = function(block, generator) {
            let parts = [];
            for (let n = 0; n < block.itemCount_; n++) {
                parts.push(generator.valueToCode(block, 'ADD' + n, Arduino.ORDER_NONE) || '""');
            }
            return ['String(' + parts.join(' + ') + ')', Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['text_append'] = function(block, generator) {
            const varName = generator.getVariableName(block.getFieldValue('VAR'));
            const text = generator.valueToCode(block, 'TEXT', Arduino.ORDER_NONE) || '""';
            return varName + ' += ' + text + ';\n';
        };

        Arduino.forBlock['text_length'] = function(block, generator) {
            const text = generator.valueToCode(block, 'VALUE', Arduino.ORDER_NONE) || '""';
            return [text + '.length()', Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['text_isEmpty'] = function(block, generator) {
            const text = generator.valueToCode(block, 'VALUE', Arduino.ORDER_NONE) || '""';
            return [text + '.length() == 0', Arduino.ORDER_RELATIONAL];
        };

        Arduino.forBlock['text_indexOf'] = function(block, generator) {
            const op = block.getFieldValue('END') === 'FIRST' ? 'indexOf' : 'lastIndexOf';
            const text = generator.valueToCode(block, 'VALUE', Arduino.ORDER_NONE) || '""';
            const search = generator.valueToCode(block, 'FIND', Arduino.ORDER_NONE) || '""';
            return [text + '.' + op + '(' + search + ')', Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['text_charAt'] = function(block, generator) {
            const text = generator.valueToCode(block, 'VALUE', Arduino.ORDER_NONE) || '""';
            const where = block.getFieldValue('WHERE');
            
            if (where === 'FIRST') return [text + '.charAt(0)', Arduino.ORDER_FUNCTION_CALL];
            if (where === 'LAST') return [text + '.charAt(' + text + '.length() - 1)', Arduino.ORDER_FUNCTION_CALL];
            if (where === 'FROM_START') {
                const at = generator.valueToCode(block, 'AT', Arduino.ORDER_NONE) || '0';
                return [text + '.charAt(' + at + ')', Arduino.ORDER_FUNCTION_CALL];
            }
            if (where === 'FROM_END') {
                const at = generator.valueToCode(block, 'AT', Arduino.ORDER_NONE) || '0';
                return [text + '.charAt(' + text + '.length() - 1 - ' + at + ')', Arduino.ORDER_FUNCTION_CALL];
            }
            return [text + '.charAt(random(' + text + '.length()))', Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['text_changeCase'] = function(block, generator) {
            const op = block.getFieldValue('CASE');
            const text = generator.valueToCode(block, 'TEXT', Arduino.ORDER_NONE) || '""';
            if (op === 'UPPERCASE') return [text + '; ' + text + '.toUpperCase()', Arduino.ORDER_FUNCTION_CALL];
            if (op === 'LOWERCASE') return [text + '; ' + text + '.toLowerCase()', Arduino.ORDER_FUNCTION_CALL];
            return [text, Arduino.ORDER_ATOMIC];
        };

        Arduino.forBlock['text_trim'] = function(block, generator) {
            const text = generator.valueToCode(block, 'TEXT', Arduino.ORDER_NONE) || '""';
            return [text + '; ' + text + '.trim()', Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['text_print'] = function(block, generator) {
            const text = generator.valueToCode(block, 'TEXT', Arduino.ORDER_NONE) || '""';
            return 'Serial.println(' + text + ');\n';
        };

        // ===== ПРОЦЕДУРЫ =====
        Arduino.forBlock['procedures_defnoreturn'] = function(block, generator) {
            const funcName = generator.getProcedureName(block.getFieldValue('NAME'));
            const branch = generator.statementToCode(block, 'STACK');
            const code = 'void ' + funcName + '() {\n' + branch + '}\n';
            self.addGlobalDeclaration(code);
            return '';
        };

        Arduino.forBlock['procedures_defreturn'] = function(block, generator) {
            const funcName = generator.getProcedureName(block.getFieldValue('NAME'));
            const branch = generator.statementToCode(block, 'STACK');
            const returnValue = generator.valueToCode(block, 'RETURN', Arduino.ORDER_NONE) || '0';
            const code = 'int ' + funcName + '() {\n' + branch + '  return ' + returnValue + ';\n}\n';
            self.addGlobalDeclaration(code);
            return '';
        };

        Arduino.forBlock['procedures_callnoreturn'] = function(block, generator) {
            return generator.getProcedureName(block.getFieldValue('NAME')) + '();\n';
        };

        Arduino.forBlock['procedures_callreturn'] = function(block, generator) {
            return [generator.getProcedureName(block.getFieldValue('NAME')) + '()', Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['procedures_ifreturn'] = function(block, generator) {
            const condition = generator.valueToCode(block, 'CONDITION', Arduino.ORDER_NONE) || 'false';
            const value = generator.valueToCode(block, 'VALUE', Arduino.ORDER_NONE) || '0';
            return 'if (' + condition + ') {\n  return ' + value + ';\n}\n';
        };

        // ===== ARDUINO БЛОКИ =====
        Arduino.forBlock['arduino_pin_mode'] = function(block) {
            return 'pinMode(' + (block.getFieldValue('PIN') || '13') + ', ' + (block.getFieldValue('MODE') || 'OUTPUT') + ');\n';
        };

        Arduino.forBlock['arduino_digital_write'] = function(block) {
            return 'digitalWrite(' + (block.getFieldValue('PIN') || '13') + ', ' + (block.getFieldValue('VALUE') || 'HIGH') + ');\n';
        };

        Arduino.forBlock['arduino_digital_read'] = function(block) {
            return ['digitalRead(' + (block.getFieldValue('PIN') || '2') + ')', Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['arduino_analog_write'] = function(block) {
            return 'analogWrite(' + (block.getFieldValue('PIN') || '9') + ', ' + (block.getFieldValue('VALUE') || '128') + ');\n';
        };

        Arduino.forBlock['arduino_analog_read'] = function(block) {
            return ['analogRead(' + (block.getFieldValue('PIN') || 'A0') + ')', Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['arduino_delay'] = function(block) {
            return 'delay(' + (block.getFieldValue('TIME') || '1000') + ');\n';
        };

        Arduino.forBlock['arduino_delay_microseconds'] = function(block) {
            return 'delayMicroseconds(' + (block.getFieldValue('TIME') || '100') + ');\n';
        };

        Arduino.forBlock['arduino_millis'] = function() {
            return ['millis()', Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['arduino_micros'] = function() {
            return ['micros()', Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['arduino_serial_begin'] = function(block) {
            return 'Serial.begin(' + (block.getFieldValue('SPEED') || '9600') + ');\n';
        };

        Arduino.forBlock['arduino_serial_print'] = function(block) {
            return 'Serial.print(' + (block.getFieldValue('TEXT') || '""') + ');\n';
        };

        Arduino.forBlock['arduino_serial_println'] = function(block) {
            return 'Serial.println(' + (block.getFieldValue('TEXT') || '""') + ');\n';
        };

        Arduino.forBlock['arduino_serial_read'] = function() {
            return ['Serial.read()', Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['arduino_serial_available'] = function() {
            return ['Serial.available()', Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['arduino_tone'] = function(block) {
            return 'tone(' + (block.getFieldValue('PIN') || '8') + ', ' + (block.getFieldValue('FREQUENCY') || '440') + ');\n';
        };

        Arduino.forBlock['arduino_no_tone'] = function(block) {
            return 'noTone(' + (block.getFieldValue('PIN') || '8') + ');\n';
        };

        Arduino.forBlock['arduino_map'] = function(block) {
            const code = 'map(' +
                (block.getFieldValue('VALUE') || '0') + ', ' +
                (block.getFieldValue('FROM_LOW') || '0') + ', ' +
                (block.getFieldValue('FROM_HIGH') || '1023') + ', ' +
                (block.getFieldValue('TO_LOW') || '0') + ', ' +
                (block.getFieldValue('TO_HIGH') || '255') + ')';
            return [code, Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['arduino_constrain'] = function(block) {
            const code = 'constrain(' +
                (block.getFieldValue('VALUE') || '0') + ', ' +
                (block.getFieldValue('MIN') || '0') + ', ' +
                (block.getFieldValue('MAX') || '255') + ')';
            return [code, Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['arduino_random'] = function(block) {
            const code = 'random(' +
                (block.getFieldValue('MIN') || '0') + ', ' +
                (block.getFieldValue('MAX') || '100') + ')';
            return [code, Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['sensor_dht_read'] = function(block) {
            const pin = block.getFieldValue('PIN') || '2';
            const type = block.getFieldValue('TYPE') || 'DHT11';
            const param = block.getFieldValue('PARAM') || 'temperature';
            
            self.addInclude('#include <DHT.h>');
            self.addGlobalDeclaration('DHT dht' + pin + '(' + pin + ', ' + type + ');');
            self.addSetupCode('dht' + pin + '.begin();');
            
            const method = (param === 'humidity') ? 'readHumidity' : 'readTemperature';
            return ['dht' + pin + '.' + method + '()', Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['sensor_ultrasonic'] = function(block) {
            const trig = block.getFieldValue('TRIG') || '9';
            const echo = block.getFieldValue('ECHO') || '10';
            
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
            
            return ['readUltrasonicDistance(' + trig + ', ' + echo + ')', Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['sensor_pir'] = function(block) {
            const pin = block.getFieldValue('PIN') || '7';
            self.addSetupCode('pinMode(' + pin + ', INPUT);');
            return ['digitalRead(' + pin + ')', Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['sensor_ldr'] = function(block) {
            return ['analogRead(' + (block.getFieldValue('PIN') || 'A0') + ')', Arduino.ORDER_FUNCTION_CALL];
        };

        Arduino.forBlock['actuator_servo_attach'] = function(block) {
            const pin = block.getFieldValue('PIN') || '9';
            self.addInclude('#include <Servo.h>');
            self.addGlobalDeclaration('Servo servo' + pin + ';');
            return 'servo' + pin + '.attach(' + pin + ');\n';
        };

        Arduino.forBlock['actuator_servo'] = function(block) {
            const pin = block.getFieldValue('PIN') || '9';
            const angle = block.getFieldValue('ANGLE') || '90';
            
            if (!self.globalDeclarations.some(d => d.includes('Servo servo' + pin))) {
                self.addInclude('#include <Servo.h>');
                self.addGlobalDeclaration('Servo servo' + pin + ';');
                self.addSetupCode('servo' + pin + '.attach(' + pin + ');');
            }
            
            return 'servo' + pin + '.write(' + angle + ');\n';
        };

        Arduino.forBlock['output_led'] = function(block) {
            const pin = block.getFieldValue('PIN') || '13';
            self.addSetupCode('pinMode(' + pin + ', OUTPUT);');
            return 'digitalWrite(' + pin + ', ' + (block.getFieldValue('STATE') || 'HIGH') + ');\n';
        };

        Arduino.forBlock['output_rgb_led'] = function(block) {
            const r = block.getFieldValue('RED') || '9';
            const g = block.getFieldValue('GREEN') || '10';
            const b = block.getFieldValue('BLUE') || '11';
            
            self.addSetupCode('pinMode(' + r + ', OUTPUT);');
            self.addSetupCode('pinMode(' + g + ', OUTPUT);');
            self.addSetupCode('pinMode(' + b + ', OUTPUT);');
            
            return 'analogWrite(' + r + ', ' + (block.getFieldValue('RED_VAL') || '255') + ');\n' +
                   'analogWrite(' + g + ', ' + (block.getFieldValue('GREEN_VAL') || '0') + ');\n' +
                   'analogWrite(' + b + ', ' + (block.getFieldValue('BLUE_VAL') || '0') + ');\n';
        };

        Arduino.forBlock['output_buzzer'] = function(block) {
            const pin = block.getFieldValue('PIN') || '8';
            const freq = block.getFieldValue('FREQUENCY') || '440';
            const dur = block.getFieldValue('DURATION') || '500';
            
            self.addSetupCode('pinMode(' + pin + ', OUTPUT);');
            return 'tone(' + pin + ', ' + freq + ', ' + dur + ');\n' +
                   'delay(' + dur + ');\n' +
                   'noTone(' + pin + ');\n';
        };

        Arduino.forBlock['output_relay'] = function(block) {
            const pin = block.getFieldValue('PIN') || '4';
            self.addSetupCode('pinMode(' + pin + ', OUTPUT);');
            return 'digitalWrite(' + pin + ', ' + (block.getFieldValue('STATE') || 'LOW') + ');\n';
        };

        // Пользовательские блоки
        blocksManager.customBlocks.forEach(function(cb) {
            Arduino.forBlock[cb.id] = function(block) {
                let code = cb.code;
                code = code.replace(/\{\{pin\}\}/g, block.getFieldValue('PIN') || '0');
                code = code.replace(/\{\{value\}\}/g, block.getFieldValue('VALUE') || '0');
                return cb.type === 'statement' ? code + '\n' : [code, Arduino.ORDER_FUNCTION_CALL];
            };
        });
    }

    // ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====
    clear() {
        this.includes.clear();
        this.globalDeclarations = [];
        this.setupCode = [];
    }

    addInclude(inc) { this.includes.add(inc); }
    
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
    
    collectIncludes() { return Array.from(this.includes).join('\n'); }
    collectGlobalDeclarations() { return this.globalDeclarations.join('\n'); }
    collectSetupCode() { return this.setupCode.join('\n'); }

    // ===== ГЛАВНАЯ ГЕНЕРАЦИЯ =====
	generate(workspace) {
		this.clear();
		
		// Сбрасываем базу имён
		if (this.generator.nameDB_ && typeof this.generator.nameDB_.reset === 'function') {
			this.generator.nameDB_.reset();
		}
		
		try {
			// Проверяем что workspace существует
			if (!workspace || !workspace.getAllBlocks) {
				throw new Error('Рабочая область не инициализирована');
			}
			
			// Проверяем наличие блоков
			const allBlocks = workspace.getAllBlocks(false);
			if (allBlocks.length === 0) {
				return '// Нет блоков для генерации\n// Добавьте блоки на рабочую область\n';
			}
			
			let code = this.generator.workspaceToCode(workspace);
			
			if (code.includes('void setup()') && code.includes('void loop()')) {
				return this.cleanCode(code);
			}
			
			if (!code.trim()) {
				code = '  // Код не был сгенерирован\n';
			}
			
			let full = boardsManager.generateHeader() + '\n';
			if (this.collectIncludes()) full += this.collectIncludes() + '\n\n';
			if (this.collectGlobalDeclarations()) full += this.collectGlobalDeclarations() + '\n\n';
			
			full += 'void setup() {\n';
			const s = this.collectSetupCode();
			full += s.trim() ? s.split('\n').filter(l => l.trim()).map(l => '  ' + l.trim()).join('\n') + '\n' : '  // Инициализация\n';
			full += '}\n\nvoid loop() {\n';
			full += code.trim().split('\n').filter(l => l.trim()).map(l => '  ' + l.trim()).join('\n') + '\n}\n';
			
			return this.cleanCode(full);
		} catch (e) {
			console.error('Ошибка генерации:', e);
			
			// Формируем понятное сообщение для пользователя
			let userMessage = 'Ошибка при генерации кода:\n\n';
			userMessage += '• ' + (e.message || 'Неизвестная ошибка') + '\n\n';
			userMessage += 'Возможные причины:\n';
			userMessage += '• Не все блоки заполнены значениями\n';
			userMessage += '• Есть несоединённые блоки\n';
			userMessage += '• Используются несовместимые типы блоков\n\n';
			userMessage += 'Попробуйте:\n';
			userMessage += '1. Проверить все блоки (кликните на пустые поля)\n';
			userMessage += '2. Удалить и заново добавить проблемные блоки\n';
			userMessage += '3. Очистить рабочую область и начать заново';
			
			throw new Error(userMessage);
		}
	}

    cleanCode(code) {
        code = code.replace(/\n{3,}/g, '\n\n');
        code = code.replace(/[ \t]+$/gm, '');
        if (!code.endsWith('\n')) code += '\n';
        return code;
    }

    validate(code) {
        const issues = [];
        if (!code.includes('void setup()')) issues.push({ type: 'error', message: 'Нет setup()' });
        if (!code.includes('void loop()')) issues.push({ type: 'error', message: 'Нет loop()' });
        const ob = (code.match(/\{/g) || []).length;
        const cb = (code.match(/\}/g) || []).length;
        if (ob !== cb) issues.push({ type: 'error', message: `Скобки: {${ob}} {${cb}}` });
        return issues;
    }
}

// ===== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ОБХОДА ЦЕПОЧКИ БЛОКОВ =====
function getAllBlocksInStatement(block, inputName, generator) {
    let code = '';
    let currentBlock = block.getInputTargetBlock(inputName);
    
    while (currentBlock) {
        const blockCode = generator.blockToCode(currentBlock);
        if (blockCode) {
            code += blockCode;
        }
        currentBlock = currentBlock.getNextBlock();
    }
    
    return code;
}

const arduinoGenerator = new ArduinoGenerator();