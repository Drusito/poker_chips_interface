# Juego de Póker Multijugador

Un juego de póker multijugador en tiempo real desarrollado con Node.js, Express, Socket.IO y JavaScript puro para el frontend.

## 🚀 Características

- Sistema completo de salas multiusuario
- Gestión de estados y turnos de juego
- Interfaz de usuario intuitiva y atractiva
- Animaciones visuales
- Arquitectura escalable y modular
- Sistema de chat y notificaciones
- Gestión completa del ciclo de juego de póker

## 📋 Requisitos previos

- Node.js (versión 14 o superior)
- NPM (viene con Node.js)

## 🔧 Instalación

1. Clonar el repositorio:

```bash
git clone <url-del-repositorio>
cd poker-game
```

2. Instalar las dependencias:

```bash
npm install
```

3. Iniciar el servidor:

```bash
npm start
```

El juego estará disponible en http://localhost:3000.

## 🎮 Cómo jugar

1. Ingresa tu nombre y crea o únete a una sala existente.
2. Marca que estás listo cuando quieras comenzar.
3. Cuando todos los jugadores estén listos, el juego asignará los roles de dealer, ciega pequeña y ciega grande.
4. En tu turno, puedes realizar diferentes acciones: fold, check, call, bet, raise o all-in.
5. Después de terminar una mano, selecciona el ganador (en una versión futura se implementará la evaluación automática de manos).
6. ¡Disfruta del juego!

## 🏗️ Estructura del proyecto

```
poker-game/
├── server/             # Código del servidor
│   ├── config/         # Configuraciones
│   ├── models/         # Modelos de datos
│   ├── services/       # Servicios
│   ├── socket/         # Gestión de eventos Socket.IO
│   └── index.js        # Punto de entrada del servidor
│
├── client/             # Código del cliente
│   ├── assets/         # Recursos estáticos
│   │   ├── css/        # Estilos
│   │   └── js/         # JavaScript del cliente
│   └── index.html      # Página principal
│
├── package.json        # Dependencias y scripts
└── README.md           # Documentación
```

## 🛠️ Tecnologías utilizadas

- **Backend**:
  - Node.js
  - Express
  - Socket.IO

- **Frontend**:
  - HTML5
  - CSS3
  - JavaScript (ES6+)

## 📝 Notas de desarrollo

### Arquitectura

El proyecto utiliza una arquitectura cliente-servidor con comunicación en tiempo real mediante Socket.IO. Se aplica el patrón MVC en el servidor:

- **Modelos**: Representan las entidades del juego (salas, jugadores).
- **Servicios**: Lógica de negocio para gestionar salas y partidas.
- **Controladores**: Manejadores de eventos Socket.IO que responden a las acciones del cliente.

En el frontend, se utiliza un enfoque orientado a componentes, donde cada elemento de la interfaz es un componente reutilizable e independiente.

### Escalabilidad

- Estructura modular para facilitar el mantenimiento y la extensión.
- Separación clara de responsabilidades entre cliente y servidor.
- Uso de patrones de diseño para facilitar la adición de nuevas características.

## 🔍 Posibles mejoras

- Implementar evaluación automática de manos de póker.
- Añadir sistema de autenticación de usuarios.
- Implementar un sistema de niveles y clasificación.
- Añadir efectos de sonido y más animaciones.
- Desarrollar una aplicación móvil híbrida.
- Implementar pruebas automatizadas.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👏 Agradecimientos

- [Socket.IO](https://socket.io/) por su increíble biblioteca para comunicación en tiempo real.
- [Express](https://expressjs.com/) por el framework web utilizado.
- [Font Awesome](https://fontawesome.com/) por los iconos.