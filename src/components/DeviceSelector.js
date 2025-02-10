import React from 'react';
import PinSelector from './PinSelector';


const inputDevices = [
  { id: 'button', name: 'Push Button', type: 'digital', description: 'Digital input for momentary switches' },
  { id: 'potentiometer', name: 'Potentiometer', type: 'analog', description: 'Analog input for variable resistance' },
  { id: 'dht11', name: 'DHT11 Sensor', type: 'digital', description: 'Temperature and humidity sensor' },
  { id: 'ultrasonic', name: 'Ultrasonic Sensor', type: 'digital', description: 'Distance measurement sensor' },
  { id: 'ldr', name: 'Light Sensor', type: 'analog', description: 'Analog light intensity sensor' }
];

const outputDevices = [
  { id: 'led', name: 'LED', type: 'digital', description: 'Digital output for LED control' },
  { id: 'servo', name: 'Servo Motor', type: 'pwm', description: 'PWM output for servo control' },
  { id: 'relay', name: 'Relay Module', type: 'digital', description: 'Digital output for relay switching' },
  { id: 'buzzer', name: 'Buzzer', type: 'digital', description: 'Digital/PWM output for sound' },
  { id: 'rgb_led', name: 'RGB LED', type: 'pwm', description: 'PWM output for RGB LED control' }
];

// ESP32 pin configuration
const ESP32_PINS = [
  { number: 2, capabilities: ['GPIO', 'PWM', 'Touch'] },
  { number: 4, capabilities: ['GPIO', 'PWM'] },
  { number: 5, capabilities: ['GPIO', 'PWM', 'SPI'] },
  { number: 12, capabilities: ['GPIO', 'PWM', 'Touch'] },
  { number: 13, capabilities: ['GPIO', 'PWM', 'Touch'] },
  { number: 14, capabilities: ['GPIO', 'PWM', 'Touch'] },
  { number: 15, capabilities: ['GPIO', 'PWM'] },
  { number: 16, capabilities: ['GPIO', 'PWM'] },
  { number: 17, capabilities: ['GPIO', 'PWM'] },
  { number: 18, capabilities: ['GPIO', 'PWM', 'SPI'] },
  { number: 19, capabilities: ['GPIO', 'PWM', 'SPI'] },
  { number: 21, capabilities: ['GPIO', 'PWM', 'I2C'] },
  { number: 22, capabilities: ['GPIO', 'PWM', 'I2C'] },
  { number: 23, capabilities: ['GPIO', 'PWM', 'SPI'] },
  { number: 25, capabilities: ['GPIO', 'PWM', 'ADC'] },
  { number: 26, capabilities: ['GPIO', 'PWM', 'ADC'] },
  { number: 27, capabilities: ['GPIO', 'PWM', 'ADC'] },
  { number: 32, capabilities: ['GPIO', 'PWM', 'ADC', 'Touch'] },
  { number: 33, capabilities: ['GPIO', 'PWM', 'ADC', 'Touch'] },
  { number: 34, capabilities: ['GPIO', 'ADC'] },
  { number: 35, capabilities: ['GPIO', 'ADC'] },
  { number: 36, capabilities: ['GPIO', 'ADC'] },
  { number: 39, capabilities: ['GPIO', 'ADC'] },
];

function DeviceSelector({ selectedBoard, onDevicesChange, selectedDevices }) {
  const getUsedPins = () => {
    const inputPins = selectedDevices.inputs.map(device => device.pin).filter(pin => pin !== null);
    const outputPins = selectedDevices.outputs.map(device => device.pin).filter(pin => pin !== null);
    return [...inputPins, ...outputPins];
  };

  const handleAddDevice = (device, type) => {
    const newDevice = { ...device, pin: null };
    if (type === 'input') {
      onDevicesChange({
        ...selectedDevices,
        inputs: [...selectedDevices.inputs, newDevice]
      });
    } else {
      onDevicesChange({
        ...selectedDevices,
        outputs: [...selectedDevices.outputs, newDevice]
      });
    }
  };

  const handlePinSelect = (deviceId, pin, isInput) => {
    if (isInput) {
      const updatedInputs = selectedDevices.inputs.map(device =>
        device.id === deviceId ? { ...device, pin: parseInt(pin) } : device
      );
      onDevicesChange({ ...selectedDevices, inputs: updatedInputs });
    } else {
      const updatedOutputs = selectedDevices.outputs.map(device =>
        device.id === deviceId ? { ...device, pin: parseInt(pin) } : device
      );
      onDevicesChange({ ...selectedDevices, outputs: updatedOutputs });
    }
  };

  const handleRemoveDevice = (deviceId, isInput) => {
    if (isInput) {
      const updatedInputs = selectedDevices.inputs.filter(device => device.id !== deviceId);
      onDevicesChange({ ...selectedDevices, inputs: updatedInputs });
    } else {
      const updatedOutputs = selectedDevices.outputs.filter(device => device.id !== deviceId);
      onDevicesChange({ ...selectedDevices, outputs: updatedOutputs });
    }
  };

  return (
    <div className="device-selector">
      <div className="device-columns">
        <div className="device-column">
          <h3>Input Devices</h3>
          <div className="device-list">
            {inputDevices.map(device => (
              <div 
                key={device.id} 
                className="device-item"
                onClick={() => handleAddDevice(device, 'input')}
              >
                <div className="device-info">
                  <span className="device-name">{device.name}</span>
                  <span className="device-type">{device.type}</span>
                </div>
                <div className="device-description">{device.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="device-column">
          <h3>Output Devices</h3>
          <div className="device-list">
            {outputDevices.map(device => (
              <div 
                key={device.id} 
                className="device-item"
                onClick={() => handleAddDevice(device, 'output')}
              >
                <div className="device-info">
                  <span className="device-name">{device.name}</span>
                  <span className="device-type">{device.type}</span>
                </div>
                <div className="device-description">{device.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="selected-devices-container">
        <h3>Selected Devices Configuration</h3>
        
        <div className="selected-devices-grid">
          <div className="selected-column">
            <h4>Input Devices</h4>
            {selectedDevices.inputs.map((device, index) => (
              <div key={`${device.id}-${index}`} className="selected-device-item">
                <div className="selected-device-info">
                  <span>{device.name}</span>
                  <button 
                    className="remove-device"
                    onClick={() => handleRemoveDevice(device.id, true)}
                  >
                    ×
                  </button>
                </div>
                <PinSelector
                  boardPins={ESP32_PINS}
                  usedPins={getUsedPins()}
                  device={device}
                  onPinSelect={(deviceId, pin) => handlePinSelect(deviceId, pin, true)}
                />
              </div>
            ))}
          </div>

          <div className="selected-column">
            <h4>Output Devices</h4>
            {selectedDevices.outputs.map((device, index) => (
              <div key={`${device.id}-${index}`} className="selected-device-item">
                <div className="selected-device-info">
                  <span>{device.name}</span>
                  <button 
                    className="remove-device"
                    onClick={() => handleRemoveDevice(device.id, false)}
                  >
                    ×
                  </button>
                </div>
                <PinSelector
                  boardPins={ESP32_PINS}
                  usedPins={getUsedPins()}
                  device={device}
                  onPinSelect={(deviceId, pin) => handlePinSelect(deviceId, pin, false)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeviceSelector;