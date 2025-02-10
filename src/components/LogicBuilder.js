import React, { useState, useEffect } from 'react';


const CONDITION_TYPES = {
  SENSOR: 'SENSOR',
  TIME: 'TIME',
  DELAY: 'DELAY',
  ON_OFF: 'ON_OFF'
};

const OPERATORS = {
  DIGITAL: ['==', '!='],
  ANALOG: ['==', '!=', '>', '<', '>=', '<='],
  TIME: ['DAILY_AT', 'WEEKLY_ON', 'TIME_AFTER', 'TIME_BEFORE', 'TIME_EQUALS'],
  DELAY: ['DELAY', 'INTERVAL'],
  ON_OFF: ['ON', 'OFF']
};

const ACTIONS = {
  DIGITAL: ['HIGH', 'LOW', 'TOGGLE'],
  PWM: ['setValue', 'increment', 'decrement']
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
    weekDay: '',
    delayTime: '',
    delayUnit: 'ms', // milliseconds by default
    onDuration: '',
    offDuration: ''
  });
  const [error, setError] = useState('');

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
        updated.weekDay = '';
        updated.delayTime = '';
        updated.delayUnit = 'ms';
        updated.onDuration = '';
        updated.offDuration = '';
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
      delayTime, 
      onDuration, 
      offDuration 
    } = currentCondition;
    
    switch(type) {
      case 'SENSOR':
        if (!input) return 'Please select an input device';
        if (!operator) return 'Please select an operator';
        if (value === '') return 'Please enter a value';
        break;
      case 'TIME':
        if (!operator) return 'Please select a time condition';
        if (!currentCondition.timeValue) return 'Please select a time';
        if (operator === 'WEEKLY_ON' && !currentCondition.weekDay) {
          return 'Please select a day of the week';
        }
        break;
      case 'DELAY':
        if (!operator) return 'Please select a delay type';
        if (!delayTime || delayTime <= 0) return 'Please enter a valid delay time';
        break;
      case 'ON_OFF':
        if (!onDuration || onDuration <= 0) return 'Please enter a valid ON duration';
        if (!offDuration || offDuration <= 0) return 'Please enter a valid OFF duration';
        break;
    }
    
    if (!output) return 'Please select an output device';
    if (!action) return 'Please select an action';
    
    return null;
  };

  const handleAddCondition = () => {
    const validationError = validateCondition();
    if (validationError) {
      setError(validationError);
      return;
    }

    const newCondition = {
      id: Date.now(),
      type: currentCondition.type,
      output: {
        device: selectedDevices.outputs.find(d => d.id === currentCondition.output),
        action: currentCondition.action,
        value: currentCondition.actionValue
      }
    };

    // Add type-specific properties
    switch(currentCondition.type) {
      case 'SENSOR':
        newCondition.input = {
          device: selectedDevices.inputs.find(d => d.id === currentCondition.input),
          operator: currentCondition.operator,
          value: currentCondition.value
        };
        break;
      case 'TIME':
        newCondition.input = {
          operator: currentCondition.operator,
          timeValue: currentCondition.timeValue,
          weekDay: currentCondition.weekDay
        };
        break;
      case 'DELAY':
        newCondition.input = {
          operator: currentCondition.operator,
          delayTime: parseInt(currentCondition.delayTime),
          delayUnit: currentCondition.delayUnit
        };
        break;
      case 'ON_OFF':
        newCondition.input = {
          onDuration: parseInt(currentCondition.onDuration),
          offDuration: parseInt(currentCondition.offDuration),
          unit: currentCondition.delayUnit
        };
        break;
    }

    const updatedConditions = [...conditions, newCondition];
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
      weekDay: '',
      delayTime: '',
      delayUnit: 'ms',
      onDuration: '',
      offDuration: ''
    });
  };

  const renderDelayInputs = () => {
    return (
      <div className="delay-inputs">
        <select
          value={currentCondition.operator}
          onChange={(e) => handleInputChange('operator', e.target.value)}
          className="logic-dropdown"
        >
          <option value="">Select Delay Type</option>
          {OPERATORS.DELAY.map(op => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
        
        <div className="delay-time-input">
          <input
            type="number"
            value={currentCondition.delayTime}
            onChange={(e) => handleInputChange('delayTime', e.target.value)}
            placeholder="Delay time"
            min="1"
            className="logic-input"
          />
          <select
            value={currentCondition.delayUnit}
            onChange={(e) => handleInputChange('delayUnit', e.target.value)}
            className="logic-dropdown"
          >
            <option value="ms">Milliseconds</option>
            <option value="s">Seconds</option>
            <option value="m">Minutes</option>
          </select>
        </div>
      </div>
    );
  };

  const renderOnOffInputs = () => {
    return (
      <div className="on-off-inputs">
        <div className="duration-input">
          <label>ON Duration:</label>
          <div className="time-input-group">
            <input
              type="number"
              value={currentCondition.onDuration}
              onChange={(e) => handleInputChange('onDuration', e.target.value)}
              placeholder="ON time"
              min="1"
              className="logic-input"
            />
            <select
              value={currentCondition.delayUnit}
              onChange={(e) => handleInputChange('delayUnit', e.target.value)}
              className="logic-dropdown"
            >
              <option value="ms">Milliseconds</option>
              <option value="s">Seconds</option>
              <option value="m">Minutes</option>
            </select>
          </div>
        </div>
        
        <div className="duration-input">
          <label>OFF Duration:</label>
          <div className="time-input-group">
            <input
              type="number"
              value={currentCondition.offDuration}
              onChange={(e) => handleInputChange('offDuration', e.target.value)}
              placeholder="OFF time"
              min="1"
              className="logic-input"
            />
            <select
              value={currentCondition.delayUnit}
              onChange={(e) => handleInputChange('delayUnit', e.target.value)}
              className="logic-dropdown"
            >
              <option value="ms">Milliseconds</option>
              <option value="s">Seconds</option>
              <option value="m">Minutes</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="logic-builder">
      <div className="logic-form">
        <h3>Create New Logic Condition</h3>
        {error && <div className="error-message">{error}</div>}
        
        <div className="logic-form-grid">
          {/* Condition Type Selection */}
          <div className="form-group">
            <label>Condition Type</label>
            <select
              value={currentCondition.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="logic-dropdown"
            >
              <option value="SENSOR">Sensor Based</option>
              <option value="TIME">Time Based</option>
              <option value="DELAY">Delay</option>
              <option value="ON_OFF">ON/OFF Timing</option>
            </select>
          </div>

          {/* Render different inputs based on condition type */}
          {currentCondition.type === 'SENSOR' && (
            <>
              {/* Existing sensor inputs */}
            </>
          )}
          
          {currentCondition.type === 'TIME' && (
            <>
              {/* Existing time inputs */}
            </>
          )}
          
          {currentCondition.type === 'DELAY' && renderDelayInputs()}
          
          {currentCondition.type === 'ON_OFF' && renderOnOffInputs()}

          {/* Output Device Selection - Common for all types */}
          <div className="form-group">
            <label>Output Device</label>
            <select
              value={currentCondition.output}
              onChange={(e) => handleInputChange('output', e.target.value)}
              className="logic-dropdown"
            >
              <option value="">Select Output Device</option>
              {selectedDevices.outputs.map(device => (
                <option key={device.id} value={device.id}>
                  {device.name} (Pin {device.pin})
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
                {(selectedDevices.outputs.find(d => d.id === currentCondition.output)?.type === 'pwm' 
                  ? ACTIONS.PWM 
                  : ACTIONS.DIGITAL
                ).map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          className="add-condition-btn"
          onClick={handleAddCondition}
          disabled={!!validateCondition()}
        >
          Add Condition
        </button>
      </div>

      <div className="conditions-list">
        <h3>Current Conditions</h3>
        {conditions.map((condition, index) => (
          <div key={condition.id} className="condition-item">
            <div className="condition-content">
              <span className="condition-text">
                {renderConditionText(condition)}
              </span>
              <button
                className="remove-condition-btn"
                onClick={() => {
                  const updatedConditions = conditions.filter(c => c.id !== condition.id);
                  setConditions(updatedConditions);
                  onLogicChange(updatedConditions);
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderConditionText(condition) {
  switch(condition.type) {
    case 'SENSOR':
      return `IF ${condition.input.device.name} ${condition.input.operator} ${condition.input.value} 
              THEN ${condition.output.device.name} ${condition.output.action}`;
    case 'TIME':
      return `AT ${condition.input.timeValue}${condition.input.weekDay ? 
              ` on ${DAYS_OF_WEEK[condition.input.weekDay].label}` : ''} 
              THEN ${condition.output.device.name} ${condition.output.action}`;
    case 'DELAY':
      return `${condition.input.operator === 'DELAY' ? 'DELAY' : 'EVERY'} 
              ${condition.input.delayTime}${condition.input.delayUnit} 
              THEN ${condition.output.device.name} ${condition.output.action}`;
    case 'ON_OFF':
      return `CYCLE ${condition.output.device.name}: 
              ON for ${condition.input.onDuration}${condition.input.unit}, 
              OFF for ${condition.input.offDuration}${condition.input.unit}`;
    default:
      return '';
  }
}

export default LogicBuilder;