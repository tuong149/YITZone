import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export function createStompClient(accessToken) {
  return new Client({
    webSocketFactory: () => new SockJS("/ws"),
    connectHeaders: accessToken ? { Authorization: `Bearer ${accessToken}` }: {},
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000
  });
}
