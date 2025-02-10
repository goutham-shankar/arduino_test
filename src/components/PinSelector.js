import React from 'react';


function PinSelector({ boardPins, usedPins, device, onPinSelect }) {
  // Generate available pins based on device type and board
  const getAvailablePins = () => {
    if (!boardPins) return [];
    
    // Filter out already used pins
    const availablePins = boardPins.filter(pin => !usedPins.includes(pin.number));
    
    // Filter based on device type
    switch(device.type) {
      case 'analog':
        return availablePins.filter(pin => pin.capabilities.includes('ADC'));
      case 'digital':
        return availablePins.filter(pin => pin.capabilities.includes('GPIO'));
      case 'pwm':
        return availablePins.filter(pin => pin.capabilities.includes('PWM'));
      default:
        return availablePins;
    }
  };

  return (
    <div className="pin-selector">
      <select
        value={device.pin || ''}
        onChange={(e) => onPinSelect(device.id, e.target.value)}
        className="pin-dropdown"
      >
        <option value="">Select Pin</option>
        {getAvailablePins().map(pin => (
          <option 
            key={pin.number} 
            value={pin.number}
          >
            GPIO{pin.number} {pin.capabilities.join(', ')}
          </option>
        ))}
      </select>
    </div>
  );
}

export default PinSelector;