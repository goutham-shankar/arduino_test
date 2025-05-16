import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import BoardSelector from './components/BoardSelector';
import DeviceSelector from './components/DeviceSelector';
import LogicBuilder from './components/LogicBuilder';

import './App.css';

function App() {
  const [selectedBoard, setSelectedBoard] = React.useState(null);
  const [selectedDevices, setSelectedDevices] = React.useState({
    inputs: [],
    outputs: []
  });
  const [logicConditions, setLogicConditions] = React.useState([]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-container">
        <h1>ESP32 Project Builder</h1>
        
        <div className="main-content">
          <div className="section">
            <h2>1. Select Board</h2>
            <BoardSelector 
              onBoardSelect={setSelectedBoard} 
              selectedBoard={selectedBoard}
            />
          </div>

          <div className="section">
            <h2>2. Select Devices</h2>
            <DeviceSelector
              onDevicesChange={setSelectedDevices}
              selectedDevices={selectedDevices}
            />
          </div>

          <div className="section">
            <h2>3. Build Logic</h2>
            <LogicBuilder
              selectedDevices={selectedDevices}
              onLogicChange={setLogicConditions}
              logicConditions={logicConditions}
            />
          </div>

          
        </div>
      </div>
    </DndProvider>
  );
}

export default App;