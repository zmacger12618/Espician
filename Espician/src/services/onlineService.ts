import { TeamData } from '../types';

export type OnlineMessageListener = (data: any) => void;

class OnlineService {
  private ws: WebSocket | null = null;
  private listeners: Set<OnlineMessageListener> = new Set();
  public isConnected: boolean = false;

  public connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve(true);
        return;
      }

      // Automatically connect to current host LAN IP on port 3001
      const host = window.location.hostname || 'localhost';
      const wsUrl = `ws://${host}:3001`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          console.log('[Online Service] Connected to LAN server:', wsUrl);
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.listeners.forEach((listener) => listener(data));
          } catch (err) {
            console.error('[Online Service] Message error:', err);
          }
        };

        this.ws.onerror = (err) => {
          console.warn('[Online Service] Connection error:', err);
          this.isConnected = false;
          resolve(false);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          console.log('[Online Service] Connection closed');
        };
      } catch (e) {
        this.isConnected = false;
        resolve(false);
      }
    });
  }

  public subscribe(listener: OnlineMessageListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public createRoom(team: TeamData) {
    this.send({ type: 'CREATE_ROOM', team });
  }

  public joinRoom(code: string, team: TeamData) {
    this.send({ type: 'JOIN_ROOM', code, team });
  }

  public startOnlineMatch() {
    this.send({ type: 'START_ONLINE_MATCH' });
  }

  public syncAction(action: any) {
    this.send({ type: 'SYNC_MATCH_ACTION', action });
  }

  private send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn('[Online Service] Cannot send, socket not open');
    }
  }
}

export const onlineService = new OnlineService();
