// blocks.js - Определение блоков Blockly для Arduino

class BlocksManager {
    constructor() {
        this.customBlocks = [];
        this.loadCustomBlocks();
    }

    // Загрузка пользовательских блоков из localStorage
    loadCustomBlocks() {
        const saved = localStorage.getItem('arduino_blocks_custom');
        if (saved) {
            try {
                this.customBlocks = JSON.parse(saved);
            } catch (e) {
                console.error('Ошибка загрузки пользовательских блоков:', e);
            }
        }
    }

    // Сохранение пользовательских блоков
    saveCustomBlocks() {
        localStorage.setItem('arduino_blocks_custom', JSON.stringify(this.customBlocks));
    }

    // Добавление пользовательского блока
    addCustomBlock(blockData) {
        this.customBlocks.push({
            id: 'custom_' + Date.now(),
            ...blockData
        });
        this.saveCustomBlocks();
    }

    // Инициализация всех блоков
    initBlocks() {
        this.defineCoreBlocks();
        this.defineArduinoBlocks();
        this.defineSensorBlocks();
        this.defineCustomBlocks();
    }

    // Базовые блоки (логика, математика и т.д.)
    defineCoreBlocks() {
        // Используем встроенные блоки Blockly
        // Они уже доступны через blocks_compressed.js
    }

    // Специфические блоки Arduino
    defineArduinoBlocks() {
		
        // Блок: pinMode
        Blockly.Blocks['arduino_pin_mode'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🔌 Установить режим пина');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.appendDummyInput()
                    .appendField('как')
                    .appendField(new Blockly.FieldDropdown([
                        ['ВХОД (INPUT)', 'INPUT'],
                        ['ВЫХОД (OUTPUT)', 'OUTPUT'],
                        ['ВХОД С ПОДТЯЖКОЙ (INPUT_PULLUP)', 'INPUT_PULLUP']
                    ]), 'MODE');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(0);
                this.setTooltip('Устанавливает режим работы пина');
            }
        };

        // Блок: digitalWrite
        Blockly.Blocks['arduino_digital_write'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('💡 Цифровой выход');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.appendDummyInput()
                    .appendField('значение')
                    .appendField(new Blockly.FieldDropdown([
                        ['HIGH', 'HIGH'],
                        ['LOW', 'LOW']
                    ]), 'VALUE');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(0);
                this.setTooltip('Устанавливает цифровое значение на пине');
            }
        };

        // Блок: digitalRead
        Blockly.Blocks['arduino_digital_read'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📖 Цифровое чтение');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('с пина');
                this.setInputsInline(true);
                this.setOutput(true, 'Boolean');
                this.setColour(0);
                this.setTooltip('Читает цифровое значение с пина');
            }
        };

        // Блок: analogWrite (ШИМ)
        Blockly.Blocks['arduino_analog_write'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📊 Аналоговый выход (ШИМ)');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.appendValueInput('VALUE')
                    .setCheck('Number')
                    .appendField('значение (0-255)');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(0);
                this.setTooltip('Устанавливает ШИМ значение на пине');
            }
        };

        // Блок: analogRead
        Blockly.Blocks['arduino_analog_read'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📈 Аналоговое чтение');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('с пина');
                this.setInputsInline(true);
                this.setOutput(true, 'Number');
                this.setColour(0);
                this.setTooltip('Читает аналоговое значение (0-1023)');
            }
        };

        // Блок: delay
        Blockly.Blocks['arduino_delay'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('⏱️ Задержка');
                this.appendValueInput('TIME')
                    .setCheck('Number')
                    .appendField('мс');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(220);
                this.setTooltip('Пауза в миллисекундах');
            }
        };

        // Блок: Serial.begin
        Blockly.Blocks['arduino_serial_begin'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📡 Serial.begin');
                this.appendValueInput('SPEED')
                    .setCheck('Number')
                    .appendField('скорость');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(180);
                this.setTooltip('Инициализация последовательного порта');
            }
        };

        // Блок: Serial.println
        Blockly.Blocks['arduino_serial_println'] = {
            init: function() {
                this.appendValueInput('TEXT')
                    .appendField('🖨️ Serial.println');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(180);
                this.setTooltip('Вывод в последовательный порт с новой строки');
            }
        };

        // Блок: millis
        Blockly.Blocks['arduino_millis'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('⏲️ millis()');
                this.setOutput(true, 'Number');
                this.setColour(220);
                this.setTooltip('Возвращает количество миллисекунд с запуска');
            }
        };

        // Блок: map
        Blockly.Blocks['arduino_map'] = {
            init: function() {
                this.appendValueInput('VALUE')
                    .setCheck('Number')
                    .appendField('🗺️ map значение');
                this.appendValueInput('FROM_LOW')
                    .setCheck('Number')
                    .appendField('от нижн.');
                this.appendValueInput('FROM_HIGH')
                    .setCheck('Number')
                    .appendField('от верхн.');
                this.appendValueInput('TO_LOW')
                    .setCheck('Number')
                    .appendField('к нижн.');
                this.appendValueInput('TO_HIGH')
                    .setCheck('Number')
                    .appendField('к верхн.');
                this.setInputsInline(true);
                this.setOutput(true, 'Number');
                this.setColour(230);
                this.setTooltip('Преобразует значение из одного диапазона в другой');
            }
        };
		
		// blocks.js - Дополнение новыми блоками

		// Добавьте эти блоки в метод defineArduinoBlocks():

		// Блок: начало и конец программы
		Blockly.Blocks['arduino_setup_loop'] = {
			init: function() {
				this.appendDummyInput()
					.appendField('🚀 Программа Arduino')
					.appendField(new Blockly.FieldTextInput('Моя программа'), 'NAME');
				this.appendStatementInput('SETUP')
					.setCheck(null)
					.appendField('📋 Setup (настройка)');
				this.appendStatementInput('LOOP')
					.setCheck(null)
					.appendField('🔄 Loop (цикл)');
				this.setColour(76);
				this.setTooltip('Основная структура программы Arduino');
				this.setHelpUrl('');
			}
		};

		// Блок: delayMicroseconds
		Blockly.Blocks['arduino_delay_microseconds'] = {
			init: function() {
				this.appendDummyInput()
					.appendField('⏱️ Задержка мкс');
				this.appendValueInput('TIME')
					.setCheck('Number')
					.appendField('мкс');
				this.setInputsInline(true);
				this.setPreviousStatement(true, null);
				this.setNextStatement(true, null);
				this.setColour(220);
				this.setTooltip('Пауза в микросекундах');
			}
		};

		// Блок: micros
		Blockly.Blocks['arduino_micros'] = {
			init: function() {
				this.appendDummyInput()
					.appendField('⏲️ micros()');
				this.setOutput(true, 'Number');
				this.setColour(220);
				this.setTooltip('Возвращает микросекунды с запуска');
			}
		};

		// Блок: tone
		Blockly.Blocks['arduino_tone'] = {
			init: function() {
				this.appendDummyInput()
					.appendField('🔊 Тон');
				this.appendValueInput('PIN')
					.setCheck('Number')
					.appendField('пин');
				this.appendValueInput('FREQUENCY')
					.setCheck('Number')
					.appendField('частота Гц');
				this.appendValueInput('DURATION')
					.setCheck('Number')
					.appendField('длит. мс');
				this.setInputsInline(true);
				this.setPreviousStatement(true, null);
				this.setNextStatement(true, null);
				this.setColour(290);
				this.setTooltip('Генерирует звуковой тон');
			}
		};

		// Блок: noTone
		Blockly.Blocks['arduino_no_tone'] = {
			init: function() {
				this.appendDummyInput()
					.appendField('🔇 Выкл тон');
				this.appendValueInput('PIN')
					.setCheck('Number')
					.appendField('пин');
				this.setInputsInline(true);
				this.setPreviousStatement(true, null);
				this.setNextStatement(true, null);
				this.setColour(290);
				this.setTooltip('Выключает тон на пине');
			}
		};

		// Блок: Serial.print
		Blockly.Blocks['arduino_serial_print'] = {
			init: function() {
				this.appendValueInput('TEXT')
					.appendField('🖨️ Serial.print');
				this.setInputsInline(true);
				this.setPreviousStatement(true, null);
				this.setNextStatement(true, null);
				this.setColour(180);
				this.setTooltip('Вывод в Serial без переноса строки');
			}
		};

		// Блок: Serial.read
		Blockly.Blocks['arduino_serial_read'] = {
			init: function() {
				this.appendDummyInput()
					.appendField('📥 Serial.read()');
				this.setOutput(true, 'Number');
				this.setColour(180);
				this.setTooltip('Читает байт из Serial');
			}
		};

		// Блок: Serial.available
		Blockly.Blocks['arduino_serial_available'] = {
			init: function() {
				this.appendDummyInput()
					.appendField('📊 Serial.available()');
				this.setOutput(true, 'Number');
				this.setColour(180);
				this.setTooltip('Количество доступных байт');
			}
		};

		// Блок: constrain
		Blockly.Blocks['arduino_constrain'] = {
			init: function() {
				this.appendValueInput('VALUE')
					.setCheck('Number')
					.appendField('🔒 Ограничить');
				this.appendValueInput('MIN')
					.setCheck('Number')
					.appendField('мин');
				this.appendValueInput('MAX')
					.setCheck('Number')
					.appendField('макс');
				this.setInputsInline(true);
				this.setOutput(true, 'Number');
				this.setColour(230);
				this.setTooltip('Ограничивает значение диапазоном');
			}
		};

		// Блок: random
		Blockly.Blocks['arduino_random'] = {
			init: function() {
				this.appendValueInput('MIN')
					.setCheck('Number')
					.appendField('🎲 Случайное от');
				this.appendValueInput('MAX')
					.setCheck('Number')
					.appendField('до');
				this.setInputsInline(true);
				this.setOutput(true, 'Number');
				this.setColour(230);
				this.setTooltip('Генерирует случайное число');
			}
		};

		// Блок: PIR датчик движения
		Blockly.Blocks['sensor_pir'] = {
			init: function() {
				this.appendValueInput('PIN')
					.setCheck('Number')
					.appendField('🚶 PIR датчик пин');
				this.setInputsInline(true);
				this.setOutput(true, 'Boolean');
				this.setColour(120);
				this.setTooltip('Датчик движения (HIGH при обнаружении)');
			}
		};

		// Блок: фоторезистор
		Blockly.Blocks['sensor_ldr'] = {
			init: function() {
				this.appendValueInput('PIN')
					.setCheck('Number')
					.appendField('💡 Фоторезистор пин');
				this.setInputsInline(true);
				this.setOutput(true, 'Number');
				this.setColour(120);
				this.setTooltip('Читает освещенность (0-1023)');
			}
		};

		// Блок: серво attach
		Blockly.Blocks['actuator_servo_attach'] = {
			init: function() {
				this.appendValueInput('PIN')
					.setCheck('Number')
					.appendField('🔧 Подключить серво пин');
				this.setInputsInline(true);
				this.setPreviousStatement(true, null);
				this.setNextStatement(true, null);
				this.setColour(300);
				this.setTooltip('Подключает сервопривод');
			}
		};

		// Блок: RGB светодиод
		Blockly.Blocks['output_rgb_led'] = {
			init: function() {
				this.appendDummyInput()
					.appendField('🌈 RGB светодиод');
				this.appendValueInput('RED')
					.setCheck('Number')
					.appendField('R пин');
				this.appendValueInput('GREEN')
					.setCheck('Number')
					.appendField('G пин');
				this.appendValueInput('BLUE')
					.setCheck('Number')
					.appendField('B пин');
				this.appendValueInput('RED_VAL')
					.setCheck('Number')
					.appendField('R (0-255)');
				this.appendValueInput('GREEN_VAL')
					.setCheck('Number')
					.appendField('G (0-255)');
				this.appendValueInput('BLUE_VAL')
					.setCheck('Number')
					.appendField('B (0-255)');
				this.setInputsInline(true);
				this.setPreviousStatement(true, null);
				this.setNextStatement(true, null);
				this.setColour(330);
				this.setTooltip('Управляет RGB светодиодом');
			}
		};

		// Блок: зуммер
		Blockly.Blocks['output_buzzer'] = {
			init: function() {
				this.appendDummyInput()
					.appendField('🔔 Зуммер');
				this.appendValueInput('PIN')
					.setCheck('Number')
					.appendField('пин');
				this.appendValueInput('FREQUENCY')
					.setCheck('Number')
					.appendField('частота Гц');
				this.appendValueInput('DURATION')
					.setCheck('Number')
					.appendField('длит. мс');
				this.setInputsInline(true);
				this.setPreviousStatement(true, null);
				this.setNextStatement(true, null);
				this.setColour(290);
				this.setTooltip('Пищит зуммером');
			}
		};

		// Блок: реле
		Blockly.Blocks['output_relay'] = {
			init: function() {
				this.appendDummyInput()
					.appendField('⚡ Реле');
				this.appendValueInput('PIN')
					.setCheck('Number')
					.appendField('пин');
				this.appendDummyInput()
					.appendField('состояние')
					.appendField(new Blockly.FieldDropdown([
						['ВКЛ', 'HIGH'],
						['ВЫКЛ', 'LOW']
					]), 'STATE');
				this.setInputsInline(true);
				this.setPreviousStatement(true, null);
				this.setNextStatement(true, null);
				this.setColour(0);
				this.setTooltip('Управляет реле');
			}
		};		
		
		
    }

    // Блоки для сенсоров и устройств
    defineSensorBlocks() {
        // Блок: DHT датчик
        Blockly.Blocks['sensor_dht_read'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🌡️ DHT датчик');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.appendDummyInput()
                    .appendField('тип')
                    .appendField(new Blockly.FieldDropdown([
                        ['DHT11', 'DHT11'],
                        ['DHT22', 'DHT22']
                    ]), 'TYPE');
                this.appendDummyInput()
                    .appendField('параметр')
                    .appendField(new Blockly.FieldDropdown([
                        ['температура', 'temperature'],
                        ['влажность', 'humidity']
                    ]), 'PARAM');
                this.setInputsInline(true);
                this.setOutput(true, 'Number');
                this.setColour(120);
                this.setTooltip('Читает данные с DHT датчика');
            }
        };

        // Блок: HC-SR04 ультразвуковой датчик
        Blockly.Blocks['sensor_ultrasonic'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📏 Ультразвук HC-SR04');
                this.appendValueInput('TRIG')
                    .setCheck('Number')
                    .appendField('триггер');
                this.appendValueInput('ECHO')
                    .setCheck('Number')
                    .appendField('эхо');
                this.setInputsInline(true);
                this.setOutput(true, 'Number');
                this.setColour(120);
                this.setTooltip('Измеряет расстояние в см');
            }
        };

        // Блок: Servo
        Blockly.Blocks['actuator_servo'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🔧 Серво');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.appendValueInput('ANGLE')
                    .setCheck('Number')
                    .appendField('угол (0-180)');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(300);
                this.setTooltip('Управляет сервоприводом');
            }
        };

        // Блок: LED
        Blockly.Blocks['output_led'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('💡 Светодиод');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.appendDummyInput()
                    .appendField('состояние')
                    .appendField(new Blockly.FieldDropdown([
                        ['ВКЛ', 'HIGH'],
                        ['ВЫКЛ', 'LOW']
                    ]), 'STATE');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(330);
                this.setTooltip('Включает/выключает светодиод');
            }
        };
    }

    // Определение пользовательских блоков из хранилища
    defineCustomBlocks() {
        this.customBlocks.forEach(block => {
            Blockly.Blocks[block.id] = {
                init: function() {
                    this.appendDummyInput()
                        .appendField('🔧 ' + block.name);
                    this.appendValueInput('VALUE')
                        .setCheck('Number')
                        .appendField('значение');
                    this.setInputsInline(true);
                    this.setPreviousStatement(true, null);
                    this.setNextStatement(true, null);
                    this.setColour(280);
                    this.setTooltip(block.name);
                }
            };
        });
    }

    // Получение конфигурации toolbox
    getToolboxConfig() {
        const config = {
            kind: 'categoryToolbox',
            contents: [
                {
                    kind: 'category',
                    name: 'Управление',
                    colour: '#5c6bc0',
                    contents: [
                        { kind: 'block', type: 'controls_if' },
                        { kind: 'block', type: 'controls_repeat_ext' },
                        { kind: 'block', type: 'controls_whileUntil' },
                        { kind: 'block', type: 'controls_for' },
                    ]
                },
                {
                    kind: 'category',
                    name: 'Arduino Пины',
                    colour: '#26a69a',
                    contents: [
                        { kind: 'block', type: 'arduino_pin_mode' },
                        { kind: 'block', type: 'arduino_digital_write' },
                        { kind: 'block', type: 'arduino_digital_read' },
                        { kind: 'block', type: 'arduino_analog_write' },
                        { kind: 'block', type: 'arduino_analog_read' },
                    ]
                },
                {
                    kind: 'category',
                    name: 'Время',
                    colour: '#ef6c00',
                    contents: [
                        { kind: 'block', type: 'arduino_delay' },
                        { kind: 'block', type: 'arduino_millis' },
                    ]
                },
                {
                    kind: 'category',
                    name: 'Serial',
                    colour: '#ab47bc',
                    contents: [
                        { kind: 'block', type: 'arduino_serial_begin' },
                        { kind: 'block', type: 'arduino_serial_println' },
                    ]
                },
                {
                    kind: 'category',
                    name: 'Сенсоры',
                    colour: '#66bb6a',
                    contents: [
                        { kind: 'block', type: 'sensor_dht_read' },
                        { kind: 'block', type: 'sensor_ultrasonic' },
                    ]
                },
                {
                    kind: 'category',
                    name: 'Устройства',
                    colour: '#ef5350',
                    contents: [
                        { kind: 'block', type: 'actuator_servo' },
                        { kind: 'block', type: 'output_led' },
                    ]
                },
                {
                    kind: 'category',
                    name: 'Математика',
                    colour: '#42a5f5',
                    contents: [
                        { kind: 'block', type: 'math_number' },
                        { kind: 'block', type: 'math_arithmetic' },
                        { kind: 'block', type: 'arduino_map' },
                    ]
                },
                {
                    kind: 'category',
                    name: 'Переменные',
                    custom: 'VARIABLE',
                    colour: '#ffa726',
                },
            ]
        };

        // Добавляем пользовательские блоки
        if (this.customBlocks.length > 0) {
            config.contents.push({
                kind: 'category',
                name: 'Мои блоки',
                colour: '#78909c',
                contents: this.customBlocks.map(b => ({
                    kind: 'block',
                    type: b.id
                }))
            });
        }

        return config;
    }
}

const blocksManager = new BlocksManager();