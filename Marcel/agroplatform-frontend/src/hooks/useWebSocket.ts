// =========================================================
// hooks/useWebSocket.ts — Connexion STOMP centralisée
// =========================================================

import { useEffect, useRef, useCallback } from 'react';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:8086/ws';

// Singleton : une seule connexion WebSocket partagée dans l'app
let stompClient: Client | null = null;
let connectPromise: Promise<Client> | null = null;

function getOrCreateClient(): Promise<Client> {
  if (connectPromise) return connectPromise;

  connectPromise = new Promise((resolve, reject) => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 3000,
      onConnect: () => {
        console.log('[WS] Connecté');
        resolve(client);
      },
      onStompError: (frame) => {
        console.error('[WS] Erreur STOMP', frame);
        reject(new Error(frame.headers['message']));
        connectPromise = null;
      },
      onDisconnect: () => {
        console.log('[WS] Déconnecté');
        connectPromise = null;
        stompClient = null;
      },
    });

    client.activate();
    stompClient = client;
  });

  return connectPromise;
}

interface UseWebSocketOptions<T> {
  topic: string;                         // ex: /topic/conversation.1.2
  onMessage: (data: T) => void;
  enabled?: boolean;                     // activer/désactiver l'abonnement
}

/**
 * S'abonne à un topic STOMP et appelle onMessage à chaque réception.
 * Retourne une fonction publish() pour envoyer des messages.
 */
export function useWebSocket<T>({ topic, onMessage, enabled = true }: UseWebSocketOptions<T>) {
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    getOrCreateClient().then(client => {
      if (cancelled) return;

      subscriptionRef.current = client.subscribe(topic, (msg: IMessage) => {
        try {
          const data: T = JSON.parse(msg.body);
          onMessageRef.current(data);
        } catch (err) {
          console.error('[WS] Erreur parsing message', err);
        }
      });

      console.log('[WS] Abonné à', topic);
    }).catch(err => {
      console.error('[WS] Impossible de s\'abonner à', topic, err);
    });

    return () => {
      cancelled = true;
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [topic, enabled]);

  const publish = useCallback((destination: string, body: unknown) => {
    getOrCreateClient().then(client => {
      client.publish({
        destination,
        body: JSON.stringify(body),
      });
    });
  }, []);

  return { publish };
}
