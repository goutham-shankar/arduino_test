import React, { useState, useCallback, useMemo } from 'react';
import ArduinoUploader from './ArduinoUploader';

function CodeGenerator({ board, devices, logic }) {
  const [error, setError] = useState(null);

  // Memoize the entire code generation process
  const generatedCode = useMemo(() => {
    try {
      // Validate configuration
      if (!board) {
        throw new Error('Board not selected');
      }

      if (!devices.inputs && !devices.outputs) {
        throw new Error('No devices configured');
      }

      // Check for pin conflicts
      const allPins = new Set();
      [...(devices.inputs || []), ...(devices.outputs || [])].forEach(device => {
        if (device.pin === undefined || device.pin === null) {
          throw new Error(`Pin not defined for device: ${device.name}`);
        }
        if (allPins.has(device.pin)) {
          throw new Error(`Duplicate pin assignment: ${device.pin}`);
        }
        allPins.add(device.pin);
      });

      // Generate libraries section
      const libraries = new Set(['#include <Arduino.h>']);
      if (devices.outputs?.some(d => d.type === 'servo')) {
        libraries.add('#include <ESP32Servo.h>');
      }
      if (devices.inputs?.some(d => d.type === 'dht')) {
        libraries.add('#include <DHT.h>');
      }
      if (logic?.some(l => l.type === 'TIME')) {
        libraries.add('#include <WiFi.h>');
        libraries.add('#include <time.h>');
      }

      // Generate pin definitions
      const definitions = [];
      devices.inputs?.forEach((device, index) => {
        definitions.push(`#define ${device.type.toUpperCase()}_PIN_${index} ${device.pin}`);
        if (device.type === 'dht') {
          definitions.push(`DHT dht${index}(${device.pin}, DHT11);`);
        }
      });

      devices.outputs?.forEach((device, index) => {
        definitions.push(`#define ${device.type.toUpperCase()}_PIN_${index} ${device.pin}`);
        if (device.type === 'servo') {
          definitions.push(`Servo servo${index};`);
        }
      });

      // Generate global variables
      const globals = [];
      if (logic?.some(l => l.type === 'DELAY' || l.type === 'ON_OFF')) {
        globals.push('unsigned long previousMillis = 0;');
        globals.push('unsigned long currentMillis = 0;');
      }

      logic?.forEach((condition, index) => {
        if (condition.type === 'ON_OFF') {
          globals.push(`bool isOn_${index} = false;`);
          globals.push(`unsigned long lastToggle_${index} = 0;`);
        }
      });

      // Generate setup function
      const setup = ['void setup() {', '  Serial.begin(115200);'];

      devices.inputs?.forEach((device, index) => {
        if (device.type === 'digital') {
          setup.push(`  pinMode(${device.pin}, INPUT${device.pullup ? '_PULLUP' : ''});`);
        } else if (device.type === 'dht') {
          setup.push(`  dht${index}.begin();`);
        }
      });

      devices.outputs?.forEach((device, index) => {
        if (device.type === 'pwm') {
          setup.push(`  ledcSetup(${device.pin}, 5000, 8);`);
          setup.push(`  ledcAttachPin(${device.pin}, ${device.pin});`);
        } else if (device.type === 'servo') {
          setup.push(`  servo${index}.attach(${device.pin});`);
        } else {
          setup.push(`  pinMode(${device.pin}, OUTPUT);`);
        }
      });

      setup.push('}');

      // Generate loop function
      const loop = ['void loop() {'];

      if (logic?.length) {
        if (logic.some(l => l.type === 'DELAY' || l.type === 'ON_OFF')) {
          loop.push('  currentMillis = millis();');
        }

        logic.forEach((condition, index) => {
          switch (condition.type) {
            case 'SENSOR':
              if (condition.input?.device && condition.output?.device) {
                const readFunc = condition.input.device.type === 'analog' ? 'analogRead' : 'digitalRead';
                loop.push(`  if (${readFunc}(${condition.input.device.pin}) ${condition.input.operator} ${condition.input.value}) {`);
                if (condition.output.device.type === 'pwm') {
                  loop.push(`    ledcWrite(${condition.output.device.pin}, ${condition.output.value});`);
                } else {
                  loop.push(`    digitalWrite(${condition.output.device.pin}, ${condition.output.action});`);
                }
                loop.push('  }');
              }
              break;

            case 'DELAY':
              if (condition.output?.device) {
                const delayMs = condition.input.delayTime;
                if (condition.input.operator === 'DELAY') {
                  loop.push(`  digitalWrite(${condition.output.device.pin}, ${condition.output.action});`);
                  loop.push(`  delay(${delayMs});`);
                } else {
                  loop.push(`  if (currentMillis - previousMillis >= ${delayMs}) {`);
                  loop.push('    previousMillis = currentMillis;');
                  loop.push(`    digitalWrite(${condition.output.device.pin}, ${condition.output.action});`);
                  loop.push('  }');
                }
              }
              break;

            case 'ON_OFF':
              if (condition.output?.device) {
                loop.push(`  if (currentMillis - lastToggle_${index} >= (isOn_${index} ? ${condition.input.onDuration} : ${condition.input.offDuration})) {`);
                loop.push(`    isOn_${index} = !isOn_${index};`);
                loop.push(`    lastToggle_${index} = currentMillis;`);
                loop.push(`    digitalWrite(${condition.output.device.pin}, isOn_${index} ? HIGH : LOW);`);
                loop.push('  }');
              }
              break;
          }
        });
      }

      loop.push('  delay(10);  // Prevent CPU hogging');
      loop.push('}');

      // Combine all sections
      const finalCode = [
        '/*',
        ` * Generated for ${board.name}`,
        ` * Generated on: ${new Date().toISOString()}`,
        ' */',
        '',
        Array.from(libraries).join('\n'),
        '',
        '// Pin Definitions',
        definitions.join('\n'),
        '',
        '// Global Variables',
        globals.join('\n'),
        '',
        '// Setup Function',
        setup.join('\n'),
        '',
        '// Main Loop',
        loop.join('\n')
      ].filter(Boolean).join('\n');

      setError(null);
      return finalCode;

    } catch (err) {
      setError(err.message);
      return `// Error: ${err.message}`;
    }
  }, [board, devices, logic]); // Only regenerate when these props change

  // Memoize handlers
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedCode);
  }, [generatedCode]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arduino_project.ino';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatedCode]);

  return (
    <div className="code-generator">
      <div className="code-header">
        <h3>Generated Arduino Code</h3>
        {error && (
          <div className="error-message">{error}</div>
        )}
        <div className="code-actions">
          <button
            className="copy-button"
            onClick={handleCopy}
            disabled={!!error}
          >
            Copy Code
          </button>
          <button
            className="download-button"
            onClick={handleDownload}
            disabled={!!error}
          >
            Download Code
          </button>
        </div>
      </div>
      <pre className="code-block">
        <code>{generatedCode}</code>
      </pre>
      <ArduinoUploader 
        code={generatedCode}
        disabled={!!error}
        boardType={board?.name || 'Arduino'}
      />
    </div>
  );
}

export default CodeGenerator;