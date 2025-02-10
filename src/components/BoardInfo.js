import React, { useState, useEffect } from 'react';


function BoardInfo({ port, onBoardDetect }) {
  const [boardInfo, setBoardInfo] = useState({
    name: 'Unknown',
    id: 'N/A',
    status: 'disconnected',
    lastPing: null
  });

  // Request board information
  const getBoardInfo = async () => {
    if (!port) return;

    try {
      const writer = port.writable.getWriter();
      const reader = port.readable.getReader();

      // Send identification request
      const encoder = new TextEncoder();
      await writer.write(encoder.encode('?\n')); // Query board
      writer.releaseLock();

      // Read response
      const decoder = new TextDecoder();
      let response = '';
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        response += decoder.decode(value);
        if (response.includes('\n')) break;
      }
      reader.releaseLock();

      // Parse board information
      // Format could be: "BOARD:ESP32:123456:READY"
      const [name, id, status] = response.trim().split(':').slice(1);
      
      const newBoardInfo = {
        name: name || 'Unknown',
        id: id || 'N/A',
        status: status?.toLowerCase() || 'connected',
        lastPing: new Date().toISOString()
      };

      setBoardInfo(newBoardInfo);
      onBoardDetect?.(newBoardInfo);

    } catch (error) {
      console.error('Error getting board info:', error);
      setBoardInfo(prev => ({
        ...prev,
        status: 'error',
        lastPing: new Date().toISOString()
      }));
    }
  };

  // Poll board status periodically
  useEffect(() => {
    if (!port) {
      setBoardInfo(prev => ({
        ...prev,
        status: 'disconnected',
        lastPing: new Date().toISOString()
      }));
      return;
    }

    getBoardInfo();
    const interval = setInterval(getBoardInfo, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [port]);

  return (
    <div className="board-info">
      <h4>Connected Board</h4>
      <div className="board-details">
        <div className="board-detail">
          <span className="label">Name:</span>
          <span className="value">{boardInfo.name}</span>
        </div>
        <div className="board-detail">
          <span className="label">ID:</span>
          <span className="value">{boardInfo.id}</span>
        </div>
        <div className="board-detail">
          <span className="label">Status:</span>
          <span className={`value status ${boardInfo.status}`}>
            {boardInfo.status.charAt(0).toUpperCase() + boardInfo.status.slice(1)}
          </span>
        </div>
        {boardInfo.lastPing && (
          <div className="board-detail">
            <span className="label">Last Updated:</span>
            <span className="value">
              {new Date(boardInfo.lastPing).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default BoardInfo;