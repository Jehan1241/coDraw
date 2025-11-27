// src/realtime.ts
import { Server } from '@hocuspocus/server';

// Configure the Hocuspocus Server
const server = new Server({
    port: parseInt(process.env.PORT || '1234'),
    address: process.env.HOST || '0.0.0.0',
    name: 'whiteboard-relay',

    // No onAuthenticate needed - it's public.
    // No extensions needed - it's in-memory only.
});

server.listen();
console.log(`Relay server running on 0.0.0.0:1234`);