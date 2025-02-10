import React, { useState, useEffect } from 'react';
import SerialMonitor from './Serialmon';

const ESP32_UPLOAD_SETTINGS = {
  BAUD_RATE: 115200,
  DTR_DELAY: 100,
  UPLOAD_DELAY: 50,
};

function ArduinoUploader({ code, disabled }) {
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [selectedPort, setSelectedPort] = useState(null);
  const [logs, setLogs] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const addLog = (message) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Connect to serial port
  const connectToBoard = async () => {
    if (!navigator.serial) {
      addLog('ERROR: Web Serial API not supported. Please use Chrome or Edge browser.');
      return;
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ 
        baudRate: ESP32_UPLOAD_SETTINGS.BAUD_RATE,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      setSelectedPort(port);
      setUploadStatus('connected');
      addLog('Successfully connected to board');

      // Set initial DTR and RTS signals
      await port.setSignals({ 
        dataTerminalReady: false,
        requestToSend: false 
      });

    } catch (error) {
      addLog(`Connection error: ${error.message}`);
      setUploadStatus('error');
    }
  };

  // Reset the board before upload
  const resetBoard = async () => {
    if (!selectedPort) return;

    try {
      addLog('Resetting board...');
      
      // Toggle DTR/RTS for reset
      await selectedPort.setSignals({ 
        dataTerminalReady: false, 
        requestToSend: true 
      });
      await new Promise(r => setTimeout(r, ESP32_UPLOAD_SETTINGS.DTR_DELAY));
      
      await selectedPort.setSignals({ 
        dataTerminalReady: true, 
        requestToSend: false 
      });
      await new Promise(r => setTimeout(r, ESP32_UPLOAD_SETTINGS.DTR_DELAY));
      
      await selectedPort.setSignals({ 
        dataTerminalReady: false, 
        requestToSend: false 
      });

      addLog('Board reset complete');
    } catch (error) {
      throw new Error(`Reset failed: ${error.message}`);
    }
  };

  // Upload code to the board
  const uploadCode = async () => {
    if (!selectedPort || !code || disabled) {
      addLog('ERROR: Cannot upload - no connection, code, or upload disabled');
      return;
    }

    try {
      setUploadStatus('uploading');
      setUploadProgress(0);
      addLog('Starting upload process...');

      // Reset board
      await resetBoard();

      // Get writer for serial port
      const writer = selectedPort.writable.getWriter();
      const encoder = new TextEncoder();

      // Prepare code for upload
      const lines = code.split('\n').filter(line => line.trim());
      const totalLines = lines.length;

      // Upload code line by line
      for (let i = 0; i < totalLines; i++) {
        const line = lines[i].trim();
        if (line) {
          // Send line with proper line ending
          await writer.write(encoder.encode(line + '\r\n'));
          
          // Small delay between lines
          await new Promise(r => setTimeout(r, ESP32_UPLOAD_SETTINGS.UPLOAD_DELAY));

          // Update progress
          const progress = Math.round(((i + 1) / totalLines) * 100);
          setUploadProgress(progress);
          
          if (progress % 10 === 0) {
            addLog(`Upload progress: ${progress}%`);
          }
        }
      }

      // Release the writer
      writer.releaseLock();

      // Final reset after upload
      await resetBoard();
      
      setUploadStatus('success');
      addLog('Upload completed successfully!');
      
      // Reset status after delay
      setTimeout(() => setUploadStatus('connected'), 3000);

    } catch (error) {
      setUploadStatus('error');
      addLog(`Upload failed: ${error.message}`);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (selectedPort) {
        selectedPort.close().catch(console.error);
      }
    };
  }, [selectedPort]);

  return (
    <div className="arduino-uploader">

      <div className="uploader-header">
        <h3>Upload to Board</h3>
        <div className={`status-indicator ${uploadStatus}`}>
          Status: {uploadStatus.charAt(0).toUpperCase() + uploadStatus.slice(1)}
        </div>
      </div>

      <div className="uploader-controls">
        {!selectedPort ? (
          <button
            className="connect-button"
            onClick={connectToBoard}
            disabled={!navigator.serial || disabled}
          >
            Connect to Board
          </button>
        ) : (
          <div className="button-group">
            <button
              className={`upload-button ${uploadStatus}`}
              onClick={uploadCode}
              disabled={disabled || uploadStatus === 'uploading'}
            >
              {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Code'}
            </button>
            <button
              className="disconnect-button"
              onClick={async () => {
                await selectedPort.close();
                setSelectedPort(null);
                setUploadStatus('idle');
                addLog('Disconnected from board');
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {uploadStatus === 'uploading' && (
        <div className="upload-progress">
          <div 
            className="progress-bar"
            style={{ width: `${uploadProgress}%` }}
          />
          <span className="progress-text">{uploadProgress}%</span>
        </div>
      )}

      <div className="upload-logs">
        <div className="logs-header">
          <h4>Upload Logs</h4>
          <button 
            className="clear-logs-button"
            onClick={() => setLogs([])}
          >
            Clear Logs
          </button>
        </div>
        <div className="logs-container">
          {logs.map((log, index) => (
            <div 
              key={index} 
              className={`log-entry ${log.includes('ERROR') ? 'error' : ''}`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
      {selectedPort && (
        <SerialMonitor
          port={selectedPort}
          enabled={uploadStatus !== 'uploading'}
        />
      )}
    </div>
  );
}

export default ArduinoUploader;