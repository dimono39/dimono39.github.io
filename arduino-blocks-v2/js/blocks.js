// blocks.js - Определения блоков Blockly для Arduino

class BlocksManager {
    constructor() {
        this.customBlocks = [];
        this.loadCustomBlocks();
        this.blockCategories = [
            {
                id: 'program',
                name: 'Программа',
                icon: 'fa-microchip',
                color: '#4CAF50',
                blocks: ['arduino_setup_loop']
            },
            {
                id: 'control',
                name: 'Управление',
                icon: 'fa-code-branch',
                color: '#2196F3',
                blocks: ['controls_if', 'controls_ifelse', 'logic_compare', 'logic_operation', 
                         'logic_negate', 'logic_boolean', 'controls_repeat_ext', 'controls_whileUntil',
                         'controls_for', 'controls_flow_statements']
            },
            {
                id: 'pins',
                name: 'Пины Arduino',
                icon: 'fa-plug',
                color: '#FF9800',
                blocks: ['arduino_pin_mode', 'arduino_digital_write', 'arduino_digital_read',
                         'arduino_analog_write', 'arduino_analog_read', 'arduino_tone', 'arduino_no_tone']
            },
            {
                id: 'time',
                name: 'Время',
                icon: 'fa-clock',
                color: '#9C27B0',
                blocks: ['arduino_delay', 'arduino_delay_microseconds', 'arduino_millis', 'arduino_micros']
            },
            {
                id: 'serial',
                name: 'Serial',
                icon: 'fa-terminal',
                color: '#00BCD4',
                blocks: ['arduino_serial_begin', 'arduino_serial_print', 'arduino_serial_println',
                         'arduino_serial_read', 'arduino_serial_available']
            },
            {
                id: 'sensors',
                name: 'Сенсоры',
                icon: 'fa-temperature-high',
                color: '#8BC34A',
                blocks: ['sensor_dht_read', 'sensor_ultrasonic', 'sensor_pir', 'sensor_ldr']
            },
            {
                id: 'actuators',
                name: 'Устройства',
                icon: 'fa-cogs',
                color: '#F44336',
                blocks: ['actuator_servo', 'actuator_servo_attach', 'output_led', 
                         'output_rgb_led', 'output_buzzer', 'output_relay']
            },
            {
                id: 'math',
                name: 'Математика',
                icon: 'fa-square-root-variable',
                color: '#3F51B5',
                blocks: ['math_number', 'math_arithmetic', 'math_single', 'math_constant',
                         'arduino_map', 'arduino_constrain', 'arduino_random']
            },
            {
                id: 'text',
                name: 'Текст',
                icon: 'fa-font',
                color: '#607D8B',
                blocks: ['text', 'text_join', 'text_append', 'text_length']
            },
            {
                id: 'variables',
                name: 'Переменные',
                icon: 'fa-box',
                color: '#FF5722',
                blocks: []
            },
            {
                id: 'functions',
                name: 'Функции',
                icon: 'fa-function',
                color: '#9E9E9E',
                blocks: []
            }
        ];
    }

    loadCustomBlocks() {
        const saved = localStorage.getItem('arduino_blocks_custom_v2');
        if (saved) {
            try {
                this.customBlocks = JSON.parse(saved);
            } catch (e) {
                console.error('Ошибка загрузки пользовательских блоков:', e);
            }
        }
    }

    saveCustomBlocks() {
        localStorage.setItem('arduino_blocks_custom_v2', JSON.stringify(this.customBlocks));
    }

    addCustomBlock(blockData) {
        const newBlock = {
            id: 'custom_' + Date.now(),
            type: blockData.type || 'statement',
            name: blockData.name,
            code: blockData.code,
            color: blockData.color || '#6c5ce7',
            category: blockData.category || 'custom'
        };
        
        this.customBlocks.push(newBlock);
        this.saveCustomBlocks();
        this.defineCustomBlock(newBlock);
        
        const customCategory = this.blockCategories.find(c => c.id === 'custom');
        if (!customCategory) {
            this.blockCategories.push({
                id: 'custom',
                name: 'Мои блоки',
                icon: 'fa-star',
                color: '#FFD700',
                blocks: [newBlock.id]
            });
        } else {
            customCategory.blocks.push(newBlock.id);
        }
        
        return newBlock;
    }

    initBlocks() {
        this.defineProgramBlocks();
        this.defineArduinoBlocks();
        this.defineSensorBlocks();
        this.defineActuatorBlocks();
        this.defineCustomBlocks();
    }

    // ==================== БЛОК ПРОГРАММЫ ====================
    defineProgramBlocks() {
		Blockly.Blocks['arduino_setup_loop'] = {
			init: function() {
				this.appendDummyInput('TITLE')
					.appendField('🚀 Программа Arduino')
					.appendField(new Blockly.FieldTextInput('Моя программа'), 'NAME');
				
				// ВАЖНО: appendStatementInput позволяет добавлять несколько блоков!
				this.appendStatementInput('SETUP')
					.setCheck(null)  // null = любые блоки
					.appendField('📋 Setup (выполняется один раз)');
				
				this.appendStatementInput('LOOP')
					.setCheck(null)
					.appendField('🔄 Loop (повторяется)');
				
				this.setColour(76);
				this.setTooltip('Основная структура программы Arduino.\nSetup - настройка (запускается один раз)\nLoop - основной цикл (повторяется бесконечно)');
				this.setHelpUrl('');
			}
		};
    }

    // ==================== БЛОКИ ARDUINO (С РЕДАКТИРУЕМЫМИ ПОЛЯМИ!) ====================
    defineArduinoBlocks() {
        
        // Валидатор для пинов (разрешает цифры, A0-A15, LED_BUILTIN)
		const pinValidator = function(newValue) {
			// Пустое значение
			if (!newValue || newValue === '') return '13'; // Значение по умолчанию
			
			// Именованные пины
			const namedPins = [
				'LED_BUILTIN', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 
				'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15',
				'SCL', 'SDA', 'MISO', 'MOSI', 'SCK', 'SS',
				'TX', 'RX', 'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'
			];
			
			if (namedPins.includes(newValue.toUpperCase())) {
				return newValue;
			}
			
			// Цифровые пины (0-53 для Mega)
			if (/^\d{1,2}$/.test(newValue)) {
				const num = parseInt(newValue);
				if (num >= 0 && num <= 53) return newValue;
			}
			
			// Аналоговые пины (A0-A15)
			if (/^[Aa]\d{1,2}$/.test(newValue)) {
				return newValue.toUpperCase();
			}
			
			// Любые другие валидные идентификаторы
			if (/^[a-zA-Z_]\w*$/.test(newValue)) {
				return newValue;
			}
			
			// Если не прошло валидацию — возвращаем старое значение
			return null;
		};
        
        // Валидатор для чисел
		const numberValidator = function(newValue) {
			if (!newValue || newValue === '') return '0';
			if (/^-?\d+\.?\d*$/.test(newValue)) return newValue;
			return null;
		};

        // Блок: pinMode (С РЕДАКТИРУЕМЫМ ПОЛЕМ ПИНА!)
        Blockly.Blocks['arduino_pin_mode'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🔌 Режим пина')
                    .appendField(new Blockly.FieldTextInput('13', pinValidator), 'PIN')
                    .appendField('как')
                    .appendField(new Blockly.FieldDropdown([
                        ['INPUT', 'INPUT'],
                        ['OUTPUT', 'OUTPUT'],
                        ['INPUT_PULLUP', 'INPUT_PULLUP']
                    ]), 'MODE');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(0);
                this.setTooltip('Устанавливает режим работы пина.\nКликните на число чтобы изменить номер пина.');
            }
        };

        // Блок: digitalWrite (С РЕДАКТИРУЕМЫМ ПОЛЕМ ПИНА!)
        Blockly.Blocks['arduino_digital_write'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('💡 Установить пин')
                    .appendField(new Blockly.FieldTextInput('13', pinValidator), 'PIN')
                    .appendField('в')
                    .appendField(new Blockly.FieldDropdown([
                        ['HIGH (вкл)', 'HIGH'],
                        ['LOW (выкл)', 'LOW']
                    ]), 'VALUE');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(0);
                this.setTooltip('Устанавливает цифровое значение на пине.\nКликните на число чтобы изменить номер пина.');
            }
        };

        // Блок: digitalRead (С РЕДАКТИРУЕМЫМ ПОЛЕМ ПИНА!)
        Blockly.Blocks['arduino_digital_read'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📖 Прочитать пин')
                    .appendField(new Blockly.FieldTextInput('2', pinValidator), 'PIN');
                this.setInputsInline(true);
                this.setOutput(true, 'Boolean');
                this.setColour(0);
                this.setTooltip('Читает цифровое значение с пина.\nВозвращает HIGH или LOW.');
            }
        };

        // Блок: analogWrite ШИМ (С РЕДАКТИРУЕМЫМИ ПОЛЯМИ!)
        Blockly.Blocks['arduino_analog_write'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📊 ШИМ сигнал на пин')
                    .appendField(new Blockly.FieldTextInput('9', pinValidator), 'PIN')
                    .appendField('значение')
                    .appendField(new Blockly.FieldTextInput('128', numberValidator), 'VALUE')
                    .appendField('(0-255)');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(0);
                this.setTooltip('ШИМ сигнал. 0 = 0%, 255 = 100%.\nТолько для PWM пинов (~ отмечены на плате).');
            }
        };

        // Блок: analogRead (С РЕДАКТИРУЕМЫМ ПОЛЕМ!)
        Blockly.Blocks['arduino_analog_read'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📈 Аналоговый вход')
                    .appendField(new Blockly.FieldTextInput('A0', pinValidator), 'PIN');
                this.setInputsInline(true);
                this.setOutput(true, 'Number');
                this.setColour(0);
                this.setTooltip('Читает аналоговое значение (0-1023).\nИспользуйте пины A0-A5 на Uno.');
            }
        };

        // Блок: delay (С РЕДАКТИРУЕМЫМ ПОЛЕМ!)
        Blockly.Blocks['arduino_delay'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('⏱️ Пауза')
                    .appendField(new Blockly.FieldTextInput('1000', numberValidator), 'TIME')
                    .appendField('мс');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(220);
                this.setTooltip('Пауза в миллисекундах.\n1000 мс = 1 секунда.');
            }
        };

        // Блок: delayMicroseconds
        Blockly.Blocks['arduino_delay_microseconds'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('⏱️ Микро-пауза')
                    .appendField(new Blockly.FieldTextInput('100', numberValidator), 'TIME')
                    .appendField('мкс');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(220);
                this.setTooltip('Пауза в микросекундах.\n1000 мкс = 1 мс.');
            }
        };

        // Блок: millis
        Blockly.Blocks['arduino_millis'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('⏲️ Время работы (мс)');
                this.setOutput(true, 'Number');
                this.setColour(220);
                this.setTooltip('Возвращает миллисекунды с запуска программы.');
            }
        };

        // Блок: micros
        Blockly.Blocks['arduino_micros'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('⏲️ Время работы (мкс)');
                this.setOutput(true, 'Number');
                this.setColour(220);
                this.setTooltip('Возвращает микросекунды с запуска программы.');
            }
        };

        // Блок: Serial.begin
        Blockly.Blocks['arduino_serial_begin'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📡 Serial.begin')
                    .appendField(new Blockly.FieldTextInput('9600', numberValidator), 'SPEED');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(180);
                this.setTooltip('Инициализация Serial порта.\nСтандартные скорости: 9600, 115200.');
            }
        };

        // Блок: Serial.print
        Blockly.Blocks['arduino_serial_print'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🖨️ Serial.print')
                    .appendField(new Blockly.FieldTextInput('"Hello"'), 'TEXT');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(180);
                this.setTooltip('Выводит текст в Serial без переноса строки.');
            }
        };

        // Блок: Serial.println
        Blockly.Blocks['arduino_serial_println'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🖨️ Serial.println')
                    .appendField(new Blockly.FieldTextInput('"Hello"'), 'TEXT');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(180);
                this.setTooltip('Выводит текст в Serial с переносом строки.');
            }
        };

        // Блок: Serial.read
        Blockly.Blocks['arduino_serial_read'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📥 Serial.read()');
                this.setOutput(true, 'Number');
                this.setColour(180);
            }
        };

        // Блок: Serial.available
        Blockly.Blocks['arduino_serial_available'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📊 Доступно байт');
                this.setOutput(true, 'Number');
                this.setColour(180);
            }
        };

        // Блок: tone
        Blockly.Blocks['arduino_tone'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🔊 Тон на пин')
                    .appendField(new Blockly.FieldTextInput('8', pinValidator), 'PIN')
                    .appendField('частота')
                    .appendField(new Blockly.FieldTextInput('440', numberValidator), 'FREQUENCY')
                    .appendField('Гц');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(290);
                this.setTooltip('Генерирует звук. 440 Гц = нота Ля.');
            }
        };

        // Блок: noTone
        Blockly.Blocks['arduino_no_tone'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🔇 Выкл. тон на пине')
                    .appendField(new Blockly.FieldTextInput('8', pinValidator), 'PIN');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(290);
            }
        };

        // Блок: map
        Blockly.Blocks['arduino_map'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🗺️ map(')
                    .appendField(new Blockly.FieldTextInput('0', numberValidator), 'VALUE')
                    .appendField(',')
                    .appendField(new Blockly.FieldTextInput('0', numberValidator), 'FROM_LOW')
                    .appendField(',')
                    .appendField(new Blockly.FieldTextInput('1023', numberValidator), 'FROM_HIGH')
                    .appendField(',')
                    .appendField(new Blockly.FieldTextInput('0', numberValidator), 'TO_LOW')
                    .appendField(',')
                    .appendField(new Blockly.FieldTextInput('255', numberValidator), 'TO_HIGH')
                    .appendField(')');
                this.setInputsInline(true);
                this.setOutput(true, 'Number');
                this.setColour(230);
                this.setTooltip('Преобразует значение из одного диапазона в другой.\nmap(значение, от_мин, от_макс, к_мин, к_макс)');
            }
        };

        // Блок: constrain
        Blockly.Blocks['arduino_constrain'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🔒 constrain(')
                    .appendField(new Blockly.FieldTextInput('0', numberValidator), 'VALUE')
                    .appendField(',')
                    .appendField(new Blockly.FieldTextInput('0', numberValidator), 'MIN')
                    .appendField(',')
                    .appendField(new Blockly.FieldTextInput('255', numberValidator), 'MAX')
                    .appendField(')');
                this.setInputsInline(true);
                this.setOutput(true, 'Number');
                this.setColour(230);
                this.setTooltip('Ограничивает значение: constrain(x, min, max)');
            }
        };

        // Блок: random
        Blockly.Blocks['arduino_random'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🎲 random(')
                    .appendField(new Blockly.FieldTextInput('0', numberValidator), 'MIN')
                    .appendField(',')
                    .appendField(new Blockly.FieldTextInput('100', numberValidator), 'MAX')
                    .appendField(')');
                this.setInputsInline(true);
                this.setOutput(true, 'Number');
                this.setColour(230);
                this.setTooltip('Случайное число от min до max-1');
            }
        };
    }

    // ==================== БЛОКИ СЕНСОРОВ ====================
    defineSensorBlocks() {
        const pinValidator = function(v) {
            if (!v || v === 'LED_BUILTIN') return v;
            if (/^A?\d{1,2}$/.test(v)) return v;
            return null;
        };

        // DHT датчик
        Blockly.Blocks['sensor_dht_read'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🌡️ DHT датчик')
                    .appendField(new Blockly.FieldTextInput('2', pinValidator), 'PIN')
                    .appendField(new Blockly.FieldDropdown([
                        ['DHT11', 'DHT11'],
                        ['DHT22', 'DHT22']
                    ]), 'TYPE')
                    .appendField(new Blockly.FieldDropdown([
                        ['🌡️ температура', 'temperature'],
                        ['💧 влажность', 'humidity']
                    ]), 'PARAM');
                this.setInputsInline(true);
                this.setOutput(true, 'Number');
                this.setColour(120);
                this.setTooltip('Читает данные с датчика DHT11/DHT22');
            }
        };

        // Ультразвуковой датчик
        Blockly.Blocks['sensor_ultrasonic'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📏 HC-SR04')
                    .appendField('Trig:')
                    .appendField(new Blockly.FieldTextInput('9', pinValidator), 'TRIG')
                    .appendField('Echo:')
                    .appendField(new Blockly.FieldTextInput('10', pinValidator), 'ECHO');
                this.setInputsInline(true);
                this.setOutput(true, 'Number');
                this.setColour(120);
                this.setTooltip('Ультразвуковой датчик расстояния. Возвращает см.');
            }
        };

        // PIR датчик
        Blockly.Blocks['sensor_pir'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🚶 PIR движения')
                    .appendField(new Blockly.FieldTextInput('7', pinValidator), 'PIN');
                this.setInputsInline(true);
                this.setOutput(true, 'Boolean');
                this.setColour(120);
                this.setTooltip('Датчик движения. HIGH = есть движение.');
            }
        };

        // Фоторезистор
        Blockly.Blocks['sensor_ldr'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('💡 Освещенность')
                    .appendField(new Blockly.FieldTextInput('A0', pinValidator), 'PIN');
                this.setInputsInline(true);
                this.setOutput(true, 'Number');
                this.setColour(120);
                this.setTooltip('Читает уровень освещенности (0-1023).');
            }
        };
    }

    // ==================== БЛОКИ УСТРОЙСТВ ====================
    defineActuatorBlocks() {
        const pinValidator = function(v) {
            if (!v || v === 'LED_BUILTIN') return v;
            if (/^A?\d{1,2}$/.test(v)) return v;
            return null;
        };
        
        const numberValidator = function(v) {
            if (!v) return '0';
            if (/^-?\d+\.?\d*$/.test(v)) return v;
            return null;
        };

        // Серво attach
        Blockly.Blocks['actuator_servo_attach'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🔧 Подключить серво к пину')
                    .appendField(new Blockly.FieldTextInput('9', pinValidator), 'PIN');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(300);
            }
        };

        // Серво поворот
        Blockly.Blocks['actuator_servo'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🔧 Серво пин')
                    .appendField(new Blockly.FieldTextInput('9', pinValidator), 'PIN')
                    .appendField('угол')
                    .appendField(new Blockly.FieldTextInput('90', numberValidator), 'ANGLE')
                    .appendField('°');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(300);
                this.setTooltip('Поворачивает серво на угол 0-180 градусов.');
            }
        };

        // Светодиод
        Blockly.Blocks['output_led'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('💡 Светодиод на пине')
                    .appendField(new Blockly.FieldTextInput('13', pinValidator), 'PIN')
                    .appendField(new Blockly.FieldDropdown([
                        ['⭐ ВКЛЮЧИТЬ', 'HIGH'],
                        ['⚫ ВЫКЛЮЧИТЬ', 'LOW']
                    ]), 'STATE');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(330);
            }
        };

        // RGB светодиод
        Blockly.Blocks['output_rgb_led'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🌈 RGB LED')
                    .appendField('R:')
                    .appendField(new Blockly.FieldTextInput('9', pinValidator), 'RED')
                    .appendField('G:')
                    .appendField(new Blockly.FieldTextInput('10', pinValidator), 'GREEN')
                    .appendField('B:')
                    .appendField(new Blockly.FieldTextInput('11', pinValidator), 'BLUE');
                this.appendDummyInput()
                    .appendField('   R값:')
                    .appendField(new Blockly.FieldTextInput('255', numberValidator), 'RED_VAL')
                    .appendField('G값:')
                    .appendField(new Blockly.FieldTextInput('0', numberValidator), 'GREEN_VAL')
                    .appendField('B값:')
                    .appendField(new Blockly.FieldTextInput('0', numberValidator), 'BLUE_VAL');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(330);
            }
        };

        // Зуммер
        Blockly.Blocks['output_buzzer'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🔔 Зуммер пин')
                    .appendField(new Blockly.FieldTextInput('8', pinValidator), 'PIN')
                    .appendField('Гц:')
                    .appendField(new Blockly.FieldTextInput('440', numberValidator), 'FREQUENCY')
                    .appendField('мс:')
                    .appendField(new Blockly.FieldTextInput('500', numberValidator), 'DURATION');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(290);
            }
        };

        // Реле
        Blockly.Blocks['output_relay'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('⚡ Реле на пине')
                    .appendField(new Blockly.FieldTextInput('4', pinValidator), 'PIN')
                    .appendField(new Blockly.FieldDropdown([
                        ['⚡ ВКЛЮЧИТЬ', 'HIGH'],
                        ['🔌 ВЫКЛЮЧИТЬ', 'LOW']
                    ]), 'STATE');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(0);
            }
        };
    }

    // ==================== ПОЛЬЗОВАТЕЛЬСКИЕ БЛОКИ ====================
    defineCustomBlocks() {
        this.customBlocks.forEach(blockData => {
            this.defineCustomBlock(blockData);
        });
    }

	defineCustomBlock(blockData) {
		// Удаляем старое определение если существует
		if (Blockly.Blocks[blockData.id]) {
			delete Blockly.Blocks[blockData.id];
		}
		
		// Удаляем старый генератор
		if (arduinoGenerator && arduinoGenerator.generator && 
			arduinoGenerator.generator.forBlock[blockData.id]) {
			delete arduinoGenerator.generator.forBlock[blockData.id];
		}
		
		Blockly.Blocks[blockData.id] = {
			init: function() {
				this.appendDummyInput()
					.appendField('🔧 ' + blockData.name)
					.appendField(new Blockly.FieldTextInput('0', pinValidator), 'PIN')
					.appendField(new Blockly.FieldTextInput('0', numberValidator), 'VALUE');
				this.setInputsInline(true);
				
				if (blockData.type === 'statement') {
					this.setPreviousStatement(true, null);
					this.setNextStatement(true, null);
				} else {
					this.setOutput(true, 'Number');
				}
				
				this.setColour(blockData.color || '#6c5ce7');
				this.setTooltip(blockData.name);
			}
		};
	}

    // ==================== ТУЛБОКС ====================
    getToolboxConfig() {
        const contents = [];
        
        this.blockCategories.forEach(category => {
            if (category.id === 'variables') {
                contents.push({
                    kind: 'category',
                    name: category.name,
                    colour: category.color,
                    custom: 'VARIABLE'
                });
            } else if (category.id === 'functions') {
                contents.push({
                    kind: 'category',
                    name: category.name,
                    colour: category.color,
                    custom: 'PROCEDURE'
                });
            } else if (category.blocks.length > 0) {
                const catBlocks = [];
                category.blocks.forEach(blockType => {
                    catBlocks.push({ kind: 'block', type: blockType });
                });
                
                contents.push({
                    kind: 'category',
                    name: category.name,
                    colour: category.color,
                    contents: catBlocks
                });
            }
        });
        
        return {
            kind: 'categoryToolbox',
            contents: contents
        };
    }

    searchBlocks(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        this.blockCategories.forEach(category => {
            const matchedBlocks = category.blocks.filter(blockType => {
                const blockName = this.getBlockName(blockType);
                return blockName && blockName.toLowerCase().includes(lowerQuery);
            });
            
            if (matchedBlocks.length > 0) {
                results.push({
                    category: category,
                    blocks: matchedBlocks
                });
            }
        });
        
        return results;
    }

    getBlockName(blockType) {
        const names = {
            'arduino_setup_loop': 'Программа Arduino',
            'arduino_pin_mode': 'Режим пина (pinMode)',
            'arduino_digital_write': 'Цифровой выход (digitalWrite)',
            'arduino_digital_read': 'Цифровой вход (digitalRead)',
            'arduino_analog_write': 'ШИМ выход (analogWrite)',
            'arduino_analog_read': 'Аналоговый вход (analogRead)',
            'arduino_delay': 'Пауза (delay)',
            'arduino_delay_microseconds': 'Микро-пауза',
            'arduino_millis': 'Миллисекунды (millis)',
            'arduino_micros': 'Микросекунды (micros)',
            'arduino_serial_begin': 'Инициализация Serial',
            'arduino_serial_print': 'Serial.print',
            'arduino_serial_println': 'Serial.println',
            'arduino_serial_read': 'Serial.read',
            'arduino_serial_available': 'Serial.available',
            'arduino_tone': 'Тон (tone)',
            'arduino_no_tone': 'Выкл. тон (noTone)',
            'arduino_map': 'map()',
            'arduino_constrain': 'constrain()',
            'arduino_random': 'random()',
            'sensor_dht_read': 'Датчик DHT',
            'sensor_ultrasonic': 'Ультразвук HC-SR04',
            'sensor_pir': 'Датчик движения PIR',
            'sensor_ldr': 'Датчик освещенности',
            'actuator_servo_attach': 'Подключить серво',
            'actuator_servo': 'Повернуть серво',
            'output_led': 'Светодиод',
            'output_rgb_led': 'RGB светодиод',
            'output_buzzer': 'Зуммер',
            'output_relay': 'Реле',
        };
        
        return names[blockType] || null;
    }
}

const blocksManager = new BlocksManager();