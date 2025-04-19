const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const salas = {};
const SMALL_BLIND = 1;
const BIG_BLIND = 2;

io.on('connection', socket => {
  console.log('Nuevo jugador conectado:', socket.id);

  socket.on('unirseSala', ({ nombre, salaId }) => {
    socket.join(salaId);

    if (!salas[salaId]) {
      salas[salaId] = {
        jugadores: {},
        ordenTurnos: [],
        turno: null,
        pozo: 0,
        apuestaActual: 0,
        sbIndex: 0
      };
    }

    const sala = salas[salaId];
    sala.jugadores[socket.id] = {
      nombre,
      balance: 2000,
      retirado: false,
      apuestaRonda: 0,
      ultimaApuesta: 0,
      listo: false,
      rol: ''
    };

    sala.ordenTurnos.push(socket.id);

    actualizarEstado(salaId);
  });

  socket.on('marcarListo', (salaId) => {
    const sala = salas[salaId];
    if (!sala || !sala.jugadores[socket.id]) return;

    sala.jugadores[socket.id].listo = true;

    const todosListos = sala.ordenTurnos.every(id => sala.jugadores[id].listo);

    if (todosListos && sala.ordenTurnos.length >= 2) {
      const sbIdx = sala.sbIndex % sala.ordenTurnos.length;
      const bbIdx = (sbIdx + 1) % sala.ordenTurnos.length;

      const sbId = sala.ordenTurnos[sbIdx];
      const bbId = sala.ordenTurnos[bbIdx];

      const sb = sala.jugadores[sbId];
      const bb = sala.jugadores[bbId];

      sb.balance -= SMALL_BLIND;
      sb.apuestaRonda = SMALL_BLIND;
      sb.ultimaApuesta = SMALL_BLIND;
      sb.rol = 'SB';

      bb.balance -= BIG_BLIND;
      bb.apuestaRonda = BIG_BLIND;
      bb.ultimaApuesta = BIG_BLIND;
      bb.rol = 'BB';

      sala.pozo = SMALL_BLIND + BIG_BLIND;
      sala.apuestaActual = BIG_BLIND;

      // Turno comienza desde el siguiente jugador después de BB
      let idx = (bbIdx + 1) % sala.ordenTurnos.length;
      sala.turno = sala.ordenTurnos.find((_, i) =>
        !sala.jugadores[sala.ordenTurnos[(bbIdx + i + 1) % sala.ordenTurnos.length]].retirado
      );
    }

    actualizarEstado(salaId);
  });

  socket.on('accion', ({ salaId, tipo, cantidad }) => {
    const sala = salas[salaId];
    const jugador = sala?.jugadores[socket.id];
    if (!sala || !jugador || sala.turno !== socket.id || jugador.retirado) return;

    switch (tipo) {
      case 'fold':
        jugador.retirado = true;
        break;

      case 'igualar':
        const aPagar = sala.apuestaActual - jugador.apuestaRonda;
        if (jugador.balance >= aPagar) {
          jugador.balance -= aPagar;
          jugador.apuestaRonda += aPagar;
        }
        break;

      case 'subir':
        const totalApuesta = cantidad;
        const incremento = totalApuesta - jugador.apuestaRonda;
        if (jugador.balance >= incremento && incremento > 0) {
          jugador.balance -= incremento;
          jugador.apuestaRonda += incremento;
          jugador.ultimaApuesta = incremento;
          sala.apuestaActual = jugador.apuestaRonda;
        }
        break;
    }

    avanzarTurno(salaId);
    actualizarEstado(salaId);
  });

  socket.on('siguienteMano', ({ salaId, ganadorId }) => {
    const sala = salas[salaId];
    if (!sala || !sala.jugadores[ganadorId]) return;

    sala.jugadores[ganadorId].balance += sala.pozo;

    for (let id of sala.ordenTurnos) {
      const jugador = sala.jugadores[id];
      jugador.retirado = false;
      jugador.apuestaRonda = 0;
      jugador.ultimaApuesta = 0;
      jugador.listo = false;
      jugador.rol = '';
    }

    sala.apuestaActual = 0;
    sala.pozo = 0;
    sala.sbIndex = (sala.sbIndex + 1) % sala.ordenTurnos.length;
    sala.turno = null;

    actualizarEstado(salaId);
  });

  socket.on('disconnect', () => {
    for (let salaId in salas) {
      const sala = salas[salaId];
      if (sala.jugadores[socket.id]) {
        delete sala.jugadores[socket.id];
        sala.ordenTurnos = sala.ordenTurnos.filter(id => id !== socket.id);
        if (sala.turno === socket.id) {
          avanzarTurno(salaId);
        }
        actualizarEstado(salaId);
      }
    }
  });
});

function avanzarTurno(salaId) {
  const sala = salas[salaId];
  if (!sala) return;

  const ids = sala.ordenTurnos;
  if (!ids.length) return;

  const idxActual = ids.indexOf(sala.turno);
  let siguiente = null;

  for (let i = 1; i <= ids.length; i++) {
    const idx = (idxActual + i) % ids.length;
    const candidato = ids[idx];
    if (!sala.jugadores[candidato].retirado) {
      siguiente = candidato;
      break;
    }
  }

  sala.turno = siguiente;

  const todosIgualados = ids.every(id => {
    const j = sala.jugadores[id];
    return j.retirado || j.apuestaRonda === sala.apuestaActual;
  });

  if (todosIgualados) {
    for (let id of ids) {
      sala.pozo += sala.jugadores[id].apuestaRonda;
      sala.jugadores[id].apuestaRonda = 0;
    }
    sala.apuestaActual = 0;
  }
}

function actualizarEstado(salaId) {
  const sala = salas[salaId];
  if (!sala) return;

  io.to(salaId).emit('estadoActualizado', {
    jugadores: sala.jugadores,
    pozo: sala.pozo,
    turno: sala.turno,
    apuestaActual: sala.apuestaActual,
    salaId: salaId,
    todosListos: sala.ordenTurnos.every(id => sala.jugadores[id].listo),
    ordenTurnos: sala.ordenTurnos
  });
}

http.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
