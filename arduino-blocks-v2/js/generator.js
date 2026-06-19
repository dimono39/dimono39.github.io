// generator.js - Полный генератор Arduino C++ кода (все блоки)

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
        
        // Настройка отступов
        this.generator.INDENT = '  ';
        
        // Порядок операций (как в C++)
        this.generator.ORDER_ATOMIC = 0;      // 0 "" ...
        this.generator.ORDER_NONE = 99;
        
        this.initForBlockGenerators();
    }

    initForBlockGenerators() {
        const self = this;
        const Arduino = this.generator;

        // ==========================================
        // ВСТРОЕННЫЕ БЛОКИ BLOCKLY (управление, логика, математика)
        // ==========================================
        
        // controls_if
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

        // controls_ifelse (упрощенный if-else)
        Arduino.forBlock['controls_ifelse'] = function(block, generator) {
            const condition = generator.valueToCode(block, 'IF0', Arduino.ORDER_NONE) || 'false';
            const branch1 = generator.statementToCode(block, 'DO0');
            const branch2 = generator.statementToCode(block, 'ELSE');
            return 'if (' + condition + ') {\n' + branch1 + '} else {\n' + branch2 + '}\n';
        };

        // controls_repeat_ext (повторить N раз)
        Arduino.forBlock['controls_repeat_ext'] = function(block, generator) {
            const times = generator.valueToCode(block, 'TIMES', Arduino.ORDER_NONE) || '0';
            const branch = generator.statementToCode(block, 'DO');
            return 'for (int _i = 0; _i < ' + times + '; _i++) {\n' + branch + '}\n';
        };

        // controls_whileUntil
        Arduino.forBlock['controls_whileUntil'] = function(block, generator) {
            const mode = block.getFieldValue('MODE');
            const condition = generator.valueToCode(block, 'BOOL', Arduino.ORDER_NONE) || 'false';
            const branch = generator.statementToCode(block, 'DO');
            
            if (mode === 'UNTIL') {
                return 'while (!(' + condition + ')) {\n' + branch + '}\n';
            }
            return 'while (' + condition + ') {\n' + branch + '}\n';
        };

        // controls_for (цикл for)
        Arduino.forBlock['controls_for'] = function(block, generator) {
            const varName = generator.getVariableName(block.getFieldValue('VAR'));
            const from = generator.valueToCode(block, 'FROM', Arduino.ORDER_NONE) || '0';
            const to = generator.valueToCode(block, 'TO', Arduino.ORDER_NONE) || '0';
            const step = generator.valueToCode(block, 'BY', Arduino.ORDER_NONE) || '1';
            const branch = generator.statementToCode(block, 'DO');
            
            let code = 'for (int ' + varName + ' = ' + from + '; ';
            code += varName + ' <= ' + to + '; ';
            code += varName + ' += ' + step + ') {\n';
            code += branch + '}\n';
            
            return code;
        };

        // controls_flow_statements (break/continue)
        Arduino.forBlock['controls_flow_statements'] = function(block) {
            const flow = block.getFieldValue('FLOW');
            return flow.toLowerCase() + ';\n';
        };

        // logic_compare
        Arduino.forBlock['logic_compare'] = function(block, generator) {
            const op = block.getFieldValue('OP');
            const a = generator.valueToCode(block, 'A', Arduino.ORDER_NONE) || '0';
            const b = generator.valueToCode(block, 'B', Arduino.ORDER_NONE) || '0';
            
            const operators = {
                'EQ': '==',
                'NEQ': '!=',
                'LT': '<',
                'LTE': '<=',
                'GT': '>',
                'GTE': '>='
            };
            
            const code = a + ' ' + (operators[op] || '==') + ' ' + b;
            return [code, Arduino.ORDER_RELATIONAL];
        };

        // logic_operation
        Arduino.forBlock['logic_operation'] = function(block, generator) {
            const op = block.getFieldValue('OP');
            const a = generator.valueToCode(block, 'A', Arduino.ORDER_NONE) || 'false';
            const b = generator.valueToCode(block, 'B', Arduino.ORDER_NONE) || 'false';
            
            const operator = (op === 'AND') ? '&&' : '||';
            const code = a + ' ' + operator + ' ' + b;
            return [code, Arduino.ORDER_LOGICAL_AND];
        };

        // logic_negate
        Arduino.forBlock['logic_negate'] = function(block, generator) {
            const value = generator.valueToCode(block, 'BOOL', Arduino.ORDER_NONE) || 'false';
            return ['!' + value, Arduino.ORDER_LOGICAL_NOT];
        };

        // logic_boolean
        Arduino.forBlock['logic_boolean'] = function(block) {
            const value = block.getFieldValue('BOOL');
            return [value.toLowerCase(), Arduino.ORDER_ATOMIC];
        };

        // logic_null
        Arduino.forBlock['logic_null'] = function() {
            return ['NULL', Arduino.ORDER_ATOMIC];
        };

        // logic_ternary
        Arduino.forBlock['logic_ternary'] = function(block, generator) {
            const condition = generator.valueToCode(block, 'IF', Arduino.ORDER_NONE) || 'false';
            const thenVal = generator.valueToCode(block, 'THEN', Arduino.ORDER_NONE) || '0';
            const elseVal = generator.valueToCode(block, 'ELSE', Arduino.ORDER_NONE) || '0';
            return [condition + ' ? ' + thenVal + ' : ' + elseVal, Arduino.ORDER_CONDITIONAL];
        };

        // math_number
        Arduino.forBlock['math_number'] = function(block) {
            const num = block.getFieldValue('NUM');
            if (!num || num === '') return ['0', Arduino.ORDER_ATOMIC];
            return [String(num), Arduino.ORDER_ATOMIC];
        };

        // math_arithmetic
        Arduino.forBlock['math_arithmetic'] = function(block, generator) {
            const op = block.getFieldValue('OP');
            const a = generator.valueToCode(block, 'A', Arduino.ORDER_NONE) || '0';
            const b = generator.valueToCode(block, 'B', Arduino.ORDER_NONE) || '0';
            
            const operators = {
                'ADD': '+',
                'MINUS': '-',
                'MULTIPLY': '*',
                'DIVIDE': '/',
                'POWER': '^'
            };
            
            const operator = operators[op] || '+';
            
            if (operator === '^') {
                return ['pow(' + a + ', ' + b + ')', Arduino.ORDER_FUNCTION_CALL];
            }
            
            const code = a + ' ' + operator + ' ' + b;
            const order = (operator === '+' || operator === '-') 
                ? Arduino.ORDER_ADDITIVE 
                : Arduino.ORDER_MULTIPLICATIVE;
            
            return [code, order];
        };

        // math_single (sqrt, abs, sin, cos и т.д.)
        Arduino.forBlock['math_single'] = function(block, generator) {
            const op = block.getFieldValue('OP');
            const value = generator.valueToCode(block, 'NUM', Arduino.ORDER_NONE) || '0';
            
            const functions = {
                'ROOT': 'sqrt',
                'ABS': 'abs',
                'NEG': '-',
                'LN': 'log',
                'LOG10': 'log10',
                'SIN': 'sin',
                'COS': 'cos',
                'TAN': 'tan'
            };
            
            const func = functions[op] || 'abs';
            
            if (func === '-') {
                return ['-' + value, Arduino.ORDER_UNARY_NEGATION];
            }
            
            return [func + '(' + value + ')', Arduino.ORDER_FUNCTION_CALL];
        };

        // math_constant
        Arduino.forBlock['math_constant'] = function(block) {
            const constants = {
                'PI': 'PI',
                'E': '2.718281828459045',
                'GOLDEN_RATIO': '1.618033988749895',
                'SQRT2': '1.4142135623730951',
                'SQRT1_2': '0.7071067811865476',
                'INFINITY': 'INFINITY'
            };
            const value = constants[block.getFieldValue('CONSTANT')] || '0';
            return [value, Arduino.ORDER_ATOMIC];
        };

        // math_number_property (четное, нечетное и т.д.)
        Arduino.forBlock['math_number_property'] = function(block, generator) {
            const prop = block.getFieldValue('PROPERTY');
            const num = generator.valueToCode(block, 'NUMBER_TO_CHECK', Arduino.ORDER_NONE) || '0';
            
            switch (prop) {
                case 'EVEN':
                    return [num + ' % 2 == 0', Arduino.ORDER_RELATIONAL];
                case 'ODD':
                    return [num + ' % 2 == 1', Arduino.ORDER_RELATIONAL];
                case 'PRIME':
                    // Упрощенная проверка на простоту
                    return ['isPrime(' + num + ')', Arduino.ORDER_FUNCTION_CALL];
                case 'WHOLE':
                    return [num + ' == (int)(' + num + ')', Arduino.ORDER_RELATIONAL];
                case 'POSITIVE':
                    return [num + ' > 0', Arduino.ORDER_RELATIONAL];
                case 'NEGATIVE':
                    return [num + ' < 0', Arduino.ORDER_RELATIONAL];
                case 'DIVISIBLE_BY':
                    const divisor = generator.valueToCode(block, 'DIVISOR', Arduino.ORDER_NONE) || '1';
                    return [num + ' % ' + divisor + ' == 0', Arduino.ORDER_RELATIONAL];
            }
            return ['false', Arduino.ORDER_ATOMIC];
        };

        // math_round
        Arduino.forBlock['math_round'] = function(block, generator) {
            const op = block.getFieldValue('OP');
            const num = generator.valueToCode(block, 'NUM', Arduino.ORDER_NONE) || '0';
            
            switch (op) {
                case 'ROUND': return ['round(' + num + ')', Arduino.ORDER_FUNCTION_CALL];
                case 'ROUNDUP': return ['ceil(' + num + ')', Arduino.ORDER_FUNCTION_CALL];
                case 'ROUNDDOWN': return ['floor(' + num + ')', Arduino.ORDER_FUNCTION_CALL];
            }
            return [num, Arduino.ORDER_ATOMIC];
        };

        // math_modulo
        Arduino.forBlock['math_modulo'] = function(block, generator) {
            const a = generator.valueToCode(block, 'DIVIDEND', Arduino.ORDER_NONE) || '0';
            const b = generator.valueToCode(block, 'DIVISOR', Arduino.ORDER_NONE) || '1';
            return [a + ' % ' + b, Arduino.ORDER_MULTIPLICATIVE];
        };

        // math_constrain
        Arduino.forBlock['math_constrain'] = function(block, generator) {
            const value = generator.valueToCode(block, 'VALUE', Arduino.ORDER_NONE) || '0';
            const low = generator.valueToCode(block, 'LOW', Arduino.ORDER_NONE) || '0';
            const high = generator.valueToCode(block, 'HIGH', Arduino.ORDER_NONE) || '255';
            return ['constrain(' + value + ', ' + low + ', ' + high + ')', Arduino.ORDER_FUNCTION_CALL];
        };

        // math_random_int
        Arduino.forBlock['math_random_int'] = function(block, generator) {
            const from = generator.valueToCode(block, 'FROM', Arduino.ORDER_NONE) || '0';
            const to = generator.valueToCode(block, 'TO', Arduino.ORDER_NONE) || '100';
            return ['random(' + from + ', ' + to + ' + 1)', Arduino.ORDER_FUNCTION_CALL];
        };

        // math_random_float
        Arduino.forBlock['math_random_float'] = function() {
            return ['(float)random(0, 1000) / 1000.0', Arduino.ORDER_FUNCTION_CALL];
        };

        // math_on_list (sum, min, max, average, median и т.д.)
        Arduino.forBlock['math_on_list'] = function(block, generator) {
            const op = block.getFieldValue('OP');
            const list = generator.valueToCode(block, 'LIST', Arduino.ORDER_NONE) || '{}';
            
            // Для Arduino используем упрощенные версии
            switch (op) {
                case 'SUM': return ['arraySum(' + list + ')', Arduino.ORDER_FUNCTION_CALL];
                case 'MIN': return ['arrayMin(' + list + ')', Arduino.ORDER_FUNCTION_CALL];
                case 'MAX': return ['arrayMax(' + list + ')', Arduino.ORDER_FUNCTION_CALL];
                case 'AVERAGE': return ['arrayAvg(' + list + ')', Arduino.ORDER_FUNCTION_CALL];
            }
            return ['0', Arduino.ORDER_ATOMIC];
        };

        // ===== ТЕКСТОВЫЕ БЛОКИ =====
        
        // text
        Arduino.forBlock['text'] = function(block) {
            const text = block.getFieldValue('TEXT') || '';
            return ['String("' + text.replace(/"/g, '\\"') + '")', Arduino.ORDER_ATOMIC];
        };

        // text_join
        Arduino.forBlock['text_join'] = function(block, generator) {
            let code = 'String(';
            for (let n = 0; n < block.itemCount_; n++) {
                if (n > 0) code += ' + ';
                code += generator.valueToCode(block, 'ADD' + n, Arduino.ORDER_NONE) || '""';
            }
            code += ')';
            return [code, Arduino.ORDER_FUNCTION_CALL];
        };

        // text_append
        Arduino.forBlock['text_append'] = function(block, generator) {
            const varName = generator.getVariableName(block.getFieldValue('VAR'));
            const text = generator.valueToCode(block, 'TEXT', Arduino.ORDER_NONE) || '""';
            return varName + ' += ' + text + ';\n';
        };

        // text_length
        Arduino.forBlock['text_length'] = function(block, generator) {
            const text = generator.valueToCode(block, 'VALUE', Arduino.ORDER_NONE) || '""';
            return [text + '.length()', Arduino.ORDER_FUNCTION_CALL];
        };

        // text_isEmpty
        Arduino.forBlock['text_isEmpty'] = function(block, generator) {
            const text = generator.valueToCode(block, 'VALUE', Arduino.ORDER_NONE) || '""';
            return [text + '.length() == 0', Arduino.ORDER_RELATIONAL];
        };

        // text_indexOf
        Arduino.forBlock['text_indexOf'] = function(block, generator) {
            const op = block.getFieldValue('END') === 'FIRST' ? 'indexOf' : 'lastIndexOf';
            const text = generator.valueToCode(block, 'VALUE', Arduino.ORDER_NONE) || '""';
            const search = generator.valueToCode(block, 'FIND', Arduino.ORDER_NONE) || '""';
            return [text + '.' + op + '(' + search + ')', Arduino.ORDER_FUNCTION_CALL];
        };

        // text_charAt
        Arduino.forBlock['text_charAt'] = function(block, generator) {
            const where = block.getFieldValue('WHERE');
            const text = generator.valueToCode(block, 'VALUE', Arduino.ORDER_NONE) || '""';
            
            switch (where) {
                case 'FIRST': return [text + '.charAt(0)', Arduino.ORDER_FUNCTION_CALL];
                case 'LAST': return [text + '.charAt(' + text + '.length() - 1)', Arduino.ORDER_FUNCTION_CALL];
                case 'FROM_START': {
                    const at = generator.valueToCode(block, 'AT', Arduino.ORDER_NONE) || '0';
                    return [text + '.charAt(' + at + ')', Arduino.ORDER_FUNCTION_CALL];
                }
                case 'FROM_END': {
                    const at = generator.valueToCode(block, 'AT', Arduino.ORDER_NONE) || '0';
                    return [text + '.charAt(' + text + '.length() - 1 - ' + at + ')', Arduino.ORDER_FUNCTION_CALL];
                }
                case 'RANDOM': {
                    return [text + '.charAt(random(' + text + '.length()))', Arduino.ORDER_FUNCTION_CALL];
                }
            }
            return ['""', Arduino.ORDER_ATOMIC];
        };

        // text_changeCase
        Arduino.forBlock['text_changeCase'] = function(block, generator) {
            const op = block.getFieldValue('CASE');
            const text = generator.valueToCode(block, 'TEXT', Arduino.ORDER_NONE) || '""';
            
            if (op === 'UPPERCASE') {
                return [text + '; ' + text + '.toUpperCase()', Arduino.ORDER_FUNCTION_CALL];
            } else if (op === 'LOWERCASE') {
                return [text + '; ' + text + '.toLowerCase()', Arduino.ORDER_FUNCTION_CALL];
            }
            return [text, Arduino.ORDER_ATOMIC];
        };

        // text_trim
        Arduino.forBlock['text_trim'] = function(block, generator) {
            const op = block.getFieldValue('MODE');
            const text = generator.valueToCode(block, 'TEXT', Arduino.ORDER_NONE) || '""';
            
            if (op === 'BOTH' || op === 'LEFT' || op === 'RIGHT') {
                return [text + '; ' + text + '.trim()', Arduino.ORDER_FUNCTION_CALL];
            }
            return [text, Arduino.ORDER_ATOMIC];
        };

        // text_print
        Arduino.forBlock['text_print'] = function(block, generator) {
            const text = generator.valueToCode(block, 'TEXT', Arduino.ORDER_NONE) || '""';
            return 'Serial.println(' + text + ');\n';
        };

        // ===== ПЕРЕМЕННЫЕ =====
        
        // variables_get
        Arduino.forBlock['variables_get'] = function(block, generator) {
            const varName = generator.getVariableName(block.getFieldValue('VAR'));
            return [varName, Arduino.ORDER_ATOMIC];
        };

        // variables_set
        Arduino.forBlock['variables_set'] = function(block, generator) {
            const varName = generator.getVariableName(block.getFieldValue('VAR'));
            const value = generator.valueToCode(block, 'VALUE', Arduino.ORDER_NONE) || '0';
            return varName + ' = ' + value + ';\n';
        };

        // ===== ПРОЦЕДУРЫ (ФУНКЦИИ) =====
        
        // procedures_defnoreturn
        Arduino.forBlock['procedures_defnoreturn'] = function(block, generator) {
            const funcName = generator.getProcedureName(block.getFieldValue('NAME'));
            let branch = generator.statementToCode(block, 'STACK');
            
            let code = 'void ' + funcName + '() {\n';
            code += branch;
            code += '}\n';
            
            self.addGlobalDeclaration(code);
            return '';
        };

        // procedures_defreturn
        Arduino.forBlock['procedures_defreturn'] = function(block, generator) {
            const funcName = generator.getProcedureName(block.getFieldValue('NAME'));
            let branch = generator.statementToCode(block, 'STACK');
            const returnValue = generator.valueToCode(block, 'RETURN', Arduino.ORDER_NONE) || '0';
            
            let code = 'int ' + funcName + '() {\n';
            code += branch;
            code += '  return ' + returnValue + ';\n';
            code += '}\n';
            
            self.addGlobalDeclaration(code);
            return '';
        };

        // procedures_callnoreturn
        Arduino.forBlock['procedures_callnoreturn'] = function(block, generator) {
            const funcName = generator.getProcedureName(block.getFieldValue('NAME'));
            return funcName + '();\n';
        };

        // procedures_callreturn
        Arduino.forBlock['procedures_callreturn'] = function(block, generator) {
            const funcName = generator.getProcedureName(block.getFieldValue('NAME'));
            return [funcName + '()', Arduino.ORDER_FUNCTION_CALL];
        };

        // procedures_ifreturn
        Arduino.forBlock['procedures_ifreturn'] = function(block, generator) {
            const condition = generator.valueToCode(block, 'CONDITION', Arduino.ORDER_NONE) || 'false';
            const value = generator.valueToCode(block, 'VALUE', Arduino.ORDER_NONE) || '0';
            return 'if (' + condition + ') {\n  return ' + value + ';\n}\n';
        };

        // ===== СПИСКИ (упрощенная поддержка) =====
        
        // lists_create_empty
        Arduino.forBlock['lists_create_empty'] = function() {
            return ['{}', Arduino.ORDER_ATOMIC];
        };

        // lists_create_with
        Arduino.forBlock['lists_create_with'] = function(block, generator) {
            let elements = [];
            for (let n = 0; n < block.itemCount_; n++) {
                elements.push(generator.valueToCode(block, 'ADD' + n, Arduino.ORDER_NONE) || '0');
            }
            return ['{' + elements.join(', ') + '}', Arduino.ORDER_ATOMIC];
        };

        // lists_repeat
        Arduino.forBlock['lists_repeat'] = function(block, generator) {
            const value = generator.valueToCode(block, 'ITEM', Arduino.ORDER_NONE) || '0';
            const times = generator.valueToCode(block, 'NUM', Arduino.ORDER_NONE) || '0';
            return ['arrayRepeat(' + value + ', ' + times + ')', Arduino.ORDER_FUNCTION_CALL];
        };

        // lists_length
        Arduino.forBlock['lists_length'] = function(block, generator) {
            const list = generator.valueToCode(block, 'VALUE', Arduino.ORDER_NONE) || '{}';
            return ['sizeof(' + list + ') / sizeof(' + list + '[0])', Arduino.ORDER_FUNCTION_CALL];
        };

        // lists_isEmpty
        Arduino.forBlock['lists_isEmpty'] = function(block, generator) {
            const list = generator.valueToCode(block, 'VALUE', Arduino.ORDER_NONE) || '{}';
            return ['(sizeof(' + list + ') == 0)', Arduino.ORDER_RELATIONAL];
        };

        // lists_getIndex
        Arduino.forBlock['lists_getIndex'] = function(block, generator) {
            const list = generator.valueToCode(block, 'VALUE', Arduino.ORDER_NONE) || '{}';
            const where = block.getFieldValue('WHERE');
            let index = '0';
            
            if (where === 'FROM_START') {
                index = generator.valueToCode(block, 'AT', Arduino.ORDER_NONE) || '0';
            } else if (where === 'FROM_END') {
                const at = generator.valueToCode(block, 'AT', Arduino.ORDER_NONE) || '0';
                index = 'sizeof(' + list + ') / sizeof(' + list + '[0]) - 1 - ' + at;
            } else if (where === 'FIRST') {
                index = '0';
            } else if (where === 'LAST') {
                index = 'sizeof(' + list + ') / sizeof(' + list + '[0]) - 1';
            } else if (where === 'RANDOM') {
                index = 'random(sizeof(' + list + ') / sizeof(' + list + '[0]))';
            }
            
            return [list + '[' + index + ']', Arduino.ORDER_ATOMIC];
        };

        // lists_setIndex
        Arduino.forBlock['lists_setIndex'] = function(block, generator) {
            const list = generator.valueToCode(block, 'LIST', Arduino.ORDER_NONE) || '{}';
            const where = block.getFieldValue('WHERE');
            const value = generator.valueToCode(block, 'TO', Arduino.ORDER_NONE) || '0';
            
            let index = '0';
            if (where === 'FROM_START') {
                index = generator.valueToCode(block, 'AT', Arduino.ORDER_NONE) || '0';
            } else if (where === 'FROM_END') {
                const at = generator.valueToCode(block, 'AT', Arduino.ORDER_NONE) || '0';
                index = 'sizeof(' + list + ') / sizeof(' + list + '[0]) - 1 - ' + at;
            } else if (where === 'FIRST') {
                index = '0';
            } else if (where === 'LAST') {
                index = 'sizeof(' + list + ') / sizeof(' + list + '[0]) - 1';
            }
            
            return list + '[' + index + '] = ' + value + ';\n';
        };

        // ==========================================
        // БЛОКИ ARDUINO (прямые поля)
        // ==========================================
        
        // Программа
		Arduino.forBlock['arduino_setup_loop'] = function(block, generator) {
			self.clear();
			
			// statementToCode собирает ВСЕ блоки внутри statement input
			let setupStatements = generator.statementToCode(block, 'SETUP');
			let loopStatements = generator.statementToCode(block, 'LOOP');
			
			let fullCode = '';
			fullCode += boardsManager.generateHeader();
			fullCode += '\n';
			
			const includes = self.collectIncludes();
			if (includes) fullCode += includes + '\n\n';
			
			const globals = self.collectGlobalDeclarations();
			if (globals) fullCode += globals + '\n\n';
			
			fullCode += 'void setup() {\n';
			const setupAll = (self.collectSetupCode() + '\n' + setupStatements).trim();
			if (setupAll) {
				// Разбиваем на строки и форматируем с отступами
				const setupLines = setupAll.split('\n').filter(l => l.trim());
				setupLines.forEach(line => {
					fullCode += '  ' + line.trim() + '\n';
				});
			} else {
				fullCode += '  // Инициализация\n';
			}
			fullCode += '}\n\n';
			
			fullCode += 'void loop() {\n';
			if (loopStatements.trim()) {
				const loopLines = loopStatements.split('\n').filter(l => l.trim());
				loopLines.forEach(line => {
					fullCode += '  ' + line.trim() + '\n';
				});
			} else {
				fullCode += '  // Основной цикл\n';
			}
			fullCode += '}\n';
			
			return fullCode;
		};

        // Пины
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

        // Время
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

        // Serial
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

        // Тоны
        Arduino.forBlock['arduino_tone'] = function(block) {
            return 'tone(' + (block.getFieldValue('PIN') || '8') + ', ' + (block.getFieldValue('FREQUENCY') || '440') + ');\n';
        };

        Arduino.forBlock['arduino_no_tone'] = function(block) {
            return 'noTone(' + (block.getFieldValue('PIN') || '8') + ');\n';
        };

        // Математика Arduino
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

        // Сенсоры
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

        // Устройства
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
            const rv = block.getFieldValue('RED_VAL') || '255';
            const gv = block.getFieldValue('GREEN_VAL') || '0';
            const bv = block.getFieldValue('BLUE_VAL') || '0';
            
            self.addSetupCode('pinMode(' + r + ', OUTPUT);');
            self.addSetupCode('pinMode(' + g + ', OUTPUT);');
            self.addSetupCode('pinMode(' + b + ', OUTPUT);');
            
            return 'analogWrite(' + r + ', ' + rv + ');\n' +
                   'analogWrite(' + g + ', ' + gv + ');\n' +
                   'analogWrite(' + b + ', ' + bv + ');\n';
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
                
                if (cb.type === 'statement') {
                    return code + '\n';
                }
                return [code, Arduino.ORDER_FUNCTION_CALL];
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
    addGlobalDeclaration(code) { if (!this.globalDeclarations.includes(code)) this.globalDeclarations.push(code); }
    addSetupCode(code) { if (!this.setupCode.includes(code)) this.setupCode.push(code); }
    collectIncludes() { return Array.from(this.includes).join('\n'); }
    collectGlobalDeclarations() { return this.globalDeclarations.join('\n'); }
    collectSetupCode() { return this.setupCode.join('\n'); }

    // ===== ГЛАВНАЯ ГЕНЕРАЦИЯ =====
    generate(workspace) {
        this.clear();
        
        try {
            let code = this.generator.workspaceToCode(workspace);
            
            if (code.includes('void setup()') && code.includes('void loop()')) {
                return this.cleanCode(code);
            }
            
            if (!code.trim()) {
                code = '  // Нет блоков для выполнения\n';
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
            throw new Error('Ошибка: ' + e.message);
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
        if (!code.includes('pinMode') && (code.includes('digitalWrite') || code.includes('analogWrite'))) {
            issues.push({ type: 'warning', message: 'Нет pinMode() для пинов вывода' });
        }
        return issues;
    }
}

const arduinoGenerator = new ArduinoGenerator();