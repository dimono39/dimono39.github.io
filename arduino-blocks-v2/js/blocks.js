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
                blocks: []  // Специальная категория
            },
            {
                id: 'functions',
                name: 'Функции',
                icon: 'fa-function',
                color: '#9E9E9E',
                blocks: []  // Специальная категория
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
        
        // Добавляем в категорию если нужно
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

    // Блок "Программа Arduino" - начало и конец
    defineProgramBlocks() {
        Blockly.Blocks['arduino_setup_loop'] = {
            init: function() {
                this.appendDummyInput('TITLE')
                    .appendField('🚀 Программа Arduino')
                    .appendField(new Blockly.FieldTextInput('Моя программа'), 'NAME');
                this.appendStatementInput('SETUP')
                    .setCheck(null)
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

    // Блоки Arduino (пины, время, Serial)
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
                this.setTooltip('Устанавливает режим работы пина:\nINPUT - вход\nOUTPUT - выход\nINPUT_PULLUP - вход с подтяжкой к питанию');
            }
        };

        // Блок: digitalWrite
        Blockly.Blocks['arduino_digital_write'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('💡 Установить пин');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.appendDummyInput()
                    .appendField('в')
                    .appendField(new Blockly.FieldDropdown([
                        ['HIGH (вкл)', 'HIGH'],
                        ['LOW (выкл)', 'LOW']
                    ]), 'VALUE');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(0);
                this.setTooltip('Устанавливает цифровое значение на пине:\nHIGH - высокий уровень (5В/3.3В)\nLOW - низкий уровень (0В)');
            }
        };

        // Блок: digitalRead
        Blockly.Blocks['arduino_digital_read'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📖 Прочитать цифровой пин');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.setInputsInline(true);
                this.setOutput(true, 'Boolean');
                this.setColour(0);
                this.setTooltip('Читает цифровое значение с пина\nВозвращает HIGH или LOW');
            }
        };

        // Блок: analogWrite (ШИМ)
        Blockly.Blocks['arduino_analog_write'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📊 ШИМ сигнал');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.appendValueInput('VALUE')
                    .setCheck('Number')
                    .appendField('значение');
                this.appendDummyInput()
                    .appendField('(0-255)');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(0);
                this.setTooltip('Устанавливает ШИМ (PWM) значение на пине\n0 - 0%, 255 - 100%');
            }
        };

        // Блок: analogRead
        Blockly.Blocks['arduino_analog_read'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📈 Прочитать аналоговый пин');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.setInputsInline(true);
                this.setOutput(true, 'Number');
                this.setColour(0);
                this.setTooltip('Читает аналоговое значение с пина\nВозвращает значение от 0 до 1023');
            }
        };

        // Блок: delay
        Blockly.Blocks['arduino_delay'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('⏱️ Пауза');
                this.appendValueInput('TIME')
                    .setCheck('Number')
                    .appendField('мс');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(220);
                this.setTooltip('Приостанавливает выполнение программы\nна указанное количество миллисекунд\n1000 мс = 1 секунда');
            }
        };

        // Блок: delayMicroseconds
        Blockly.Blocks['arduino_delay_microseconds'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('⏱️ Микро-пауза');
                this.appendValueInput('TIME')
                    .setCheck('Number')
                    .appendField('мкс');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(220);
                this.setTooltip('Пауза в микросекундах\n1000 мкс = 1 мс');
            }
        };

        // Блок: millis
        Blockly.Blocks['arduino_millis'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('⏲️ Время работы (мс)');
                this.setOutput(true, 'Number');
                this.setColour(220);
                this.setTooltip('Возвращает количество миллисекунд\nс момента запуска программы');
            }
        };

        // Блок: micros
        Blockly.Blocks['arduino_micros'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('⏲️ Время работы (мкс)');
                this.setOutput(true, 'Number');
                this.setColour(220);
                this.setTooltip('Возвращает количество микросекунд\nс момента запуска программы');
            }
        };

        // Блок: Serial.begin
        Blockly.Blocks['arduino_serial_begin'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📡 Инициализировать Serial');
                this.appendValueInput('SPEED')
                    .setCheck('Number')
                    .appendField('скорость');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(180);
                this.setTooltip('Инициализация последовательного порта\nСтандартные скорости: 9600, 115200');
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
                this.setTooltip('Выводит данные в последовательный порт\nбез перевода строки');
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
                this.setTooltip('Выводит данные в последовательный порт\nс переводом строки');
            }
        };

        // Блок: Serial.read
        Blockly.Blocks['arduino_serial_read'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📥 Прочитать байт из Serial');
                this.setOutput(true, 'Number');
                this.setColour(180);
                this.setTooltip('Читает один байт из последовательного порта');
            }
        };

        // Блок: Serial.available
        Blockly.Blocks['arduino_serial_available'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📊 Байт доступно в Serial');
                this.setOutput(true, 'Number');
                this.setColour(180);
                this.setTooltip('Возвращает количество байт,\nдоступных для чтения из Serial');
            }
        };

        // Блок: tone
        Blockly.Blocks['arduino_tone'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🔊 Издать тон');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.appendValueInput('FREQUENCY')
                    .setCheck('Number')
                    .appendField('частота (Гц)');
                this.appendValueInput('DURATION')
                    .setCheck('Number')
                    .appendField('длительность (мс)');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(290);
                this.setTooltip('Генерирует звуковой сигнал\n440 Гц = нота Ля');
            }
        };

        // Блок: noTone
        Blockly.Blocks['arduino_no_tone'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🔇 Выключить тон');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(290);
                this.setTooltip('Выключает звук на указанном пине');
            }
        };

        // Блок: map
        Blockly.Blocks['arduino_map'] = {
            init: function() {
                this.appendValueInput('VALUE')
                    .setCheck('Number')
                    .appendField('🗺️ Преобразовать');
                this.appendValueInput('FROM_LOW')
                    .setCheck('Number')
                    .appendField('из [');
                this.appendValueInput('FROM_HIGH')
                    .setCheck('Number')
                    .appendField('...');
                this.appendValueInput('TO_LOW')
                    .setCheck('Number')
                    .appendField('] в [');
                this.appendValueInput('TO_HIGH')
                    .setCheck('Number')
                    .appendField('...');
                this.appendDummyInput()
                    .appendField(']');
                this.setInputsInline(true);
                this.setOutput(true, 'Number');
                this.setColour(230);
                this.setTooltip('Преобразует значение из одного диапазона в другой\nПример: map(x, 0, 1023, 0, 255)');
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
                    .appendField('от');
                this.appendValueInput('MAX')
                    .setCheck('Number')
                    .appendField('до');
                this.setInputsInline(true);
                this.setOutput(true, 'Number');
                this.setColour(230);
                this.setTooltip('Ограничивает значение заданным диапазоном');
            }
        };

        // Блок: random
        Blockly.Blocks['arduino_random'] = {
            init: function() {
                this.appendValueInput('MIN')
                    .setCheck('Number')
                    .appendField('🎲 Случайное число от');
                this.appendValueInput('MAX')
                    .setCheck('Number')
                    .appendField('до');
                this.setInputsInline(true);
                this.setOutput(true, 'Number');
                this.setColour(230);
                this.setTooltip('Генерирует случайное целое число\nв заданном диапазоне');
            }
        };
    }

    // Блоки сенсоров
    defineSensorBlocks() {
        // Блок: DHT датчик температуры и влажности
        Blockly.Blocks['sensor_dht_read'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🌡️ Датчик DHT');
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
                        ['🌡️ температура °C', 'temperature'],
                        ['💧 влажность %', 'humidity']
                    ]), 'PARAM');
                this.setInputsInline(true);
                this.setOutput(true, 'Number');
                this.setColour(120);
                this.setTooltip('Читает данные с датчика DHT11/DHT22\nТемпература в градусах Цельсия\nВлажность в процентах');
            }
        };

        // Блок: Ультразвуковой датчик HC-SR04
        Blockly.Blocks['sensor_ultrasonic'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('📏 Ультразвук HC-SR04');
                this.appendValueInput('TRIG')
                    .setCheck('Number')
                    .appendField('Trig пин');
                this.appendValueInput('ECHO')
                    .setCheck('Number')
                    .appendField('Echo пин');
                this.setInputsInline(true);
                this.setOutput(true, 'Number');
                this.setColour(120);
                this.setTooltip('Измеряет расстояние в сантиметрах\nс помощью ультразвукового датчика');
            }
        };

        // Блок: PIR датчик движения
        Blockly.Blocks['sensor_pir'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🚶 Датчик движения PIR');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.setInputsInline(true);
                this.setOutput(true, 'Boolean');
                this.setColour(120);
                this.setTooltip('Датчик движения\nВозвращает HIGH при обнаружении движения');
            }
        };

        // Блок: Фоторезистор (LDR)
        Blockly.Blocks['sensor_ldr'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('💡 Датчик освещенности');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.setInputsInline(true);
                this.setOutput(true, 'Number');
                this.setColour(120);
                this.setTooltip('Читает уровень освещенности\nЗначения от 0 (темно) до 1023 (светло)');
            }
        };
    }

    // Блоки устройств
    defineActuatorBlocks() {
        // Блок: Сервопривод
        Blockly.Blocks['actuator_servo_attach'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🔧 Подключить серво');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(300);
                this.setTooltip('Подключает сервопривод к указанному пину\nНеобходимо вызвать перед использованием серво');
            }
        };

        Blockly.Blocks['actuator_servo'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🔧 Повернуть серво');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.appendValueInput('ANGLE')
                    .setCheck('Number')
                    .appendField('угол');
                this.appendDummyInput()
                    .appendField('° (0-180)');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(300);
                this.setTooltip('Устанавливает угол поворота сервопривода\n0° - крайнее левое положение\n180° - крайнее правое положение');
            }
        };

        // Блок: Светодиод
        Blockly.Blocks['output_led'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('💡 Светодиод');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.appendDummyInput()
                    .appendField(new Blockly.FieldDropdown([
                        ['⭐ ВКЛЮЧИТЬ', 'HIGH'],
                        ['⚫ ВЫКЛЮЧИТЬ', 'LOW']
                    ]), 'STATE');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(330);
                this.setTooltip('Управляет светодиодом\nВКЛ - подает HIGH на пин\nВЫКЛ - подает LOW на пин');
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
                    .appendField('R знач (0-255)');
                this.appendValueInput('GREEN_VAL')
                    .setCheck('Number')
                    .appendField('G знач (0-255)');
                this.appendValueInput('BLUE_VAL')
                    .setCheck('Number')
                    .appendField('B знач (0-255)');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(330);
                this.setTooltip('Управляет RGB светодиодом\nКаждый цвет задается значением 0-255');
            }
        };

        // Блок: Зуммер (пищалка)
        Blockly.Blocks['output_buzzer'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🔔 Зуммер');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.appendValueInput('FREQUENCY')
                    .setCheck('Number')
                    .appendField('частота (Гц)');
                this.appendValueInput('DURATION')
                    .setCheck('Number')
                    .appendField('длит. (мс)');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(290);
                this.setTooltip('Издает звук с помощью пьезоизлучателя\n440 Гц - нота Ля');
            }
        };

        // Блок: Реле
        Blockly.Blocks['output_relay'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('⚡ Реле');
                this.appendValueInput('PIN')
                    .setCheck('Number')
                    .appendField('пин');
                this.appendDummyInput()
                    .appendField(new Blockly.FieldDropdown([
                        ['⚡ ВКЛЮЧИТЬ', 'HIGH'],
                        ['🔌 ВЫКЛЮЧИТЬ', 'LOW']
                    ]), 'STATE');
                this.setInputsInline(true);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(0);
                this.setTooltip('Управляет релейным модулем\nВКЛ - замыкает контакты\nВЫКЛ - размыкает контакты');
            }
        };
    }

    // Определение пользовательских блоков
    defineCustomBlocks() {
        this.customBlocks.forEach(blockData => {
            this.defineCustomBlock(blockData);
        });
    }

    defineCustomBlock(blockData) {
        Blockly.Blocks[blockData.id] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('🔧 ' + blockData.name);
                
                if (blockData.type === 'statement') {
                    this.appendValueInput('PIN')
                        .setCheck('Number')
                        .appendField('пин');
                    this.appendValueInput('VALUE')
                        .setCheck('Number')
                        .appendField('значение');
                    this.setInputsInline(true);
                    this.setPreviousStatement(true, null);
                    this.setNextStatement(true, null);
                } else {
                    this.appendValueInput('VALUE')
                        .setCheck('Number')
                        .appendField('значение');
                    this.setInputsInline(true);
                    this.setOutput(true, 'Number');
                }
                
                this.setColour(blockData.color || '#6c5ce7');
                this.setTooltip(blockData.name);
            }
        };
    }

    // Получение конфигурации тулбокса для Blockly
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
                const categoryContents = [];
                
                category.blocks.forEach(blockType => {
                    if (blockType === 'controls_if') {
                        categoryContents.push({ kind: 'block', type: 'controls_if' });
                        categoryContents.push({ kind: 'block', type: 'controls_ifelse' });
                    } else {
                        categoryContents.push({ kind: 'block', type: blockType });
                    }
                });
                
                contents.push({
                    kind: 'category',
                    name: category.name,
                    colour: category.color,
                    contents: categoryContents
                });
            }
        });
        
        return {
            kind: 'categoryToolbox',
            contents: contents
        };
    }

    // Поиск блоков по названию
    searchBlocks(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        this.blockCategories.forEach(category => {
            const matchedBlocks = category.blocks.filter(blockType => {
                // Проверяем название блока
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
            'arduino_setup_loop': 'Программа Arduino (начало/конец)',
            'arduino_pin_mode': 'Режим пина (pinMode)',
            'arduino_digital_write': 'Цифровой выход (digitalWrite)',
            'arduino_digital_read': 'Цифровой вход (digitalRead)',
            'arduino_analog_write': 'Аналоговый выход ШИМ (analogWrite)',
            'arduino_analog_read': 'Аналоговый вход (analogRead)',
            'arduino_delay': 'Пауза (delay)',
            'arduino_delay_microseconds': 'Микро-пауза (delayMicroseconds)',
            'arduino_millis': 'Миллисекунды (millis)',
            'arduino_micros': 'Микросекунды (micros)',
            'arduino_serial_begin': 'Инициализация Serial',
            'arduino_serial_print': 'Вывод в Serial',
            'arduino_serial_println': 'Вывод в Serial с новой строки',
            'arduino_serial_read': 'Чтение из Serial',
            'arduino_serial_available': 'Проверка Serial',
            'arduino_tone': 'Звуковой тон (tone)',
            'arduino_no_tone': 'Выключить тон (noTone)',
            'arduino_map': 'Преобразование диапазона (map)',
            'arduino_constrain': 'Ограничение (constrain)',
            'arduino_random': 'Случайное число (random)',
            'sensor_dht_read': 'Датчик температуры DHT',
            'sensor_ultrasonic': 'Ультразвуковой датчик HC-SR04',
            'sensor_pir': 'Датчик движения PIR',
            'sensor_ldr': 'Датчик освещенности',
            'actuator_servo_attach': 'Подключить сервопривод',
            'actuator_servo': 'Повернуть сервопривод',
            'output_led': 'Светодиод',
            'output_rgb_led': 'RGB светодиод',
            'output_buzzer': 'Зуммер',
            'output_relay': 'Реле',
        };
        
        return names[blockType] || null;
    }
}

const blocksManager = new BlocksManager();