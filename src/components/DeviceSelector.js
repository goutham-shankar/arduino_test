import React, { useState, useEffect } from 'react';
import PinSelector from './PinSelector';
import './DeviceSelector.css';

// Expanded input devices list with more options
const inputDevices = [
  { id: 'button', name: 'Push Button', type: 'digital', description: 'Digital input for momentary switches', icon: '🔘', color: '#4e6cef' },
  { id: 'potentiometer', name: 'Potentiometer', type: 'analog', description: 'Analog input for variable resistance', icon: '🎚️', color: '#4e9fef' },
  { id: 'dht11', name: 'DHT11 Sensor', type: 'digital', description: 'Temperature and humidity sensor', icon: '🌡️', color: '#ef4e4e' },
  { id: 'dht22', name: 'DHT22 Sensor', type: 'digital', description: 'Higher precision temperature and humidity', icon: '🌡️', color: '#ef4e88' },
  { id: 'ultrasonic', name: 'Ultrasonic Sensor', type: 'digital', description: 'Distance measurement sensor', icon: '📏', color: '#8b4eef' },
  { id: 'ldr', name: 'Light Sensor', type: 'analog', description: 'Analog light intensity sensor', icon: '💡', color: '#efcf4e' },
  { id: 'pir', name: 'PIR Sensor', type: 'digital', description: 'Motion detection sensor', icon: '👁️', color: '#4eefcf' },
  { id: 'touch', name: 'Touch Sensor', type: 'digital', description: 'Capacitive touch detection', icon: '👆', color: '#ef4ecf' },
  { id: 'joystick', name: 'Joystick', type: 'analog', description: 'Dual-axis position control', icon: '🕹️', color: '#4eef88' },
  { id: 'soil', name: 'Soil Moisture', type: 'analog', description: 'Soil humidity measurement', icon: '🌱', color: '#79ef4e' },
  { id: 'gas', name: 'Gas Sensor', type: 'analog', description: 'Air quality and gas detection', icon: '☁️', color: '#999999' },
  { id: 'accelerometer', name: 'Accelerometer', type: 'i2c', description: 'Motion and orientation detection', icon: '📲', color: '#ef884e' }
];

// Expanded output devices list with more options
const outputDevices = [
  { id: 'led', name: 'LED', type: 'digital', description: 'Digital output for LED control', icon: '💡', color: '#4eef4e' },
  { id: 'servo', name: 'Servo Motor', type: 'pwm', description: 'PWM output for servo control', icon: '⚙️', color: '#4e88ef' },
  { id: 'relay', name: 'Relay Module', type: 'digital', description: 'Digital output for relay switching', icon: '🔌', color: '#ef884e' },
  { id: 'buzzer', name: 'Buzzer', type: 'digital', description: 'Digital/PWM output for sound', icon: '🔊', color: '#ef4e4e' },
  { id: 'rgb_led', name: 'RGB LED', type: 'pwm', description: 'PWM output for RGB LED control', icon: '🌈', color: '#8b4eef' },
  { id: 'lcd', name: 'LCD Display', type: 'i2c', description: '16x2 or 20x4 character display', icon: '📟', color: '#4eefcf' },
  { id: 'oled', name: 'OLED Display', type: 'i2c', description: 'Small graphic display module', icon: '📱', color: '#4e4eef' },
  { id: 'stepper', name: 'Stepper Motor', type: 'digital', description: 'Precise position control motor', icon: '🔄', color: '#79ef4e' },
  { id: 'dc_motor', name: 'DC Motor', type: 'pwm', description: 'Variable speed rotational motor', icon: '🔋', color: '#ef4e88' },
  { id: 'neopixel', name: 'NeoPixel Strip', type: 'digital', description: 'Addressable RGB LED strip', icon: '✨', color: '#efcf4e' },
  { id: 'seven_segment', name: 'Seven Segment', type: 'digital', description: 'Numeric display module', icon: '🔢', color: '#ef4ecf' },
  { id: 'vibration', name: 'Vibration Motor', type: 'digital', description: 'Haptic feedback actuator', icon: '📳', color: '#999999' }
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
  const [searchInputs, setSearchInputs] = useState('');
  const [searchOutputs, setSearchOutputs] = useState('');
  const [activeCategory, setActiveCategory] = useState({
    inputs: 'all',
    outputs: 'all'
  });

  // Ensure selectedDevices is properly initialized
  useEffect(() => {
    if (!selectedDevices || !selectedDevices.inputs || !selectedDevices.outputs) {
      onDevicesChange({
        inputs: [],
        outputs: []
      });
    }
  }, [selectedDevices, onDevicesChange]);

  // Filter devices by search term and category
  const filteredInputs = inputDevices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchInputs.toLowerCase()) || 
                          device.description.toLowerCase().includes(searchInputs.toLowerCase());
    const matchesCategory = activeCategory.inputs === 'all' || device.type === activeCategory.inputs;
    return matchesSearch && matchesCategory;
  });

  const filteredOutputs = outputDevices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchOutputs.toLowerCase()) || 
                          device.description.toLowerCase().includes(searchOutputs.toLowerCase());
    const matchesCategory = activeCategory.outputs === 'all' || device.type === activeCategory.outputs;
    return matchesSearch && matchesCategory;
  });

  // Get all used pins
  const getUsedPins = () => {
    if (!selectedDevices || !selectedDevices.inputs || !selectedDevices.outputs) return [];
    
    const inputPins = selectedDevices.inputs.map(device => device.pin).filter(pin => pin !== null);
    const outputPins = selectedDevices.outputs.map(device => device.pin).filter(pin => pin !== null);
    return [...inputPins, ...outputPins];
  };

  // Handle adding a device
  const handleAddDevice = (device, type) => {
    if (!selectedDevices) return;
    
    const newDevice = { 
      ...device, 
      pin: null,
      id: `${device.id}-${Date.now()}` // Ensure unique ID
    };
    
    if (type === 'input') {
      onDevicesChange({
        ...selectedDevices,
        inputs: [...(selectedDevices.inputs || []), newDevice]
      });
    } else {
      onDevicesChange({
        ...selectedDevices,
        outputs: [...(selectedDevices.outputs || []), newDevice]
      });
    }
  };

  // Handle pin selection
  const handlePinSelect = (deviceId, pin, isInput) => {
    if (!selectedDevices) return;
    
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

  // Handle removing a device
  const handleRemoveDevice = (deviceId, isInput) => {
    if (!selectedDevices) return;
    
    if (isInput) {
      const updatedInputs = selectedDevices.inputs.filter(device => device.id !== deviceId);
      onDevicesChange({ ...selectedDevices, inputs: updatedInputs });
    } else {
      const updatedOutputs = selectedDevices.outputs.filter(device => device.id !== deviceId);
      onDevicesChange({ ...selectedDevices, outputs: updatedOutputs });
    }
  };

  return (
    <div className="device-selector dark-theme">
      <div className="device-selector-header">
        <h2>ESP32 Device Configuration</h2>
        <div className="timestamp-display">
          <div className="board-info">
            <span className="board-badge">{selectedBoard?.name || 'No board selected'}</span>
            <span className="pin-count">{selectedBoard?.pins || 0} pins</span>
          </div>
          <span className="timestamp-info">User: goutham-shankar | 2025-05-16 16:46:48 UTC</span>
        </div>
      </div>

      <div className="setup-summary">
        <div className="summary-item">
          <span className="summary-label">Input Devices</span>
          <span className="summary-count">{selectedDevices?.inputs?.length || 0}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Output Devices</span>
          <span className="summary-count">{selectedDevices?.outputs?.length || 0}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Used Pins</span>
          <span className="summary-count">{getUsedPins().length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Available Pins</span>
          <span className="summary-count">{selectedBoard?.pins ? selectedBoard.pins - getUsedPins().length : 0}</span>
        </div>
      </div>
      
      <div className="device-configuration">
        <div className="device-columns">
          <div className="device-column">
            <div className="column-header">
              <h3>Input Devices</h3>
              <div className="search-filter-group">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search inputs..."
                    value={searchInputs}
                    onChange={(e) => setSearchInputs(e.target.value)}
                  />
                  <span className="search-icon">🔍</span>
                </div>
                <div className="filter-buttons">
                  <button 
                    className={activeCategory.inputs === 'all' ? 'active' : ''}
                    onClick={() => setActiveCategory({...activeCategory, inputs: 'all'})}
                  >
                    All
                  </button>
                  <button 
                    className={activeCategory.inputs === 'digital' ? 'active' : ''}
                    onClick={() => setActiveCategory({...activeCategory, inputs: 'digital'})}
                  >
                    Digital
                  </button>
                  <button 
                    className={activeCategory.inputs === 'analog' ? 'active' : ''}
                    onClick={() => setActiveCategory({...activeCategory, inputs: 'analog'})}
                  >
                    Analog
                  </button>
                  <button 
                    className={activeCategory.inputs === 'i2c' ? 'active' : ''}
                    onClick={() => setActiveCategory({...activeCategory, inputs: 'i2c'})}
                  >
                    I2C/SPI
                  </button>
                </div>
              </div>
            </div>
            <div className="device-list">
              {filteredInputs.length > 0 ? (
                filteredInputs.map(device => (
                  <div 
                    key={device.id} 
                    className="device-card"
                    onClick={() => handleAddDevice(device, 'input')}
                    style={{borderLeft: `4px solid ${device.color}`}}
                  >
                    <div className="device-icon">{device.icon}</div>
                    <div className="device-content">
                      <div className="device-info">
                        <span className="device-name">{device.name}</span>
                        <span className={`device-type ${device.type}`}>{device.type}</span>
                      </div>
                      <div className="device-description">{device.description}</div>
                    </div>
                    <div className="add-device-button">+</div>
                  </div>
                ))
              ) : (
                <div className="no-devices-found">No matching input devices found</div>
              )}
            </div>
          </div>

          <div className="device-column">
            <div className="column-header">
              <h3>Output Devices</h3>
              <div className="search-filter-group">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search outputs..."
                    value={searchOutputs}
                    onChange={(e) => setSearchOutputs(e.target.value)}
                  />
                  <span className="search-icon">🔍</span>
                </div>
                <div className="filter-buttons">
                  <button 
                    className={activeCategory.outputs === 'all' ? 'active' : ''}
                    onClick={() => setActiveCategory({...activeCategory, outputs: 'all'})}
                  >
                    All
                  </button>
                  <button 
                    className={activeCategory.outputs === 'digital' ? 'active' : ''}
                    onClick={() => setActiveCategory({...activeCategory, outputs: 'digital'})}
                  >
                    Digital
                  </button>
                  <button 
                    className={activeCategory.outputs === 'pwm' ? 'active' : ''}
                    onClick={() => setActiveCategory({...activeCategory, outputs: 'pwm'})}
                  >
                    PWM
                  </button>
                  <button 
                    className={activeCategory.outputs === 'i2c' ? 'active' : ''}
                    onClick={() => setActiveCategory({...activeCategory, outputs: 'i2c'})}
                  >
                    I2C/SPI
                  </button>
                </div>
              </div>
            </div>
            <div className="device-list">
              {filteredOutputs.length > 0 ? (
                filteredOutputs.map(device => (
                  <div 
                    key={device.id} 
                    className="device-card"
                    onClick={() => handleAddDevice(device, 'output')}
                    style={{borderLeft: `4px solid ${device.color}`}}
                  >
                    <div className="device-icon">{device.icon}</div>
                    <div className="device-content">
                      <div className="device-info">
                        <span className="device-name">{device.name}</span>
                        <span className={`device-type ${device.type}`}>{device.type}</span>
                      </div>
                      <div className="device-description">{device.description}</div>
                    </div>
                    <div className="add-device-button">+</div>
                  </div>
                ))
              ) : (
                <div className="no-devices-found">No matching output devices found</div>
              )}
            </div>
          </div>
        </div>

        <div className="selected-devices-container">
          <div className="selected-header-wrapper">
            <h3>Current Configuration</h3>
            <span className="help-text">Select pins for your devices below</span>
          </div>
          
          <div className="selected-devices-grid">
            <div className="selected-column">
              <div className="selected-header">
                <h4>Input Devices</h4>
                <span className="device-count">{(selectedDevices?.inputs?.length || 0)} devices</span>
              </div>
              {selectedDevices?.inputs?.length > 0 ? (
                selectedDevices.inputs.map((device, index) => {
                  const baseDevice = inputDevices.find(d => device.id.includes(d.id));
                  return (
                    <div 
                      key={`${device.id}-${index}`} 
                      className="selected-device-card"
                      style={{borderLeft: `4px solid ${baseDevice?.color || '#666'}`}}
                    >
                      <div className="selected-device-header">
                        <div className="selected-device-title">
                          <span className="selected-device-icon">{baseDevice?.icon || '📌'}</span>
                          <span className="selected-device-name">{device.name}</span>
                        </div>
                        <button 
                          className="remove-device"
                          onClick={() => handleRemoveDevice(device.id, true)}
                          title="Remove device"
                        >
                          ×
                        </button>
                      </div>
                      <div className="pin-selector-wrapper">
                        <PinSelector
                          boardPins={ESP32_PINS}
                          usedPins={getUsedPins()}
                          device={device}
                          onPinSelect={(deviceId, pin) => handlePinSelect(deviceId, pin, true)}
                        />
                        {device.pin && (
                          <div className="pin-badge">
                            GPIO {device.pin}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-selected-devices">
                  <div className="empty-state-icon">↑</div>
                  <p>Click on input devices above to add them to your configuration</p>
                </div>
              )}
            </div>

            <div className="selected-column">
              <div className="selected-header">
                <h4>Output Devices</h4>
                <span className="device-count">{(selectedDevices?.outputs?.length || 0)} devices</span>
              </div>
              {selectedDevices?.outputs?.length > 0 ? (
                selectedDevices.outputs.map((device, index) => {
                  const baseDevice = outputDevices.find(d => device.id.includes(d.id));
                  return (
                    <div 
                      key={`${device.id}-${index}`} 
                      className="selected-device-card"
                      style={{borderLeft: `4px solid ${baseDevice?.color || '#666'}`}}
                    >
                      <div className="selected-device-header">
                        <div className="selected-device-title">
                          <span className="selected-device-icon">{baseDevice?.icon || '📌'}</span>
                          <span className="selected-device-name">{device.name}</span>
                        </div>
                        <button 
                          className="remove-device"
                          onClick={() => handleRemoveDevice(device.id, false)}
                          title="Remove device"
                        >
                          ×
                        </button>
                      </div>
                      <div className="pin-selector-wrapper">
                        <PinSelector
                          boardPins={ESP32_PINS}
                          usedPins={getUsedPins()}
                          device={device}
                          onPinSelect={(deviceId, pin) => handlePinSelect(deviceId, pin, false)}
                        />
                        {device.pin && (
                          <div className="pin-badge">
                            GPIO {device.pin}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-selected-devices">
                  <div className="empty-state-icon">↑</div>
                  <p>Click on output devices above to add them to your configuration</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeviceSelector;