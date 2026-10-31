const hostname = window.location.hostname || 'localhost';

export const API_BASE = `http://${hostname}:8000`;
export const WS_BASE = `ws://${hostname}:8000`;
