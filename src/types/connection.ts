export interface ConnectionInfo {
  session_id: string;
  ip_address: string;
  port: string;
}

export interface ConnectionState {
  isConnected: boolean;
  role: "sender" | "receiver";
  count: number;
  connectionInfo: ConnectionInfo;
}