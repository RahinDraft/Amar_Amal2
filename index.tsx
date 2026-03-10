
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

window.onerror = function(message, source, lineno, colno, error) {
  const debug = document.createElement('div');
  debug.style.color = 'white';
  debug.style.background = 'red';
  debug.style.position = 'fixed';
  debug.style.bottom = '0';
  debug.style.left = '0';
  debug.style.right = '0';
  debug.style.padding = '10px';
  debug.style.zIndex = '9999';
  debug.style.fontSize = '10px';
  debug.innerText = 'Error: ' + message;
  document.body.appendChild(debug);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  const debug = document.createElement('div');
  debug.style.color = 'white';
  debug.style.position = 'fixed';
  debug.style.top = '0';
  debug.style.zIndex = '9999';
  debug.innerText = 'Root element not found!';
  document.body.appendChild(debug);
  throw new Error("Could not find root element to mount to");
}

console.log('Mounting React app...');
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
