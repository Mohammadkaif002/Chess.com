import { useChessStore } from './store';

export type MultiplayerState = {
  gameCode: string | null;
  role: 'host' | 'guest' | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  errorMessage: string | null;
};

let peerInstance: any = null;
let activeConnection: any = null;
let gameCode: string | null = null;
let role: 'host' | 'guest' | null = null;
let status: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
let errorMessage: string | null = null;

let listeners: ((state: MultiplayerState) => void)[] = [];

export const getMultiplayerState = (): MultiplayerState => ({
  gameCode,
  role,
  status,
  errorMessage,
});

export const subscribeMultiplayer = (listener: (state: MultiplayerState) => void) => {
  listeners.push(listener);
  // Send initial state immediately
  listener(getMultiplayerState());
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};

const notifyListeners = () => {
  const state = getMultiplayerState();
  listeners.forEach((l) => l(state));
};

const generateCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const handleDisconnect = (reason: string | null = null) => {
  status = 'disconnected';
  errorMessage = reason;
  notifyListeners();
  
  // If the game was active, update status to resigned/finished
  const store = useChessStore.getState();
  if (store.gameMode === 'vs-friend-online' && store.gameStatus === 'playing') {
    // If opponent disconnected, local player wins by resignation
    const opponentColor = store.boardOrientation === 'white' ? 'black' : 'white';
    store.resignGame(opponentColor, true);
  }
};

const setupConnectionListeners = (conn: any) => {
  conn.on('data', (data: any) => {
    if (!data || typeof data !== 'object') return;

    console.log('[Multiplayer] Received message:', data);
    const store = useChessStore.getState();

    switch (data.type) {
      case 'init-game': {
        const { timeControl, hostColor } = data;
        const guestColor = hostColor === 'white' ? 'black' : 'white';

        status = 'connected';
        notifyListeners();

        // Start game on guest browser
        store.startGame('vs-friend-online', timeControl);
        
        // Wait briefly for store to initialize, then check if we need to flip board orientation
        // Default board orientation is white. If guest is black, flip board.
        setTimeout(() => {
          const currentStore = useChessStore.getState();
          if (currentStore.boardOrientation !== guestColor) {
            currentStore.flipBoard();
          }
        }, 50);
        break;
      }

      case 'move': {
        const { from, to, promotion } = data;
        store.makeMove(from, to, promotion, true);
        break;
      }

      case 'resign': {
        // Resign opponent color (which is opposite of local player color)
        const opponentColor = store.boardOrientation === 'white' ? 'black' : 'white';
        store.resignGame(opponentColor, true);
        break;
      }

      case 'restart': {
        store.resetGame(true);
        break;
      }
    }
  });

  conn.on('close', () => {
    console.log('[Multiplayer] Connection closed by peer.');
    handleDisconnect('Connection lost with opponent.');
  });

  conn.on('error', (err: any) => {
    console.error('[Multiplayer] Connection error:', err);
    handleDisconnect('Network connection error.');
  });
};

export const hostGame = async (
  timeControl: number | null,
  colorPreference: 'white' | 'black' | 'random'
) => {
  disconnectMultiplayer();

  status = 'connecting';
  role = 'host';
  errorMessage = null;
  gameCode = generateCode();
  notifyListeners();

  try {
    const { Peer } = await import('peerjs');
    const peerId = `royalty-chess-${gameCode}`;
    const peer = new Peer(peerId);
    peerInstance = peer;

    peer.on('open', () => {
      console.log('[Multiplayer] Host Peer opened. Code:', gameCode);
      notifyListeners();
    });

    peer.on('connection', (conn) => {
      console.log('[Multiplayer] Guest connected!');
      activeConnection = conn;

      conn.on('open', () => {
        status = 'connected';
        notifyListeners();

        // Decide colors
        let hostColor: 'white' | 'black' = 'white';
        if (colorPreference === 'random') {
          hostColor = Math.random() < 0.5 ? 'white' : 'black';
        } else {
          hostColor = colorPreference;
        }

        // Send initialization package to the guest
        conn.send({
          type: 'init-game',
          timeControl,
          hostColor,
        });

        // Start game on host browser
        const store = useChessStore.getState();
        store.startGame('vs-friend-online', timeControl);
        
        // Match host orientation to hostColor
        setTimeout(() => {
          const currentStore = useChessStore.getState();
          if (currentStore.boardOrientation !== hostColor) {
            currentStore.flipBoard();
          }
        }, 50);
      });

      setupConnectionListeners(conn);
    });

    peer.on('error', (err: any) => {
      console.error('[Multiplayer] Peer error:', err);
      if (err.type === 'unavailable-id') {
        // Regenerate code and retry
        console.log('[Multiplayer] ID collision, retrying with new code...');
        hostGame(timeControl, colorPreference);
      } else {
        status = 'error';
        errorMessage = err.message || 'Failed to host game.';
        notifyListeners();
      }
    });

  } catch (err: any) {
    console.error('[Multiplayer] Dynamic import of PeerJS failed:', err);
    status = 'error';
    errorMessage = 'Failed to load networking library.';
    notifyListeners();
  }
};

export const joinGame = async (code: string) => {
  disconnectMultiplayer();

  const formattedCode = code.trim().toUpperCase();
  if (formattedCode.length !== 6) {
    status = 'error';
    errorMessage = 'Game code must be exactly 6 characters.';
    notifyListeners();
    return;
  }

  status = 'connecting';
  role = 'guest';
  gameCode = formattedCode;
  errorMessage = null;
  notifyListeners();

  try {
    const { Peer } = await import('peerjs');
    // Guest connects with a random ID
    const peer = new Peer();
    peerInstance = peer;

    peer.on('open', () => {
      console.log('[Multiplayer] Guest Peer opened. Connecting to:', formattedCode);
      const peerId = `royalty-chess-${formattedCode}`;
      const conn = peer.connect(peerId);
      activeConnection = conn;

      conn.on('open', () => {
        console.log('[Multiplayer] Connected to host data channel.');
      });

      setupConnectionListeners(conn);
    });

    peer.on('error', (err: any) => {
      console.error('[Multiplayer] Guest Peer error:', err);
      status = 'error';
      errorMessage = 'Room not found or server unreachable. Please check the code.';
      notifyListeners();
    });

  } catch (err: any) {
    console.error('[Multiplayer] Dynamic import of PeerJS failed:', err);
    status = 'error';
    errorMessage = 'Failed to load networking library.';
    notifyListeners();
  }
};

export const sendMove = (from: string, to: string, promotion?: string) => {
  if (activeConnection && status === 'connected') {
    activeConnection.send({
      type: 'move',
      from,
      to,
      promotion,
    });
  }
};

export const sendResign = () => {
  if (activeConnection && status === 'connected') {
    activeConnection.send({
      type: 'resign',
    });
  }
};

export const sendRestart = () => {
  if (activeConnection && status === 'connected') {
    activeConnection.send({
      type: 'restart',
    });
  }
};

export const disconnectMultiplayer = () => {
  if (activeConnection) {
    try {
      activeConnection.close();
    } catch {}
    activeConnection = null;
  }
  if (peerInstance) {
    try {
      peerInstance.destroy();
    } catch {}
    peerInstance = null;
  }
  gameCode = null;
  role = null;
  status = 'disconnected';
  errorMessage = null;
  notifyListeners();
};
