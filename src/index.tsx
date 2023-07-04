import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { EventHandler } from '@libp2p/interfaces/events';
import { Message } from '@libp2p/interface-pubsub'
import { createLibp2p, type Libp2p } from 'libp2p'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { bootstrap } from '@libp2p/bootstrap'
import { type DualKadDHT, kadDHT } from '@libp2p/kad-dht'
import { mplex } from '@libp2p/mplex'
import { webRTC, webRTCDirect } from '@libp2p/webrtc'
import { webSockets } from '@libp2p/websockets'
import { webTransport } from '@libp2p/webtransport'
import { ipnsSelector } from 'ipns/selector'
import { ipnsValidator } from 'ipns/validator'
import { autoNATService } from 'libp2p/autonat'
import { circuitRelayTransport } from 'libp2p/circuit-relay'
import { identifyService } from 'libp2p/identify'
import type { PubSub } from '@libp2p/interface-pubsub'
import type { Libp2pOptions } from 'libp2p'
import { multiaddr } from '@multiformats/multiaddr'
import { all } from '@libp2p/websockets/filters'
import { peerId } from './relay-peerid.js'
import type { ConnectionGater } from '@libp2p/interface-connection-gater'
import { RPC } from '@chainsafe/libp2p-gossipsub/message'

console.log(RPC)

declare global {
  interface Window {
    libp2p: Libp2p<any>,
    multiaddr: any,
  }
}
window.multiaddr = multiaddr

const topic = 'test'
const decoder = new TextDecoder()

const connectionGater = (): ConnectionGater => {
  return {
    denyDialPeer: async () => false,
    denyDialMultiaddr: async () => false,
    denyInboundConnection: async () => false,
    denyOutboundConnection: async () => false,
    denyInboundEncryptedConnection: async () => false,
    denyOutboundEncryptedConnection: async () => false,
    denyInboundUpgradedConnection: async () => false,
    denyOutboundUpgradedConnection: async () => false,
    filterMultiaddrForPeer: async () => true
  }
}

export function libp2pDefaults (): Libp2pOptions<{ dht: DualKadDHT, pubsub: PubSub, identify: unknown, autoNAT: unknown }> {
  return {
    addresses: {
      listen: [
        '/webrtc'
      ]
    },
    transports: [
      webRTC(),
      webRTCDirect(),
      webTransport(),
      webSockets({ filter: all }),
      circuitRelayTransport({
        discoverRelays: 1
      })
    ],
    connectionGater: connectionGater(),
    connectionEncryption: [
      noise()
    ],
    peerDiscovery: [
      bootstrap({ list: [`/ip4/127.0.0.1/tcp/8001/ws/p2p/${peerId.toString()}`] })
    ],
    streamMuxers: [
      yamux(),
      mplex()
    ],
    services: {
      identify: identifyService(),
      autoNAT: autoNATService(),
      pubsub: gossipsub(),
      dht: kadDHT({
        clientMode: true,
        validators: {
          ipns: ipnsValidator
        },
        selectors: {
          ipns: ipnsSelector
        }
      })
    }
  }
}

async function main (): Promise<void> {
  const libp2p = await createLibp2p(libp2pDefaults())
  window.libp2p = libp2p

  const handler: EventHandler<CustomEvent<Message>> = (event: CustomEvent<Message>): void => {
    if (event.detail.topic === topic) {
      console.log(decoder.decode(event.detail.data))
    }
  }
  libp2p.services.pubsub.addEventListener('message', handler) 
  libp2p.services.pubsub.subscribe(topic)
}

void main();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
