import React, { useState, useEffect } from 'react';


const CONDITION_TYPES = {
  SENSOR: 'SENSOR',
  TIME: 'TIME'
};

const OPERATORS = {
  DIGITAL: ['==', '!='],
  ANALOG: ['==', '!=', '>', '<', '>=', '<='],
  TIME: ['DAILY_AT', 'WEEKLY_ON', 'TIME_AFTER', 'TIME_BEFORE', 'TIME_EQUALS']
};

const CONDITIONS = {
  DIGITAL: ['HIGH', 'LOW'],
  ANALOG: [] // Values will be handled by number input
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
    weekDay: ''
  });
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
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
      } else if (field === 'operator' && updated.type === 'TIME') {
        updated.timeValue = '';
        updated.weekDay = '';
      }

      return updated;
    });
  };

  const validateCondition = () => {
    const { type, input, operator, value, output, action, timeValue, weekDay } = currentCondition;
    
    if (type === 'SENSOR') {
      if (!input) return 'Please select an input device';
      if (!operator) return 'Please select an operator';
      if (value === '') return 'Please enter a value';
    } else if (type === 'TIME') {
      if (!operator) return 'Please select a time condition';
      if (!timeValue) return 'Please select a time';
      if (operator === 'WEEKLY_ON' && !weekDay) return 'Please select a day of the week';
    }
    
    if (!output) return 'Please select an output device';
    if (!action) return 'Please select an action';
    
    const outputDevice = getSelectedDevice(output, 'output');
    if (outputDevice?.type === 'pwm' && action === 'setValue' && currentCondition.actionValue === '') {
      return 'Please enter an action value';
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

    const newCondition = {
      id: Date.now(),
      type: currentCondition.type,
      input: currentCondition.type === 'SENSOR' ? {
        device: getSelectedDevice(currentCondition.input, 'input'),
        operator: currentCondition.operator,
        value: currentCondition.value,
        type: getSelectedDevice(currentCondition.input, 'input')?.type
      } : {
        operator: currentCondition.operator,
        timeValue: currentCondition.timeValue,
        weekDay: currentCondition.weekDay
      },
      output: {
        device: getSelectedDevice(currentCondition.output, 'output'),
        action: currentCondition.action,
        value: currentCondition.actionValue,
        type: getSelectedDevice(currentCondition.output, 'output')?.type
      }
    };

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
      weekDay: ''
    });
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
        <input
          type="time"
          value={currentCondition.timeValue}
          onChange={(e) => handleInputChange('timeValue', e.target.value)}
          className="logic-input"
          required
        />
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
              disabled={!isValid}
            >
              <option value="SENSOR">Sensor Based</option>
              <option value="TIME">Time Based</option>
            </select>
          </div>

          {currentCondition.type === 'SENSOR' ? (
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
                        {device.name} (Pin {device.pin})
                      </option>
                    ))}
                </select>
              </div>

              {/* Operator Selection for Sensor */}
              {currentCondition.input && (
                <div className="form-group">
                  <label>Operator</label>
                  <select
                    value={currentCondition.operator}
                    onChange={(e) => handleInputChange('operator', e.target.value)}
                    className="logic-dropdown"
                  >
                    <option value="">Select Operator</option>
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
          ) : (
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
                    <option key={op} value={op}>{op.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              {/* Time Input */}
              {currentCondition.operator && (
                <div className="form-group">
                  <label>Time Setting</label>
                  {renderTimeInput()}
                </div>
              )}
            </>
          )}

          {/* Output Device Selection - Common for both types */}
          {((currentCondition.type === 'SENSOR' && currentCondition.value) || 
            (currentCondition.type === 'TIME' && currentCondition.timeValue)) && (
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
                      {device.name} (Pin {device.pin})
                    </option>
                  ))}
              </select>
            </div>
          )}

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
                {(getSelectedDevice(currentCondition.output, 'output')?.type === 'pwm' 
                  ? ACTIONS.PWM 
                  : ACTIONS.DIGITAL
                ).map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
          )}

          {/* Action Value Input (for PWM) */}
          {currentCondition.output && 
           getSelectedDevice(currentCondition.output, 'output')?.type === 'pwm' && 
           currentCondition.action === 'setValue' && (
            <div className="form-group">
              <label>Action Value</label>
              <input
                type="number"
                value={currentCondition.actionValue}
                onChange={(e) => handleInputChange('actionValue', e.target.value)}
                placeholder="Enter PWM value (0-255)"
                className="logic-input"
                min="0"
                max="255"
              />
            </div>
          )}
        </div>

        <button
          className="add-condition-btn"
          onClick={handleAddCondition}
          disabled={!isValid || !!validateCondition()}
        >
          Add Condition
        </button>
      </div>

      <div className="conditions-list">
        <h3>Current Conditions</h3>
        {conditions.length === 0 && (
          <div className="no-conditions">No conditions added yet</div>
        )}
        {conditions.map(condition => (
          <div key={condition.id} className="condition-item">
            <div className="condition-content">
              <span className="condition-text">
                {condition.type === 'SENSOR' ? (
                  <>
                    IF {condition.input.device.name} (Pin {condition.input.device.pin}) 
                    {' '}{condition.input.operator}{' '}
                    {condition.input.value}
                  </>
                ) : (
                  <>
                    IF time is {condition.input.operator.replace('_', ' ').toLowerCase()} 
                    {condition.input.weekDay ? ` on ${DAYS_OF_WEEK[condition.input.weekDay].label}` : ''} 
                    {' at '}{condition.input.timeValue}
                  </>
                )}
                {' '}THEN {condition.output.device.name} (Pin {condition.output.device.pin})
                {' '}{condition.output.action}
                {condition.output.value ? ` ${condition.output.value}` : ''}
              </span>
              <button
                className="remove-condition-btn"
                onClick={() => {
                  const updatedConditions = conditions.filter(c => c.id !== condition.id);
                  setConditions(updatedConditions);
                  onLogicChange(updatedConditions);
                }}
                title="Remove condition"
              >
                ×
              </button>
            </div>
          </div>
        ),[])}
      </div>
    </div>
  );
}

export default LogicBuilder;