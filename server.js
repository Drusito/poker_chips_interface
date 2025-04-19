const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const salas = {};
const SMALL_BLIND = 1;
const BIG_BLIND = 2;
const FASES = ['PreFlop', 'Flop', 'Turn', 'River'];

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
        fase: 'PreFlop',
        indiceDealer: 0,
        sbId: null,
        bbId: null
      };
    }

    const sala = salas[salaId];
    sala.jugadores[socket.id] = {
      nombre,
      balance: 2000,
      retirado: false,
      apuestaRonda: 0,
      ultimaApuesta: 0,
      listo: false
    };

    sala.ordenTurnos.push(socket.id);

    actualizarEstado(salaId);
  });

  socket.on('marcarListo', (salaId) => {
    const sala = salas[salaId];
    if (!sala || !sala.jugadores[socket.id]) return;
  
    // Solo permitir marcar "Listo" si es el inicio del juego (antes de la primera mano)
    if (sala.fase === 'PreFlop' && !sala.jugadores[socket.id].listo) {
      sala.jugadores[socket.id].listo = true;
  
      const todosListos = sala.ordenTurnos.every(id => sala.jugadores[id].listo);
  
      if (todosListos && sala.ordenTurnos.length >= 2) {
        iniciarMano(salaId); // Iniciar la mano si todos están listos
      }
  
      actualizarEstado(salaId);
    }
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

// Evento para pasar a la siguiente mano
socket.on('siguienteMano', ({ salaId, ganadorId }) => {
  const sala = salas[salaId];
  if (!sala || !sala.jugadores[ganadorId]) return;

  // Asignar el pozo al ganador
  sala.jugadores[ganadorId].balance += sala.pozo;

  // Reiniciar estado para la siguiente mano
  sala.pozo = 0;
  sala.apuestaActual = 0;
  sala.fase = 'PreFlop';

  // Desmarcar a todos los jugadores como retirados y resetear apuestas
  sala.ordenTurnos.forEach(id => {
    sala.jugadores[id].retirado = false;
    sala.jugadores[id].apuestaRonda = 0;
    sala.jugadores[id].ultimaApuesta = 0;
  });

  // Rotar la ciega pequeña y la ciega grande
  sala.indiceDealer = (sala.indiceDealer + 1) % sala.ordenTurnos.length;
  const dealerIdx = sala.indiceDealer;
  const sbIdx = (dealerIdx + 1) % sala.ordenTurnos.length;
  const bbIdx = (dealerIdx + 2) % sala.ordenTurnos.length;

  const sbId = sala.ordenTurnos[sbIdx];
  const bbId = sala.ordenTurnos[bbIdx];

  // Asignar las ciegas a los jugadores correspondientes
  sala.sbId = sbId;
  sala.bbId = bbId;

  sala.jugadores[sbId].balance -= SMALL_BLIND;
  sala.jugadores[sbId].apuestaRonda = SMALL_BLIND;
  sala.jugadores[sbId].ultimaApuesta = SMALL_BLIND;

  sala.jugadores[bbId].balance -= BIG_BLIND;
  sala.jugadores[bbId].apuestaRonda = BIG_BLIND;
  sala.jugadores[bbId].ultimaApuesta = BIG_BLIND;

  sala.apuestaActual = BIG_BLIND;

  // Definir el primer jugador para la nueva mano (el siguiente jugador después de BB)
  const primerJugadorIdx = (bbIdx + 1) % sala.ordenTurnos.length;
  sala.turno = sala.ordenTurnos[primerJugadorIdx];

  // Actualizar el estado
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

function iniciarMano(salaId) {
  const sala = salas[salaId];

  const dealerIdx = sala.indiceDealer;
  const sbIdx = (dealerIdx + 1) % sala.ordenTurnos.length;
  const bbIdx = (dealerIdx + 2) % sala.ordenTurnos.length;
  const sbId = sala.ordenTurnos[sbIdx];
  const bbId = sala.ordenTurnos[bbIdx];

  sala.sbId = sbId;
  sala.bbId = bbId;

  sala.jugadores[sbId].balance -= SMALL_BLIND;
  sala.jugadores[sbId].apuestaRonda = SMALL_BLIND;
  sala.jugadores[sbId].ultimaApuesta = SMALL_BLIND;

  sala.jugadores[bbId].balance -= BIG_BLIND;
  sala.jugadores[bbId].apuestaRonda = BIG_BLIND;
  sala.jugadores[bbId].ultimaApuesta = BIG_BLIND;

  sala.apuestaActual = BIG_BLIND;
  sala.fase = 'PreFlop';

  const primerJugadorIdx = (bbIdx + 1) % sala.ordenTurnos.length;
  sala.turno = sala.ordenTurnos[primerJugadorIdx];
}

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

    const idxFase = FASES.indexOf(sala.fase);
    if (idxFase < FASES.length - 1) {
      sala.fase = FASES[idxFase + 1];
      // Reinicia turnos postflop, empieza desde SB o el siguiente no retirado
      const sbIdx = sala.ordenTurnos.indexOf(sala.sbId);
      for (let i = 0; i < sala.ordenTurnos.length; i++) {
        const idx = (sbIdx + i) % sala.ordenTurnos.length;
        const candidato = sala.ordenTurnos[idx];
        if (!sala.jugadores[candidato].retirado) {
          sala.turno = candidato;
          break;
        }
      }
    }
  }
}

function actualizarEstado(salaId) {
  const sala = salas[salaId];
  if (!sala) return;

  // Crear un objeto con los jugadores donde los que tienen ciega pequeña y grande tienen las etiquetas
  const jugadoresConCiegas = {};

  for (let id in sala.jugadores) {
    const jugador = sala.jugadores[id];
    let nombre = jugador.nombre;

    // Añadir la etiqueta de Ciega Pequeña o Ciega Grande
    if (id === sala.sbId) {
      nombre += ' (CP)';  // Ciega Pequeña
    } else if (id === sala.bbId) {
      nombre += ' (CG)';  // Ciega Grande
    }

    jugadoresConCiegas[id] = { ...jugador, nombre };
  }

  // Emitir el estado actualizado con los jugadores modificados
  io.to(salaId).emit('estadoActualizado', {
    jugadores: jugadoresConCiegas,
    pozo: sala.pozo,
    turno: sala.turno,
    apuestaActual: sala.apuestaActual,
    salaId: salaId,
    todosListos: sala.ordenTurnos.every(id => sala.jugadores[id].listo),
    fase: sala.fase,
    sbId: sala.sbId,
    bbId: sala.bbId
  });
}


http.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});  
