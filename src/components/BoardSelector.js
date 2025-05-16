import React from 'react';
import './BoardSelector.css';

// Board data with added image URLs
const boards = [
  { 
    id: 'esp32-devkitc', 
    name: 'ESP32 DevKit C', 
    pins: 38,
    image: '/images/boards/esp32-devkitc.png'
  },
  { 
    id: 'esp32-wroom', 
    name: 'ESP32-WROOM', 
    pins: 32,
    image: '/images/boards/esp32-wroom.png'
  },
  { 
    id: 'esp32-wrover', 
    name: 'ESP32-WROVER', 
    pins: 38,
    image: '/images/boards/esp32-wrover.png'
  },
  { 
    id: 'esp32-s2', 
    name: 'ESP32-S2', 
    pins: 43,
    image: '/images/boards/esp32-s2.png'
  },
  { 
    id: 'esp32-c3', 
    name: 'ESP32-C3', 
    pins: 22,
    image: '/images/boards/esp32-c3.png'
  },
  { 
    id: 'esp32-s3', 
    name: 'ESP32-S3', 
    pins: 45,
    image: '/images/boards/esp32-s3.png'
  },
  { 
    id: 'esp32-c6', 
    name: 'ESP32-C6', 
    pins: 22,
    image: '/images/boards/esp32-c6.png'
  },
  { 
    id: 'esp32-h2', 
    name: 'ESP32-H2', 
    pins: 27,
    image: '/images/boards/esp32-h2.png'
  },
  { 
    id: 'esp32-pico-d4', 
    name: 'ESP32-PICO-D4', 
    pins: 28,
    image: '/images/boards/esp32-pico-d4.png'
  },
  { 
    id: 'esp32-solo-1', 
    name: 'ESP32-SOLO-1', 
    pins: 34,
    image: '/images/boards/esp32-solo-1.png'
  }
];

function BoardSelector({ onBoardSelect, selectedBoard }) {
  const handleBoardChange = (event) => {
    const selectedBoardId = event.target.value;
    const board = boards.find(b => b.id === selectedBoardId);
    onBoardSelect(board);
  };

  const handleImageError = (event) => {
    event.target.src = '/images/boards/placeholder.png'; // Fallback image
    event.target.classList.add('image-error');
  };

  return (
    <div className="board-selector-container dark-theme">
      <h3 className="selector-title">ESP32 Board Selection</h3>
      
      <div className="board-dropdown-group">
        <label htmlFor="board-select" className="selector-label">Select ESP32 Board:</label>
        <select 
          id="board-select"
          className="board-dropdown"
          value={selectedBoard?.id || ''}
          onChange={handleBoardChange}
          aria-label="Select ESP32 board model"
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
          <h4 className="details-title">Selected Board Details</h4>
          
          <div className="board-image-container">
            <img 
              src={selectedBoard.image} 
              alt={`${selectedBoard.name} board`} 
              className="board-image"
              onError={handleImageError}
            />
          </div>
          
          <div className="details-card">
            <div className="detail-item">
              <span className="detail-label">Model:</span>
              <span className="detail-value">{selectedBoard.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Available Pins:</span>
              <span className="detail-value">{selectedBoard.pins}</span>
            </div>
          </div>
        </div>
      )}
      
      </div>
  );
}

export default BoardSelector;