import React, { useState, useEffect } from 'react';
import './LogicBuilder.css';

const CONDITION_TYPES = {
  SENSOR: 'SENSOR',
  TIME: 'TIME',
  INTERVAL: 'INTERVAL',
  STARTUP: 'STARTUP'
};

const OPERATORS = {
  DIGITAL: ['==', '!='],
  ANALOG: ['==', '!=', '>', '<', '>=', '<='],
  TIME: ['DAILY_AT', 'WEEKLY_ON', 'TIME_AFTER', 'TIME_BEFORE', 'TIME_EQUALS', 'TIME_BETWEEN'],
  INTERVAL: ['EVERY']
};

const CONDITIONS = {
  DIGITAL: ['HIGH', 'LOW'],
  ANALOG: [] // Values will be handled by number input
};

const ACTIONS = {
  DIGITAL: ['HIGH', 'LOW', 'TOGGLE'],
  PWM: ['setValue', 'increment', 'decrement'],
  SERVO: ['setAngle', 'sweep'],
  COMPLEX: ['sequence', 'conditional']
};

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' }
];

// Helper function for time formatting
const formatTime = (timeString) => {
  if (!timeString) return '';
  
  try {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  } catch (e) {
    return timeString;
  }
};

// Helper function to get device icon based on device type/id
const getDeviceIcon = (device) => {
  if (!device || !device.id) return '📌';
  
  const deviceId = device.id.split('-')[0];
  
  const iconMap = {
    'button': '🔘',
    'potentiometer': '🎚️',
    'dht11': '🌡️',
    'dht22': '🌡️',
    'ultrasonic': '📏',
    'ldr': '💡',
    'pir': '👁️',
    'touch': '👆',
    'joystick': '🕹️',
    'soil': '🌱',
    'gas': '☁️',
    'accelerometer': '📲',
    'led': '💡',
    'servo': '⚙️',
    'relay': '🔌',
    'buzzer': '🔊',
    'rgb_led': '🌈',
    'lcd': '📟',
    'oled': '📱',
    'stepper': '🔄',
    'dc_motor': '🔋',
    'neopixel': '✨',
    'seven_segment': '🔢',
    'vibration': '📳'
  };
  
  return iconMap[deviceId] || '📌';
};

function LogicBuilder({ selectedDevices, onLogicChange, logicConditions }) {
  const [conditions, setConditions] = useState(logicConditions || []);
  const [currentCondition, setCurrentCondition] = useState({
    type: 'SENSOR',
    input: '',
    operator: '',
    value: '',
    output: '',
    action: '',
    actionValue: '',
    timeValue: '',
    timeEndValue: '',
    weekDay: '',
    intervalValue: '',
    intervalUnit: 'seconds',
    description: '',
    priority: 'normal'
  });
  
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [editingCondition, setEditingCondition] = useState(null);
  const [viewMode, setViewMode] = useState('visual'); // 'visual' or 'code'
  const [showHints, setShowHints] = useState(true);
  const [activePanel, setActivePanel] = useState('create'); // 'create' or 'list'
  
  // For small screens
  const [showMobileCreate, setShowMobileCreate] = useState(false);

  useEffect(() => {
    // Validate that all devices have pins assigned
    const invalidInputs = selectedDevices.inputs.filter(device => 
      device.pin === null || device.pin === undefined
    );
    const invalidOutputs = selectedDevices.outputs.filter(device => 
      device.pin === null || device.pin === undefined
    );

    setIsValid(invalidInputs.length === 0 && invalidOutputs.length === 0);
    if (invalidInputs.length > 0 || invalidOutputs.length > 0) {
      setError('Some devices have no pins assigned. Please assign pins to all devices before creating logic.');
    } else {
      setError('');
    }
  }, [selectedDevices]);

  // Load a condition for editing
  useEffect(() => {
    if (editingCondition) {
      const condition = conditions.find(c => c.id === editingCondition);
      if (condition) {
        let loadedCondition = {
          type: condition.type,
          output: condition.output.device.id,
          action: condition.output.action,
          actionValue: condition.output.value || '',
          description: condition.description || '',
          priority: condition.priority || 'normal'
        };
        
        if (condition.type === 'SENSOR') {
          loadedCondition = {
            ...loadedCondition,
            input: condition.input.device.id,
            operator: condition.input.operator,
            value: condition.input.value,
          };
        } else if (condition.type === 'TIME') {
          loadedCondition = {
            ...loadedCondition,
            operator: condition.input.operator,
            timeValue: condition.input.timeValue,
            timeEndValue: condition.input.timeEndValue || '',
            weekDay: condition.input.weekDay || '',
          };
        } else if (condition.type === 'INTERVAL') {
          loadedCondition = {
            ...loadedCondition,
            intervalValue: condition.input.intervalValue,
            intervalUnit: condition.input.intervalUnit || 'seconds',
          };
        }
        
        setCurrentCondition(loadedCondition);
      }
    }
  }, [editingCondition, conditions]);

  const handleInputChange = (field, value) => {
    setError('');
    setCurrentCondition(prev => {
      const updated = { ...prev, [field]: value };
      
      // Reset dependent fields
      if (field === 'type') {
        updated.input = '';
        updated.operator = '';
        updated.value = '';
        updated.timeValue = '';
        updated.timeEndValue = '';
        updated.weekDay = '';
        updated.intervalValue = '';
        updated.intervalUnit = 'seconds';
      } else if (field === 'operator' && updated.type === 'TIME') {
        updated.timeValue = '';
        updated.timeEndValue = '';
        updated.weekDay = '';
      } else if (field === 'output') {
        updated.action = '';
        updated.actionValue = '';
      }

      return updated;
    });
  };

  const validateCondition = () => {
    const { 
      type, 
      input, 
      operator, 
      value, 
      output, 
      action, 
      timeValue,
      timeEndValue, 
      weekDay,
      intervalValue,
      description
    } = currentCondition;
    
    if (!description.trim()) return 'Please provide a brief description for the condition';
    
    if (type === 'SENSOR') {
      if (!input) return 'Please select an input device';
      if (!operator) return 'Please select an operator';
      if (value === '') return 'Please enter a value';
    } else if (type === 'TIME') {
      if (!operator) return 'Please select a time condition';
      if (!timeValue) return 'Please select a time';
      if (operator === 'TIME_BETWEEN' && !timeEndValue) return 'Please select end time';
      if (operator === 'WEEKLY_ON' && !weekDay) return 'Please select a day of the week';
    } else if (type === 'INTERVAL') {
      if (!intervalValue || intervalValue <= 0) return 'Please enter a valid interval value';
    }
    
    if (!output) return 'Please select an output device';
    if (!action) return 'Please select an action';
    
    const outputDevice = getSelectedDevice(output, 'output');
    if (outputDevice?.type === 'pwm' && action === 'setValue' && currentCondition.actionValue === '') {
      return 'Please enter an action value';
    }
    
    if (outputDevice?.id.includes('servo') && action === 'setAngle' && (currentCondition.actionValue === '' || currentCondition.actionValue < 0 || currentCondition.actionValue > 180)) {
      return 'Please enter a valid angle between 0 and 180';
    }

    return null;
  };

  const getSelectedDevice = (deviceId, type) => {
    const devices = type === 'input' ? selectedDevices.inputs : selectedDevices.outputs;
    return devices.find(d => d.id === deviceId);
  };

  const handleAddCondition = () => {
    const validationError = validateCondition();
    if (validationError) {
      setError(validationError);
      return;
    }

    let newCondition = {
      id: editingCondition || Date.now(),
      type: currentCondition.type,
      description: currentCondition.description,
      priority: currentCondition.priority,
      output: {
        device: getSelectedDevice(currentCondition.output, 'output'),
        action: currentCondition.action,
        value: currentCondition.actionValue,
        type: getSelectedDevice(currentCondition.output, 'output')?.type
      }
    };
    
    if (currentCondition.type === 'SENSOR') {
      newCondition.input = {
        device: getSelectedDevice(currentCondition.input, 'input'),
        operator: currentCondition.operator,
        value: currentCondition.value,
        type: getSelectedDevice(currentCondition.input, 'input')?.type
      };
    } else if (currentCondition.type === 'TIME') {
      newCondition.input = {
        operator: currentCondition.operator,
        timeValue: currentCondition.timeValue,
        timeEndValue: currentCondition.timeEndValue,
        weekDay: currentCondition.weekDay
      };
    } else if (currentCondition.type === 'INTERVAL') {
      newCondition.input = {
        intervalValue: currentCondition.intervalValue,
        intervalUnit: currentCondition.intervalUnit
      };
    } else if (currentCondition.type === 'STARTUP') {
      newCondition.input = {
        type: 'STARTUP'
      };
    }

    let updatedConditions;
    if (editingCondition) {
      updatedConditions = conditions.map(c => 
        c.id === editingCondition ? newCondition : c
      );
    } else {
      updatedConditions = [...conditions, newCondition];
    }
    
    setConditions(updatedConditions);
    onLogicChange(updatedConditions);

    // Reset form
    setCurrentCondition({
      type: 'SENSOR',
      input: '',
      operator: '',
      value: '',
      output: '',
      action: '',
      actionValue: '',
      timeValue: '',
      timeEndValue: '',
      weekDay: '',
      intervalValue: '',
      intervalUnit: 'seconds',
      description: '',
      priority: 'normal'
    });
    
    setEditingCondition(null);
    setShowMobileCreate(false);
  };

  const handleEditCondition = (id) => {
    setEditingCondition(id);
    setActivePanel('create');
    setShowMobileCreate(true);
  };

  const handleCancelEdit = () => {
    setEditingCondition(null);
    setCurrentCondition({
      type: 'SENSOR',
      input: '',
      operator: '',
      value: '',
      output: '',
      action: '',
      actionValue: '',
      timeValue: '',
      timeEndValue: '',
      weekDay: '',
      intervalValue: '',
      intervalUnit: 'seconds',
      description: '',
      priority: 'normal'
    });
  };

  const handleRemoveCondition = (id) => {
    const updatedConditions = conditions.filter(c => c.id !== id);
    setConditions(updatedConditions);
    onLogicChange(updatedConditions);
    
    if (editingCondition === id) {
      handleCancelEdit();
    }
  };

  const handleMoveCondition = (id, direction) => {
    const index = conditions.findIndex(c => c.id === id);
    if ((index === 0 && direction === -1) || 
        (index === conditions.length - 1 && direction === 1)) {
      return;
    }
    
    const newIndex = index + direction;
    const updatedConditions = [...conditions];
    [updatedConditions[index], updatedConditions[newIndex]] = 
      [updatedConditions[newIndex], updatedConditions[index]];
    
    setConditions(updatedConditions);
    onLogicChange(updatedConditions);
  };

  const renderTimeInput = () => {
    const { operator } = currentCondition;
    
    return (
      <div className="time-inputs">
        {operator === 'WEEKLY_ON' && (
          <select
            value={currentCondition.weekDay}
            onChange={(e) => handleInputChange('weekDay', e.target.value)}
            className="logic-dropdown"
          >
            <option value="">Select Day</option>
            {DAYS_OF_WEEK.map(day => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        )}
        <div className="time-input-group">
          <input
            type="time"
            value={currentCondition.timeValue}
            onChange={(e) => handleInputChange('timeValue', e.target.value)}
            className="logic-input time-input"
            required
          />
          {operator === 'TIME_BETWEEN' && (
            <>
              <span className="time-separator">to</span>
              <input
                type="time"
                value={currentCondition.timeEndValue}
                onChange={(e) => handleInputChange('timeEndValue', e.target.value)}
                className="logic-input time-input"
                required
              />
            </>
          )}
        </div>
      </div>
    );
  };

  const renderIntervalInput = () => {
    return (
      <div className="interval-inputs">
        <input
          type="number"
          value={currentCondition.intervalValue}
          onChange={(e) => handleInputChange('intervalValue', e.target.value)}
          placeholder="Enter interval"
          className="logic-input interval-input"
          min="1"
        />
        <select
          value={currentCondition.intervalUnit}
          onChange={(e) => handleInputChange('intervalUnit', e.target.value)}
          className="logic-dropdown unit-dropdown"
        >
          <option value="milliseconds">Milliseconds</option>
          <option value="seconds">Seconds</option>
          <option value="minutes">Minutes</option>
          <option value="hours">Hours</option>
        </select>
      </div>
    );
  };

  const generateArduinoCode = () => {
    let code = `// Arduino Code for ESP32 Project\n`;
    code += `// Generated: ${new Date().toISOString()}\n\n`;

    // Include libraries based on device types
    const usedDeviceTypes = new Set();
    selectedDevices.inputs.forEach(device => {
      const baseId = device.id.split('-')[0];
      usedDeviceTypes.add(baseId);
    });
    selectedDevices.outputs.forEach(device => {
      const baseId = device.id.split('-')[0];
      usedDeviceTypes.add(baseId);
    });

    // Add includes
    if (usedDeviceTypes.has('servo')) {
      code += `#include <Servo.h>\n`;
    }
    if (usedDeviceTypes.has('dht11') || usedDeviceTypes.has('dht22')) {
      code += `#include <DHT.h>\n`;
    }
    if (usedDeviceTypes.has('lcd')) {
      code += `#include <LiquidCrystal_I2C.h>\n`;
    }
    if (usedDeviceTypes.has('oled')) {
      code += `#include <Adafruit_SSD1306.h>\n`;
    }
    if (usedDeviceTypes.has('rgb_led') || usedDeviceTypes.has('neopixel')) {
      code += `#include <Adafruit_NeoPixel.h>\n`;
    }
    
    // Time-based conditions need time library
    if (conditions.some(c => c.type === 'TIME')) {
      code += `#include <TimeLib.h>\n`;
      code += `#include <WiFi.h>\n`;
    }
    
    code += `\n// Pin definitions\n`;
    
    // Define input pins
    if (selectedDevices.inputs.length) {
      selectedDevices.inputs.forEach(input => {
        if (input.pin !== null) {
          const baseId = input.id.split('-')[0];
          const constName = `${baseId.toUpperCase()}_PIN`;
          code += `const int ${constName} = ${input.pin};\n`;
        }
      });
    }
    
    // Define output pins
    if (selectedDevices.outputs.length) {
      selectedDevices.outputs.forEach(output => {
        if (output.pin !== null) {
          const baseId = output.id.split('-')[0];
          const constName = `${baseId.toUpperCase()}_PIN`;
          code += `const int ${constName} = ${output.pin};\n`;
        }
      });
    }
    
    // Create objects for special devices
    code += `\n// Device objects\n`;
    if (usedDeviceTypes.has('servo')) {
      const servos = selectedDevices.outputs.filter(d => d.id.includes('servo'));
      servos.forEach((servo, index) => {
        code += `Servo servo${index + 1};\n`;
      });
    }
    if (usedDeviceTypes.has('dht11') || usedDeviceTypes.has('dht22')) {
      const dhtSensors = selectedDevices.inputs.filter(d => 
        d.id.includes('dht11') || d.id.includes('dht22')
      );
      dhtSensors.forEach((sensor, index) => {
        const type = sensor.id.includes('dht11') ? "DHT11" : "DHT22";
        code += `DHT dht${index + 1}(${sensor.pin}, ${type});\n`;
      });
    }
    
    // Variables for interval conditions
    if (conditions.some(c => c.type === 'INTERVAL')) {
      code += `\n// Interval timers\n`;
      conditions.filter(c => c.type === 'INTERVAL').forEach((condition, index) => {
        code += `unsigned long previousMillis${index + 1} = 0;\n`;
      });
    }
    
    // Setup function
    code += `\nvoid setup() {\n  Serial.begin(115200);\n  \n`;
    
    // Configure pins
    code += `  // Configure pins\n`;
    selectedDevices.inputs.forEach(input => {
      if (input.pin !== null) {
        const baseId = input.id.split('-')[0];
        const mode = baseId === 'button' || baseId === 'pir' ? 'INPUT_PULLUP' : 'INPUT';
        code += `  pinMode(${input.pin}, ${mode});\n`;
      }
    });
    
    selectedDevices.outputs.forEach(output => {
      if (output.pin !== null && !output.id.includes('servo')) {
        code += `  pinMode(${output.pin}, OUTPUT);\n`;
      }
    });
    
    // Attach servos
    if (usedDeviceTypes.has('servo')) {
      code += `\n  // Attach servos\n`;
      const servos = selectedDevices.outputs.filter(d => d.id.includes('servo'));
      servos.forEach((servo, index) => {
        code += `  servo${index + 1}.attach(${servo.pin});\n`;
      });
    }
    
    // Initialize DHT sensors
    if (usedDeviceTypes.has('dht11') || usedDeviceTypes.has('dht22')) {
      code += `\n  // Initialize DHT sensors\n`;
      const dhtSensors = selectedDevices.inputs.filter(d => 
        d.id.includes('dht11') || d.id.includes('dht22')
      );
      dhtSensors.forEach((sensor, index) => {
        code += `  dht${index + 1}.begin();\n`;
      });
    }
    
    // Set up time sync for time-based conditions
    if (conditions.some(c => c.type === 'TIME')) {
      code += `\n  // Set up Wi-Fi and NTP for time sync\n`;
      code += `  // TODO: Add your Wi-Fi credentials\n`;
      code += `  WiFi.begin("YOUR_SSID", "YOUR_PASSWORD");\n`;
      code += `  \n`;
      code += `  // Wait for connection\n`;
      code += `  while (WiFi.status() != WL_CONNECTED) {\n`;
      code += `    delay(500);\n`;
      code += `    Serial.print(".");\n`;
      code += `  }\n`;
      code += `  Serial.println("\\nConnected to WiFi");\n`;
      code += `  \n`;
      code += `  // Sync time\n`;
      code += `  configTime(0, 0, "pool.ntp.org", "time.nist.gov");\n`;
    }
    
    // Initialize with startup conditions
    const startupConditions = conditions.filter(c => c.type === 'STARTUP');
    if (startupConditions.length > 0) {
      code += `\n  // Initialize devices based on startup conditions\n`;
      startupConditions.forEach(condition => {
        const { device, action, value } = condition.output;
        code += `  // ${condition.description}\n`;
        
        if (device.id.includes('servo')) {
          const servoIndex = selectedDevices.outputs
            .filter(d => d.id.includes('servo'))
            .findIndex(d => d.id === device.id) + 1;
            
          if (action === 'setAngle') {
            code += `  servo${servoIndex}.write(${value});\n`;
          }
        } else {
          if (action === 'HIGH') {
            code += `  digitalWrite(${device.pin}, HIGH);\n`;
          } else if (action === 'LOW') {
            code += `  digitalWrite(${device.pin}, LOW);\n`;
          } else if (action === 'setValue' && device.type === 'pwm') {
            code += `  analogWrite(${device.pin}, ${value});\n`;
          }
        }
      });
    }
    
    code += `}\n\n`;
    
    // Helper functions for special sensors
    if (usedDeviceTypes.has('dht11') || usedDeviceTypes.has('dht22')) {
      code += `// Helper function to read DHT temperature\n`;
      code += `float readDHTTemperature(int sensorIndex) {\n`;
      code += `  float temp = -999;\n`;
      code += `  switch (sensorIndex) {\n`;
      
      const dhtSensors = selectedDevices.inputs.filter(d => 
        d.id.includes('dht11') || d.id.includes('dht22')
      );
      
      dhtSensors.forEach((sensor, index) => {
        code += `    case ${index + 1}:\n`;
        code += `      temp = dht${index + 1}.readTemperature();\n`;
        code += `      break;\n`;
      });
      
      code += `  }\n`;
      code += `  return temp;\n`;
      code += `}\n\n`;
      
      code += `// Helper function to read DHT humidity\n`;
      code += `float readDHTHumidity(int sensorIndex) {\n`;
      code += `  float humidity = -999;\n`;
      code += `  switch (sensorIndex) {\n`;
      
      dhtSensors.forEach((sensor, index) => {
        code += `    case ${index + 1}:\n`;
        code += `      humidity = dht${index + 1}.readHumidity();\n`;
        code += `      break;\n`;
      });
      
      code += `  }\n`;
      code += `  return humidity;\n`;
      code += `}\n\n`;
    }
    
    // Loop function
    code += `void loop() {\n`;
    
    // Add sensor reading logic
    if (selectedDevices.inputs.length > 0) {
      code += `  // Read sensor values\n`;
      selectedDevices.inputs.forEach(input => {
        if (input.pin !== null) {
          const baseId = input.id.split('-')[0];
          
          if (baseId === 'button' || baseId === 'pir' || baseId === 'touch') {
            code += `  int ${baseId}Value = digitalRead(${input.pin});\n`;
          } else if (baseId === 'potentiometer' || baseId === 'ldr' || baseId === 'soil' || baseId === 'gas') {
            code += `  int ${baseId}Value = analogRead(${input.pin});\n`;
          } else if (baseId === 'ultrasonic') {
            // Ultrasonic sensors often need special handling
            code += `  // Ultrasonic sensor reading code would go here\n`;
          }
        }
      });
    }
    
    // Handle time-based conditions
    if (conditions.some(c => c.type === 'TIME')) {
      code += `\n  // Get current time\n`;
      code += `  struct tm timeinfo;\n`;
      code += `  getLocalTime(&timeinfo);\n`;
      code += `  int currentHour = timeinfo.tm_hour;\n`;
      code += `  int currentMinute = timeinfo.tm_min;\n`;
      code += `  int currentDay = timeinfo.tm_wday; // 0 = Sunday, 1 = Monday, etc.\n`;
    }
    
    // Add conditions
    if (conditions.length > 0) {
      code += `\n  // Check conditions and execute actions\n`;
      
      // Prioritize SENSOR conditions first, then TIME, then INTERVAL
      const conditionsByType = {
        SENSOR: conditions.filter(c => c.type === 'SENSOR'),
        TIME: conditions.filter(c => c.type === 'TIME'),
        INTERVAL: conditions.filter(c => c.type === 'INTERVAL')
      };
      
      // Process sensor conditions
      if (conditionsByType.SENSOR.length > 0) {
        code += `  // Process sensor-based conditions\n`;
        conditionsByType.SENSOR.forEach(condition => {
          const { device, operator, value, type } = condition.input;
          const { device: outputDevice, action, value: actionValue } = condition.output;
          
          code += `  // ${condition.description}\n`;
          
          // Input condition
          let conditionCode = '';
          const baseInputId = device.id.split('-')[0];
          
          if (type === 'digital') {
            // For digital sensors
            const compareValue = value === 'HIGH' ? 'HIGH' : 'LOW';
            conditionCode = `digitalRead(${device.pin}) ${operator} ${compareValue}`;
          } else if (type === 'analog') {
            // For analog sensors
            conditionCode = `${baseInputId}Value ${operator} ${value}`;
          }
          
          code += `  if (${conditionCode}) {\n`;
          
          // Output action
          if (outputDevice.id.includes('servo')) {
            const servoIndex = selectedDevices.outputs
              .filter(d => d.id.includes('servo'))
              .findIndex(d => d.id === outputDevice.id) + 1;
              
            if (action === 'setAngle') {
              code += `    servo${servoIndex}.write(${actionValue});\n`;
            } else if (action === 'sweep') {
              code += `    // Sweep servo code would go here\n`;
            }
          } else if (outputDevice.type === 'digital') {
            if (action === 'HIGH') {
              code += `    digitalWrite(${outputDevice.pin}, HIGH);\n`;
            } else if (action === 'LOW') {
              code += `    digitalWrite(${outputDevice.pin}, LOW);\n`;
            } else if (action === 'TOGGLE') {
              code += `    digitalWrite(${outputDevice.pin}, !digitalRead(${outputDevice.pin}));\n`;
            }
          } else if (outputDevice.type === 'pwm') {
            if (action === 'setValue') {
              code += `    analogWrite(${outputDevice.pin}, ${actionValue});\n`;
            } else if (action === 'increment') {
              code += `    // Increment PWM value (with bounds checking)\n`;
              code += `    int currentPWM = analogRead(${outputDevice.pin});\n`;
              code += `    analogWrite(${outputDevice.pin}, min(255, currentPWM + 10));\n`;
            } else if (action === 'decrement') {
              code += `    // Decrement PWM value (with bounds checking)\n`;
              code += `    int currentPWM = analogRead(${outputDevice.pin});\n`;
              code += `    analogWrite(${outputDevice.pin}, max(0, currentPWM - 10));\n`;
            }
          }
          
          code += `  }\n`;
        });
      }
      
      // Process time conditions
      if (conditionsByType.TIME.length > 0) {
        code += `\n  // Process time-based conditions\n`;
        conditionsByType.TIME.forEach(condition => {
          const { operator, timeValue, timeEndValue, weekDay } = condition.input;
          const { device: outputDevice, action, value: actionValue } = condition.output;
          
          code += `  // ${condition.description}\n`;
          
          // Parse time values
          const getTimeComponents = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return { hours, minutes };
          };
          
          let timeCondition = '';
          
          if (operator === 'DAILY_AT') {
            const { hours, minutes } = getTimeComponents(timeValue);
            timeCondition = `currentHour == ${hours} && currentMinute == ${minutes}`;
          } else if (operator === 'WEEKLY_ON') {
            const { hours, minutes } = getTimeComponents(timeValue);
            timeCondition = `currentDay == ${weekDay} && currentHour == ${hours} && currentMinute == ${minutes}`;
          } else if (operator === 'TIME_AFTER') {
            const { hours, minutes } = getTimeComponents(timeValue);
            timeCondition = `(currentHour > ${hours} || (currentHour == ${hours} && currentMinute >= ${minutes}))`;
          } else if (operator === 'TIME_BEFORE') {
            const { hours, minutes } = getTimeComponents(timeValue);
            timeCondition = `(currentHour < ${hours} || (currentHour == ${hours} && currentMinute < ${minutes}))`;
          } else if (operator === 'TIME_EQUALS') {
            const { hours, minutes } = getTimeComponents(timeValue);
            timeCondition = `currentHour == ${hours} && currentMinute == ${minutes}`;
          } else if (operator === 'TIME_BETWEEN') {
            const start = getTimeComponents(timeValue);
            const end = getTimeComponents(timeEndValue);
            
            // Time comparison logic
            timeCondition = `((currentHour > ${start.hours} || (currentHour == ${start.hours} && currentMinute >= ${start.minutes})) && `;
            timeCondition += `(currentHour < ${end.hours} || (currentHour == ${end.hours} && currentMinute <= ${end.minutes})))`;
          }
          
          code += `  if (${timeCondition}) {\n`;
          
          // Output action (same as sensor conditions)
          if (outputDevice.id.includes('servo')) {
            const servoIndex = selectedDevices.outputs
              .filter(d => d.id.includes('servo'))
              .findIndex(d => d.id === outputDevice.id) + 1;
              
            if (action === 'setAngle') {
              code += `    servo${servoIndex}.write(${actionValue});\n`;
            }
          } else if (outputDevice.type === 'digital') {
            if (action === 'HIGH') {
              code += `    digitalWrite(${outputDevice.pin}, HIGH);\n`;
            } else if (action === 'LOW') {
              code += `    digitalWrite(${outputDevice.pin}, LOW);\n`;
            } else if (action === 'TOGGLE') {
              code += `    digitalWrite(${outputDevice.pin}, !digitalRead(${outputDevice.pin}));\n`;
            }
          } else if (outputDevice.type === 'pwm') {
            if (action === 'setValue') {
              code += `    analogWrite(${outputDevice.pin}, ${actionValue});\n`;
            }
          }
          
          code += `  }\n`;
        });
      }
      
      // Process interval conditions
      if (conditionsByType.INTERVAL.length > 0) {
        code += `\n  // Process interval-based conditions\n`;
        code += `  unsigned long currentMillis = millis();\n`;
        
        conditionsByType.INTERVAL.forEach((condition, index) => {
          const { intervalValue, intervalUnit } = condition.input;
          const { device: outputDevice, action, value: actionValue } = condition.output;
          
          code += `  // ${condition.description}\n`;
          
          // Calculate interval in milliseconds
          let intervalMs = intervalValue;
          if (intervalUnit === 'seconds') intervalMs *= 1000;
          if (intervalUnit === 'minutes') intervalMs *= 60 * 1000;
          if (intervalUnit === 'hours') intervalMs *= 60 * 60 * 1000;
          
          code += `  if (currentMillis - previousMillis${index + 1} >= ${intervalMs}) {\n`;
          code += `    previousMillis${index + 1} = currentMillis;\n`;
          
          // Output action
          if (outputDevice.id.includes('servo')) {
            const servoIndex = selectedDevices.outputs
              .filter(d => d.id.includes('servo'))
              .findIndex(d => d.id === outputDevice.id) + 1;
              
            if (action === 'setAngle') {
              code += `    servo${servoIndex}.write(${actionValue});\n`;
            } else if (action === 'sweep') {
              code += `    // Add sweep code here\n`;
            }
          } else if (outputDevice.type === 'digital') {
            if (action === 'HIGH') {
              code += `    digitalWrite(${outputDevice.pin}, HIGH);\n`;
            } else if (action === 'LOW') {
              code += `    digitalWrite(${outputDevice.pin}, LOW);\n`;
            } else if (action === 'TOGGLE') {
              code += `    digitalWrite(${outputDevice.pin}, !digitalRead(${outputDevice.pin}));\n`;
            }
          } else if (outputDevice.type === 'pwm') {
            if (action === 'setValue') {
              code += `    analogWrite(${outputDevice.pin}, ${actionValue});\n`;
            }
          }
          
          code += `  }\n`;
        });
      }
    }
    
    code += `\n  // Small delay to stabilize the loop\n`;
    code += `  delay(10);\n`;
    code += `}\n`;
    
    return code;
  };

  return (
    <div className="logic-builder dark-theme">
      {/* Header */}
      <div className="builder-header">
        <div className="header-content">
          <h2>Logic Builder</h2>
          <div className="header-info">
            <div className="timestamp-user">
              User: goutham-shankar | 2025-05-16 16:51:57 UTC
            </div>
            <div className="device-summary">
              <span className="badge">{selectedDevices.inputs.length} Inputs</span>
              <span className="badge">{selectedDevices.outputs.length} Outputs</span>
              <span className="badge">{conditions.length} Rules</span>
            </div>
          </div>
        </div>
        <div className="view-toggle">
          <button 
            className={viewMode === 'visual' ? 'active' : ''}
            onClick={() => setViewMode('visual')}
          >
            Visual
          </button>
          <button 
            className={viewMode === 'code' ? 'active' : ''}
            onClick={() => setViewMode('code')}
          >
            Code
          </button>
        </div>
      </div>
      
      {viewMode === 'visual' && (
        <div className="logic-panels">
          {/* Mobile view toggle */}
          <div className="mobile-toggle-buttons">
            <button 
              className={activePanel === 'create' || showMobileCreate ? 'active' : ''}
              onClick={() => setShowMobileCreate(true)}
            >
              Create Rule
            </button>
            <button 
              className={activePanel === 'list' && !showMobileCreate ? 'active' : ''}
              onClick={() => setShowMobileCreate(false)}
            >
              View Rules ({conditions.length})
            </button>
          </div>
          
          {/* Create condition panel */}
          <div className={`form-panel ${showMobileCreate ? 'mobile-show' : 'mobile-hide'}`}>
            <div className="panel-header">
              <h3>{editingCondition ? 'Edit Rule' : 'Create New Rule'}</h3>
              {showHints && (
                <button 
                  className="hint-toggle" 
                  title="Hide hints"
                  onClick={() => setShowHints(false)}
                >
                  💡
                </button>
              )}
              {!showHints && (
                <button 
                  className="hint-toggle" 
                  title="Show hints"
                  onClick={() => setShowHints(true)}
                >
                  ℹ️
                </button>
              )}
              
              {/* Mobile close button */}
              <button 
                className="mobile-close" 
                onClick={() => setShowMobileCreate(false)}
              >
                ✕
              </button>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            {showHints && (
              <div className="helper-text">
                Create rules to define how your Arduino project should behave. Each rule combines a 
                condition with an action to make your devices interact with each other.
              </div>
            )}
            
            <div className="form-group">
              <label>Rule Description</label>
              <input
                type="text"
                value={currentCondition.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Briefly describe what this rule does"
                className="logic-input description-input"
              />
            </div>
            
            <div className="form-section">
              <h4>When this happens...</h4>
              <div className="form-group">
                <label>Trigger Type</label>
                <select
                  value={currentCondition.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="logic-dropdown"
                  disabled={!isValid}
                >
                  <option value="SENSOR">Sensor Reading</option>
                  <option value="TIME">Time of Day</option>
                  <option value="INTERVAL">Time Interval</option>
                  <option value="STARTUP">On Startup</option>
                </select>
                
                {showHints && (
                  <div className="input-hint">
                    {currentCondition.type === 'SENSOR' && "Trigger when a sensor reaches a specific value"}
                    {currentCondition.type === 'TIME' && "Trigger at specific times of day"}
                    {currentCondition.type === 'INTERVAL' && "Trigger repeatedly at regular intervals"}
                    {currentCondition.type === 'STARTUP' && "Trigger once when the device starts up"}
                  </div>
                )}
              </div>

              {currentCondition.type === 'SENSOR' && (
                <>
                  {/* Input Device Selection */}
                  <div className="form-group">
                    <label>Input Device</label>
                    <select
                      value={currentCondition.input}
                      onChange={(e) => handleInputChange('input', e.target.value)}
                      className="logic-dropdown"
                    >
                      <option value="">Select Input Device</option>
                      {selectedDevices.inputs
                        .filter(device => device.pin != null)
                        .map(device => (
                          <option key={device.id} value={device.id}>
                            {getDeviceIcon(device)} {device.name} (Pin {device.pin})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Operator Selection for Sensor */}
                  {currentCondition.input && (
                    <div className="form-group">
                      <label>Condition</label>
                      <select
                        value={currentCondition.operator}
                        onChange={(e) => handleInputChange('operator', e.target.value)}
                        className="logic-dropdown"
                      >
                        <option value="">Select Condition</option>
                        {(getSelectedDevice(currentCondition.input, 'input')?.type === 'analog' 
                          ? OPERATORS.ANALOG 
                          : OPERATORS.DIGITAL
                        ).map(op => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Value Input for Sensor */}
                  {currentCondition.operator && (
                    <div className="form-group">
                      <label>Value</label>
                      {getSelectedDevice(currentCondition.input, 'input')?.type === 'analog' ? (
                        <input
                          type="number"
                          value={currentCondition.value}
                          onChange={(e) => handleInputChange('value', e.target.value)}
                          placeholder="Enter value (0-4095)"
                          className="logic-input"
                          min="0"
                          max="4095"
                        />
                      ) : (
                        <select
                          value={currentCondition.value}
                          onChange={(e) => handleInputChange('value', e.target.value)}
                          className="logic-dropdown"
                        >
                          <option value="">Select Value</option>
                          {CONDITIONS.DIGITAL.map(value => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </>
              )}

              {currentCondition.type === 'TIME' && (
                <>
                  {/* Time Condition Selection */}
                  <div className="form-group">
                    <label>Time Condition</label>
                    <select
                      value={currentCondition.operator}
                      onChange={(e) => handleInputChange('operator', e.target.value)}
                      className="logic-dropdown"
                    >
                      <option value="">Select Time Condition</option>
                      {OPERATORS.TIME.map(op => (
                        <option key={op} value={op}>
                          {op.replace(/_/g, ' ').toLowerCase()}
                        </option>
                      ))}
                    </select>
                    
                    {showHints && currentCondition.operator && (
                      <div className="input-hint">
                        {currentCondition.operator === 'DAILY_AT' && "Triggers every day at the specified time"}
                        {currentCondition.operator === 'WEEKLY_ON' && "Triggers on a specific day and time each week"}
                        {currentCondition.operator === 'TIME_AFTER' && "Triggers continuously after a specific time until midnight"}
                        {currentCondition.operator === 'TIME_BEFORE' && "Triggers continuously before a specific time starts at midnight"}
                        {currentCondition.operator === 'TIME_BETWEEN' && "Triggers continuously between two specified times"}
                      </div>
                    )}
                  </div>

                  {/* Time Input */}
                  {currentCondition.operator && (
                    <div className="form-group">
                      <label>Time Setting</label>
                      {renderTimeInput()}
                      
                      {showHints && currentCondition.operator === 'TIME_BETWEEN' && (
                        <div className="input-hint">
                          Set a start and end time to define when this condition should be active
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {currentCondition.type === 'INTERVAL' && (
                <div className="form-group">
                  <label>Repeat Every</label>
                  {renderIntervalInput()}
                  
                  {showHints && (
                    <div className="input-hint">
                      Action will repeat at the interval you specify
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="form-section">
              <h4>Do this...</h4>
              {/* Output Device Selection - Common for all types */}
              <div className="form-group">
                <label>Output Device</label>
                <select
                  value={currentCondition.output}
                  onChange={(e) => handleInputChange('output', e.target.value)}
                  className="logic-dropdown"
                >
                  <option value="">Select Output Device</option>
                  {selectedDevices.outputs
                    .filter(device => device.pin != null)
                    .map(device => (
                      <option key={device.id} value={device.id}>
                        {getDeviceIcon(device)} {device.name} (Pin {device.pin})
                      </option>
                    ))}
                </select>
              </div>

              {/* Action Selection */}
              {currentCondition.output && (
                <div className="form-group">
                  <label>Action</label>
                  <select
                    value={currentCondition.action}
                    onChange={(e) => handleInputChange('action', e.target.value)}
                    className="logic-dropdown"
                  >
                    <option value="">Select Action</option>
                    {(getSelectedDevice(currentCondition.output, 'output')?.id.includes('servo')
                      ? ACTIONS.SERVO
                      : getSelectedDevice(currentCondition.output, 'output')?.type === 'pwm' 
                        ? ACTIONS.PWM 
                        : ACTIONS.DIGITAL
                    ).map(action => (
                      <option key={action} value={action}>{action}</option>
                    ))}
                  </select>
                  
                  {showHints && currentCondition.action && (
                    <div className="input-hint">
                      {currentCondition.action === 'HIGH' && "Turn the output ON (set to HIGH)"}
                      {currentCondition.action === 'LOW' && "Turn the output OFF (set to LOW)"}
                      {currentCondition.action === 'TOGGLE' && "Switch between ON and OFF states"}
                      {currentCondition.action === 'setValue' && "Set to a specific value"}
                      {currentCondition.action === 'increment' && "Increase the current value"}
                      {currentCondition.action === 'decrement' && "Decrease the current value"}
                      {currentCondition.action === 'setAngle' && "Move servo to a specific angle (0-180°)"}
                      {currentCondition.action === 'sweep' && "Continuously sweep the servo back and forth"}
                    </div>
                  )}
                </div>
              )}

              {/* Action Value Input (for PWM and servo) */}
              {currentCondition.output && 
               ((getSelectedDevice(currentCondition.output, 'output')?.type === 'pwm' && 
                 currentCondition.action === 'setValue') ||
                (getSelectedDevice(currentCondition.output, 'output')?.id.includes('servo') && 
                 currentCondition.action === 'setAngle')) && (
                <div className="form-group">
                  <label>
                    {getSelectedDevice(currentCondition.output, 'output')?.id.includes('servo') 
                      ? 'Angle (0-180°)' 
                      : 'Value (0-255)'}
                  </label>
                  <input
                    type="number"
                    value={currentCondition.actionValue}
                    onChange={(e) => handleInputChange('actionValue', e.target.value)}
                    placeholder={getSelectedDevice(currentCondition.output, 'output')?.id.includes('servo') 
                      ? "Enter angle (0-180)" 
                      : "Enter value (0-255)"}
                    className="logic-input"
                    min="0"
                    max={getSelectedDevice(currentCondition.output, 'output')?.id.includes('servo') ? "180" : "255"}
                  />
                </div>
              )}
            </div>
            
            <div className="form-section">
              <h4>Rule Settings</h4>
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={currentCondition.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="logic-dropdown"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
                
                {showHints && (
                  <div className="input-hint">
                    Higher priority rules take precedence when multiple rules apply at the same time
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              {editingCondition ? (
                <>
                  <button
                    className="save-btn"
                    onClick={handleAddCondition}
                    disabled={!isValid || !!validateCondition()}
                  >
                    Update Rule
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="add-condition-btn"
                  onClick={handleAddCondition}
                  disabled={!isValid || !!validateCondition()}
                >
                  Add Rule
                </button>
              )}
            </div>
          </div>

          {/* Conditions list panel */}
          <div className={`conditions-panel ${!showMobileCreate ? 'mobile-show' : 'mobile-hide'}`}>
            <div className="panel-header">
              <h3>Program Rules {conditions.length > 0 && `(${conditions.length})`}</h3>
              
              {/* Mobile back button */}
              <button 
                className="mobile-back" 
                onClick={() => setShowMobileCreate(true)}
              >
                + Create New Rule
              </button>
            </div>
            
            {conditions.length === 0 ? (
              <div className="no-conditions">
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <p>No rules added yet</p>
                  <p className="empty-hint">
                    Start by creating a rule that defines when and how your devices will interact.
                  </p>
                </div>
              </div>
            ) : (
              <div className="conditions-list">
                {conditions.map((condition, index) => (
                  <div 
                    key={condition.id} 
                    className={`condition-card ${editingCondition === condition.id ? 'editing' : ''} priority-${condition.priority || 'normal'}`}
                  >
                    <div className="condition-header">
                      <div className="condition-type-badge">
                        {condition.type === 'SENSOR' && '📊 Sensor'}
                        {condition.type === 'TIME' && '🕒 Time'}
                        {condition.type === 'INTERVAL' && '⏱️ Interval'}
                        {condition.type === 'STARTUP' && '🚀 Startup'}
                      </div>
                      <div className="condition-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => handleEditCondition(condition.id)}
                          title="Edit rule"
                        >
                          ✎
                        </button>
                        <button 
                          className="remove-btn"
                          onClick={() => handleRemoveCondition(condition.id)}
                          title="Delete rule"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    <div className="condition-title">
                      {condition.description || 'Unnamed Rule'}
                    </div>
                    
                    <div className="condition-content">
                      <div className="if-section">
                        <div className="if-label">IF</div>
                        <div className="if-content">
                          {condition.type === 'SENSOR' && (
                            <div className="condition-device">
                              <span className="device-icon">
                                {getDeviceIcon(condition.input.device)}
                              </span>
                              <span className="device-name">
                                {condition.input.device.name} (Pin {condition.input.device.pin})
                              </span>
                              <div className="condition-expression">
                                <span className="operator">{condition.input.operator}</span>
                                <span className="value">{condition.input.value}</span>
                              </div>
                            </div>
                          )}
                          
                          {condition.type === 'TIME' && (
                            <div className="time-condition">
                              {condition.input.operator === 'DAILY_AT' && (
                                <span>Every day at {formatTime(condition.input.timeValue)}</span>
                              )}
                              {condition.input.operator === 'WEEKLY_ON' && (
                                <span>
                                  Every {condition.input.weekDay && DAYS_OF_WEEK[condition.input.weekDay].label} at {formatTime(condition.input.timeValue)}
                                </span>
                              )}
                              {condition.input.operator === 'TIME_AFTER' && (
                                <span>After {formatTime(condition.input.timeValue)}</span>
                              )}
                              {condition.input.operator === 'TIME_BEFORE' && (
                                <span>Before {formatTime(condition.input.timeValue)}</span>
                              )}
                              {condition.input.operator === 'TIME_EQUALS' && (
                                <span>At exactly {formatTime(condition.input.timeValue)}</span>
                              )}
                              {condition.input.operator === 'TIME_BETWEEN' && (
                                <span>Between {formatTime(condition.input.timeValue)} and {formatTime(condition.input.timeEndValue)}</span>
                              )}
                            </div>
                          )}
                          
                          {condition.type === 'INTERVAL' && (
                            <div className="interval-condition">
                              Every {condition.input.intervalValue} {condition.input.intervalUnit}
                            </div>
                          )}
                          
                          {condition.type === 'STARTUP' && (
                            <div className="startup-condition">
                              Arduino powers on
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="then-section">
                        <div className="then-label">THEN</div>
                        <div className="then-content">
                          <div className="action-device">
                            <span className="device-icon">
                              {getDeviceIcon(condition.output.device)}
                            </span>
                            <span className="device-name">
                              {condition.output.device.name} (Pin {condition.output.device.pin})
                            </span>
                            <div className="action-expression">
                              <span className="action">{condition.output.action}</span>
                              {condition.output.value && (
                                <span className="action-value">
                                  {condition.output.action === 'setAngle' ? `${condition.output.value}°` : condition.output.value}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="rule-order-buttons">
                      <button 
                        onClick={() => handleMoveCondition(condition.id, -1)}
                        disabled={index === 0}
                        title="Move up"
                      >
                        ▲
                      </button>
                      <span className="rule-number">#{index + 1}</span>
                      <button 
                        onClick={() => handleMoveCondition(condition.id, 1)}
                        disabled={index === conditions.length - 1}
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {viewMode === 'code' && (
        <div className="code-view">
          <div className="code-toolbar">
            <h3>Generated Arduino Code</h3>
            <button 
              className="copy-code-btn"
              onClick={() => {
                navigator.clipboard.writeText(generateArduinoCode());
                alert('Code copied to clipboard!');
              }}
            >
              Copy Code
            </button>
          </div>
          <pre className="arduino-code">{generateArduinoCode()}</pre>
        </div>
      )}
    </div>
  );
}

export default LogicBuilder;