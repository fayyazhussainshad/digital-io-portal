/* 
  app-core-patch.js — Run AFTER app-core.js
  Adds Islamic ticker init + button logging  
  DO NOT USE app-core.js from this session — re-upload from GitHub
*/

// Override startNewsTicker to use new system
window.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    if (typeof initIslamicMessages === 'function') {
      initIslamicMessages();
    }
  }, 1000);
});
