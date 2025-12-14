import Peer, { DataConnection } from 'peerjs';

const ID_PREFIX = 'minesweeper-classic-v1-';

export const generateShortId = () => {
    // Generates a 6 character code like "X9A2B1"
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export class NetworkManager {
    peer: Peer | null = null;
    conn: DataConnection | null = null;
    isHost: boolean = false;
    
    // Callbacks
    onData: ((data: any) => void) | null = null;
    onConnect: (() => void) | null = null;
    onError: ((err: string) => void) | null = null;
    onOpen: ((id: string) => void) | null = null;

    initialize(isHost: boolean, code?: string) {
        // Cleanup existing peer if present
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }

        this.isHost = isHost;
        const myId = isHost && code ? `${ID_PREFIX}${code}` : undefined;

        // Create Peer with config for better reliability
        this.peer = new Peer(myId, {
            debug: 1,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        this.peer.on('open', (id) => {
            console.log('My Peer ID is: ' + id);
            if (this.onOpen) this.onOpen(id);
            
            if (!isHost && code) {
                // If guest, connect immediately to host after we have an ID
                this.connectToHost(code);
            }
        });

        this.peer.on('connection', (conn) => {
            if (this.isHost) {
                // Host accepts connection
                this.setupConnection(conn);
                if (this.onConnect) this.onConnect();
            } else {
                // Guests don't accept incoming connections usually
                conn.close();
            }
        });

        this.peer.on('error', (err) => {
            console.error('PeerJS Error:', err);
            let message = 'Ошибка соединения.';
            if (err.type === 'peer-unavailable') {
                message = 'Лобби не найдено. Проверьте код.';
            } else if (err.type === 'unavailable-id') {
                message = 'Этот ID уже занят. Попробуйте снова.';
            } else if (err.type === 'network') {
                message = 'Проблема с сетью.';
            }
            if (this.onError) this.onError(message);
        });
        
        this.peer.on('disconnected', () => {
            // Auto-reconnect if disconnected from signaling server
             if (this.peer && !this.peer.destroyed) {
                 this.peer.reconnect();
             }
        });
    }

    connectToHost(code: string) {
        if (!this.peer) return;
        
        console.log(`Connecting to: ${ID_PREFIX}${code}`);
        const conn = this.peer.connect(`${ID_PREFIX}${code}`, {
            reliable: true
        });
        
        conn.on('open', () => {
            console.log('Connected to host!');
            this.setupConnection(conn);
            if (this.onConnect) this.onConnect();
        });

        conn.on('error', (err) => {
             console.error('Connection Error:', err);
             if (this.onError) this.onError('Не удалось подключиться к хосту.');
        });
        
        // Handle immediate close
        conn.on('close', () => {
            if (this.onError) this.onError('Соединение с хостом закрыто.');
        });
    }

    setupConnection(conn: DataConnection) {
        // Close existing connection if any
        if (this.conn && this.conn !== conn) {
            this.conn.close();
        }
        
        this.conn = conn;
        
        this.conn.on('data', (data) => {
            if (this.onData) this.onData(data);
        });

        this.conn.on('close', () => {
            console.log('Connection closed');
            if (this.onError) this.onError('Соединение разорвано');
        });
    }

    send(data: any) {
        if (this.conn && this.conn.open) {
            this.conn.send(data);
        } else {
            console.warn('Cannot send data, connection not open');
        }
    }

    destroy() {
        if (this.conn) {
            this.conn.close();
            this.conn = null;
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.onData = null;
        this.onConnect = null;
        this.onError = null;
        this.onOpen = null;
    }
}

export const network = new NetworkManager();