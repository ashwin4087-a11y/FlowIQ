import { getState, tickSignalCountdown, persistBrain } from '../services/flowiqState.js';

export function setupTrafficStream(io) {
  io.on('connection', (socket) => {
    persistBrain();
    socket.emit('flowiq:state', getState());

    socket.on('flowiq:request_state', () => {
      socket.emit('flowiq:state', getState());
    });
  });

  setInterval(() => {
    tickSignalCountdown();
    persistBrain();
    io.emit('flowiq:state', getState());
  }, 1000);
}
