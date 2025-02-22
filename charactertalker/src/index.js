import React from 'react';
import ReactDOM from 'react-dom';
import App from './charactertalker.tsx'; // Corrected import to reference the TypeScript file
import './index.css'; // Assuming you have a CSS file for styles

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
