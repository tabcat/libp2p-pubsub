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
import { type DualKadDHT, kadDHT } from '@libp2p/kad-dht'
import { ipnsSelector } from 'ipns/selector'
import { ipnsValidator } from 'ipns/validator'
import { identifyService } from 'libp2p/identify'
import type { PubSub } from '@libp2p/interface-pubsub'
import type { Libp2pOptions } from 'libp2p'
import { multiaddr } from '@multiformats/multiaddr'
import type { ConnectionGater } from '@libp2p/interface-connection-gater'
import { webRTCStar } from '@libp2p/webrtc-star'

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
  const webRtcStar = webRTCStar()
  return {
    addresses: {
      listen: [
        '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star/'
      ]
    },
    connectionGater: connectionGater(),
    transports: [
      webRtcStar.transport
    ],
    peerDiscovery: [
      webRtcStar.discovery
    ],
    connectionEncryption: [
      noise()
    ],
    streamMuxers: [
      yamux()
    ],
    connectionManager: {
      maxParallelDials: 150, // 150 total parallel multiaddr dials
      dialTimeout: 10e3 // 10 second dial timeout per peer dial
    },
    services: {
      identify: identifyService(),
      pubsub: gossipsub({ emitSelf: true }),
      dht: kadDHT({
        clientMode: false,
        validators: { ipns: ipnsValidator },
        selectors: { ipns: ipnsSelector }
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
