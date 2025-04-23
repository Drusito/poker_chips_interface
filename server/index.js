// Punto de entrada del servidor
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const socketManager = require('./socket/socketManager');
const { PORT } = require('./config/constants');

// Inicializar aplicación Express
const app = express();
const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../client')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Inicializar gestión de sockets
socketManager(io);

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Manejo de errores de servidor
server.on('error', (error) => {
  console.error('Error en el servidor:', error);
});

// Manejo de cierre del servidor
process.on('SIGINT', () => {
  console.log('\nCerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});