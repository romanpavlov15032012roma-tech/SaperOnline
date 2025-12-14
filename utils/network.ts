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

    initialize(isHost: boolean, code?: string) {
        this.isHost = isHost;
        const myId = isHost && code ? `${ID_PREFIX}${code}` : undefined;

        this.peer = new Peer(myId);

        this.peer.on('open', (id) => {
            console.log('My Peer ID is: ' + id);
            if (!isHost && code) {
                // If guest, connect immediately to host
                this.connectToHost(code);
            }
        });

        this.peer.on('connection', (conn) => {
            if (this.isHost) {
                this.setupConnection(conn);
                if (this.onConnect) this.onConnect();
            } else {
                // Reject connections if we are guest (shouldn't happen)
                conn.close();
            }
        });

        this.peer.on('error', (err) => {
            console.error(err);
            if (this.onError) this.onError('Ошибка соединения. Возможно код неверен.');
        });
    }

    connectToHost(code: string) {
        if (!this.peer) return;
        const conn = this.peer.connect(`${ID_PREFIX}${code}`);
        
        conn.on('open', () => {
            this.setupConnection(conn);
            if (this.onConnect) this.onConnect();
        });

        conn.on('error', (err) => {
             if (this.onError) this.onError('Не удалось подключиться к хосту.');
        });
    }

    setupConnection(conn: DataConnection) {
        this.conn = conn;
        
        this.conn.on('data', (data) => {
            if (this.onData) this.onData(data);
        });

        this.conn.on('close', () => {
            if (this.onError) this.onError('Соединение разорвано');
        });
    }

    send(data: any) {
        if (this.conn && this.conn.open) {
            this.conn.send(data);
        }
    }

    destroy() {
        if (this.conn) this.conn.close();
        if (this.peer) this.peer.destroy();
    }
}

export const network = new NetworkManager();