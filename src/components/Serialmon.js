import React, { useState, useEffect, useRef } from 'react';


function SerialMonitor({ port, enabled }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef(null);
  const readerRef = useRef(null);

  const addMessage = (message, type = 'received') => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prev => [...prev, { timestamp, message: message.trim(), type }]);
  };

  const startReading = async () => {
    if (!port || !enabled || readerRef.current) return;

    try {
      const reader = port.readable.getReader();
      readerRef.current = reader;
      setIsConnected(true);
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          reader.releaseLock();
          break;
        }
        const text = decoder.decode(value);
        if (text.trim()) {
          addMessage(text);
        }
      }
    } catch (error) {
      console.error('Serial read error:', error);
      addMessage(`Error: ${error.message}`, 'error');
    } finally {
      setIsConnected(false);
      readerRef.current = null;
    }
  };

  const stopReading = async () => {
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
        await readerRef.current.releaseLock();
      } catch (error) {
        console.error('Error stopping reader:', error);
      }
      readerRef.current = null;
      setIsConnected(false);
    }
  };

  const sendMessage = async () => {
    if (!port || !inputMessage.trim()) return;

    try {
      const writer = port.writable.getWriter();
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(inputMessage + '\n'));
      writer.releaseLock();
      addMessage(inputMessage, 'sent');
      setInputMessage('');
    } catch (error) {
      console.error('Serial write error:', error);
      addMessage(`Error sending: ${error.message}`, 'error');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (port && enabled) {
      startReading();
    }
    return () => stopReading();
  }, [port, enabled]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, autoScroll]);

  return (
    <div className="serial-monitor">
      <div className="monitor-header">
        <h3>Serial Monitor</h3>
        <div className="monitor-controls">
          <div className="status-indicator">
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className="auto-scroll">
            <input
              type="checkbox"
              id="autoScroll"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            <label htmlFor="autoScroll">Auto-scroll</label>
          </div>
          <button
            className="clear-button"
            onClick={() => setMessages([])}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            <span className="timestamp">{msg.timestamp}</span>
            <span className="content">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type message and press Enter to send..."
          disabled={!port || !enabled}
        />
        <button
          onClick={sendMessage}
          disabled={!port || !enabled || !inputMessage.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default SerialMonitor;