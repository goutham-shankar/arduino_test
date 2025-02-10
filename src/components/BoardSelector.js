import React from 'react';


const boards = [
  { id: 'esp32-devkitc', name: 'ESP32 DevKit C', pins: 38 },
  { id: 'esp32-wroom', name: 'ESP32-WROOM', pins: 32 },
  { id: 'esp32-wrover', name: 'ESP32-WROVER', pins: 38 },
  { id: 'esp32-s2', name: 'ESP32-S2', pins: 43 },
  { id: 'esp32-c3', name: 'ESP32-C3', pins: 22 }
];

function BoardSelector({ onBoardSelect, selectedBoard }) {
  const handleBoardChange = (event) => {
    const selectedBoardId = event.target.value;
    const board = boards.find(b => b.id === selectedBoardId);
    onBoardSelect(board);
  };

  return (
    <div className="board-selector-container">
      <div className="board-dropdown-group">
        <label htmlFor="board-select">Select ESP32 Board:</label>
        <select 
          id="board-select"
          className="board-dropdown"
          value={selectedBoard?.id || ''}
          onChange={handleBoardChange}
        >
          <option value="">-- Select a board --</option>
          {boards.map(board => (
            <option key={board.id} value={board.id}>
              {board.name} ({board.pins} pins)
            </option>
          ))}
        </select>
      </div>
      
      {selectedBoard && (
        <div className="board-details">
          <h4>Selected Board Details:</h4>
          <ul>
            <li>Model: {selectedBoard.name}</li>
            <li>Available Pins: {selectedBoard.pins}</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default BoardSelector;