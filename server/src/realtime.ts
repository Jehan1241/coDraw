import { Server, type fetchPayload, type onAuthenticatePayload, type storePayload } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const pgPool = new Pool({
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'myuser',
    password: process.env.DB_PASSWORD || 'mypassword',
    database: process.env.DB_NAME || 'whiteboard_db',
});

const JWT_SECRET = process.env.JWT_SECRET || 'my-super-secret-key-please-change-me';

const checkBoardAccess = async (boardId: string, userId: string | null) => {
    // 1. GUEST ACCESS CHECK (userId is NULL)
    if (userId === null) {
        // GUESTS ONLY have access if the board is explicitly public.
        const { rowCount } = await pgPool.query(
            'SELECT id FROM boards WHERE id = $1 AND is_public = TRUE',
            [boardId]
        );
        // Returns TRUE only if board is public (rowCount > 0).
        return rowCount !== null && rowCount > 0;
    }

    // 2. LOGGED-IN USER ACCESS CHECK (userId is UUID)
    // Checks if the user is the owner, is explicitly invited, OR the board is public.
    const { rowCount } = await pgPool.query(
        `
        SELECT 1
        FROM boards b
        LEFT JOIN board_permissions bp ON b.id = bp.board_id
        WHERE b.id = $1 AND (
            b.owner_id = $2
            OR bp.user_id = $2
            OR b.is_public = TRUE
        )
        LIMIT 1
        `,
        [boardId, userId]
    );

    return rowCount !== null && rowCount > 0;
};


// Hocuspocus server config
const server = new Server({
    port: parseInt(process.env.PORT || '1234'),
    address: process.env.HOST || '0.0.0.0',


    async onAuthenticate(data: onAuthenticatePayload) {
        const { token } = data;
        const boardId = data.documentName;

        // --- 1. NEW: GUEST BOARD CHECK ---
        // If the boardId starts with 'guest-', it's a temporary,
        // in-memory-only board. We always allow access.
        // The Database extension will still block persistence.
        if (boardId.startsWith('guest-')) {
            return {
                user: { id: null, isGuest: true },
            };
        }

        // --- 2. REAL BOARD: AUTHENTICATE USER ---
        // This is not a guest board, so we MUST check permissions.
        let userId: string | null = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as { id: string, email: string };
                userId = decoded.id;
            } catch (err) {
                userId = null; // Token is invalid, treat as guest
            }
        }

        // --- 3. REAL BOARD: AUTHORIZATION CHECK ---
        const hasAccess = await checkBoardAccess(boardId, userId);

        if (!hasAccess) {
            // This will now correctly block guests from private boards
            // AND logged-in users who don't have permission.
            throw new Error('Not authorized to access this document.');
        }

        // --- 4. SUCCESS: User has access to a real board ---
        return {
            user: {
                id: userId,
                isGuest: userId === null, // Will be true if they are a guest on a *public* board
            },
        };
    },
    extensions: [
        new Database({
            fetch: async ({ documentName, context }: fetchPayload) => {

                if (!context.user?.id) {
                    return null; // Guest user, don't fetch anything
                }

                const { rows } = await pgPool.query(
                    'SELECT data FROM yjs_docs WHERE name = $1',
                    [documentName]
                );
                return rows[0]?.data || null;
            },
            store: async ({ documentName, state, context }: storePayload) => {

                if (!context.user?.id) {
                    return; // Guest user, do not save
                }

                await pgPool.query(
                    'INSERT INTO yjs_docs (name, data) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET data = $2',
                    [documentName, state]
                );
            },
        }),
    ],
});

server.listen();
console.log(`Hocuspocus real-time server running on 0.0.0.0:1234`);