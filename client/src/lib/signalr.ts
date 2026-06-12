import * as signalR from "@microsoft/signalr";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("phitdev_token") || sessionStorage.getItem("phitdev_token");
}

let connection: signalR.HubConnection | null = null;

export function getAppointmentChatConnection(): signalR.HubConnection {
  if (connection) return connection;

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_URL}/hubs/appointment-chat`, {
      accessTokenFactory: () => getToken() || "",
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  connection.onclose(() => {
    connection = null;
  });

  return connection;
}

export async function startConnection(): Promise<signalR.HubConnection> {
  const conn = getAppointmentChatConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    await conn.start();
  }
  return conn;
}

export async function stopConnection(): Promise<void> {
  if (connection && connection.state !== signalR.HubConnectionState.Disconnected) {
    await connection.stop();
    connection = null;
  }
}
