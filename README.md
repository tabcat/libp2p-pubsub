# libp2p-pubsub

> testing out libp2p pubsub in the browser

## Structure

built using create-react-app

edited/added app files:

- relay.js
- src/index.tsx
- src/relay-peerid.js

## Topology

circuit-relayv2 node connecting browser clients

## Usage

1) start relay server

```bash
# shell 1
$ npm run relay
```

2) start dev server

```bash
# shell 2
$ npm run start
```

## Observed vs Expected Behavior

clients do not discover eachother
unable to add pubsub peers to mesh, even after manually connecting clients using relay multiaddrs
