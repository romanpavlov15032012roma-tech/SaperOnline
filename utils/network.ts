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

    // Helper to ensure clean state
    private async cleanupOldPeer() {
        if (this.conn) {
            this.conn.close();
            this.conn = null;
        }
        if (this.peer) {
            const oldPeer = this.peer;
            this.peer = null;
            oldPeer.destroy();
            // Give a small grace period for the server to register the disconnect
            // This helps with "ID unavailable" errors when quickly re-hosting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    async initialize(isHost: boolean, code?: string) {
        await this.cleanupOldPeer();

        this.isHost = isHost;
        const myId = isHost && code ? `${ID_PREFIX}${code}` : undefined;

        console.log('Initializing Peer...', { isHost, myId });

        this.peer = new Peer(myId, {
            debug: 1, // 0: None, 1: Errors, 2: Warnings, 3: All
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        this.peer.on('open', (id) => {
            console.log('Peer Opened. ID:', id);
            if (this.onOpen) this.onOpen(id);
            
            if (!isHost && code) {
                // If guest, connect immediately to host after we have an ID
                this.connectToHost(code);
            }
        });

        this.peer.on('connection', (conn) => {
            console.log('Incoming connection...');
            if (this.isHost) {
                this.setupConnection(conn);
                if (this.onConnect) this.onConnect();
            } else {
                console.warn('Guest received connection, closing...');
                conn.close();
            }
        });

        this.peer.on('error', (err) => {
            console.error('PeerJS Error:', err);
            let message = `Ошибка: ${err.type}`;
            if (err.type === 'peer-unavailable') {
                message = 'Лобби не найдено. Проверьте код.';
            } else if (err.type === 'unavailable-id') {
                message = 'ID занят. Попробуйте создать лобби снова.';
            } else if (err.type === 'network') {
                message = 'Ошибка сети.';
            } else if (err.type === 'browser-incompatible') {
                message = 'Ваш браузер не поддерживает WebRTC.';
            } else if (err.type === 'socket-error') {
                message = 'Ошибка сокета. Проверьте соединение.';
            }
            if (this.onError) this.onError(message);
        });

        this.peer.on('disconnected', () => {
             console.log('Peer disconnected from server.');
             // Often happens temporarily, PeerJS usually auto-reconnects to signaling server
        });
    }

    connectToHost(code: string) {
        if (!this.peer || this.peer.destroyed) {
            console.error('Cannot connect: Peer not ready');
            return;
        }
        
        const targetId = `${ID_PREFIX}${code}`;
        console.log(`Connecting to host: ${targetId}`);
        
        const conn = this.peer.connect(targetId, {
            reliable: true,
            serialization: 'json'
        });
        
        this.setupConnection(conn);
    }

    setupConnection(conn: DataConnection) {
        if (this.conn) {
            console.log('Closing existing connection before new one');
            this.conn.close();
        }
        
        this.conn = conn;
        
        this.conn.on('open', () => {
            console.log('DataConnection Opened!');
            // For guest, this confirms connection to host
            if (!this.isHost && this.onConnect) {
                this.onConnect();
            }
        });

        this.conn.on('data', (data) => {
            if (this.onData) this.onData(data);
        });

        this.conn.on('close', () => {
            console.log('DataConnection Closed');
            if (this.onError) this.onError('Соединение разорвано');
        });

        this.conn.on('error', (err) => {
            console.error('Connection Error:', err);
            if (this.onError) this.onError('Ошибка соединения');
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