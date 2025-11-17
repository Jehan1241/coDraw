import Fastify from 'fastify';
import { Pool } from 'pg';
import fastifyJwt from '@fastify/jwt';
import bcrypt from 'bcryptjs';
import fastifyCors from '@fastify/cors';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as url from 'url';

const JWT_SECRET = process.env.JWT_SECRET || 'my-super-secret-key-please-change-me';

interface UserPayload {
    id: string;
    email: string;
}

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const verifyJWT = async (request: any, reply: any) => {
    try {
        // This will throw an error if the token is missing or invalid
        await request.jwtVerify();
    } catch (err) {
        reply.send(err);
    }
};

// 1. Create the Fastify Server
const server = Fastify({
    logger: true
});

server.register(fastifyJwt, {
    secret: JWT_SECRET,
});

server.register(fastifyCors, {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
});

// 2. Setup the Database Connection Pool
const pgPool = new Pool({
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'myuser',
    password: process.env.DB_PASSWORD || 'mypassword',
    database: process.env.DB_NAME || 'whiteboard_db',
});

// 3. Define your API routes
server.get('/', async (request, reply) => {
    // We can test that our DB connection works!
    try {
        const { rows } = await pgPool.query('SELECT NOW()');
        return { hello: 'world, this is the API', db_time: rows[0].now };
    } catch (err) {
        server.log.error(err);
        return { hello: 'world', error: 'db connection failed' };
    }
});


server.post('/api/register', async (request, reply) => {
    const { email, password } = request.body as any;

    if (!email || !password) {
        return reply.status(400).send({ error: 'Email and password are required' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);

        const { rows } = await pgPool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            [email, passwordHash]
        );

        return reply.status(201).send(rows[0]);

    } catch (err: any) {
        // 23505 is the error code for "unique constraint violation"
        if (err.code === '23505') {
            return reply.status(409).send({ error: 'Email already exists' });
        }
        server.log.error(err);
        return reply.status(500).send({ error: 'Internal server error' });
    }
});

server.post('/api/login', async (request, reply) => {
    const { email, password } = request.body as any;

    if (!email || !password) {
        return reply.status(400).send({ error: 'Email and password are required' });
    }

    // Find the user
    const { rows } = await pgPool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' });
    }

    // Check the password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
        return reply.status(401).send({ error: 'Invalid credentials' });
    }

    // Success! Create and send a login token (JWT)
    const token = server.jwt.sign({
        id: user.id,
        email: user.email,
    });

    return reply.send({ token });
});


server.after(() => {
    // 4. GET /api/boards: Lists all boards for the user
    server.get('/api/boards', { preHandler: [verifyJWT] }, async (request, reply) => {
        // The user payload is now available in request.user (thanks to jwtVerify)

        const userPayload = request.user as UserPayload;

        if (!userPayload || !userPayload.id) {
            return reply.status(401).send({ error: 'Authentication required.' });
        }
        const userId = userPayload.id;

        const { rows } = await pgPool.query(
            `
            SELECT DISTINCT 
                b.id, 
                b.name, 
                b.owner_id, 
                b.is_public, 
                b.created_at,
                u.email AS owner_email
            FROM boards b
            LEFT JOIN board_permissions bp ON b.id = bp.board_id
            LEFT JOIN users u ON b.owner_id = u.id
            WHERE b.owner_id = $1 OR bp.user_id = $1 OR b.is_public = TRUE
            ORDER BY b.created_at DESC
            `,
            [userId]
        );
        return rows;
    });

    // 5. POST /api/boards: Creates a new board
    server.post('/api/boards', { preHandler: [verifyJWT] }, async (request, reply) => {
        const userPayload = request.user as UserPayload;

        if (!userPayload || !userPayload.id) {
            return reply.status(401).send({ error: 'Authentication required.' });
        }
        const userId = userPayload.id;
        const { name } = request.body as { name: string };
        const boardName = name || `Untitled Board`;

        // 1. Insert the new board (the user is the owner)
        const { rows } = await pgPool.query(
            'INSERT INTO boards (name, owner_id) VALUES ($1, $2) RETURNING id, name, owner_id, is_public',
            [boardName, userId]
        );
        const newBoard = rows[0];

        // 2. Give the owner implicit edit permission (if needed, although owner_id is enough)
        await pgPool.query(
            'INSERT INTO board_permissions (user_id, board_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, newBoard.id]
        );

        return reply.status(201).send(newBoard);
    });

    server.get('/api/boards/:id', async (request, reply) => {

        // 2. FIX: Manually get the userId from the token (if it exists)
        let userId: string | null = null;
        try {
            await request.jwtVerify();
            const userPayload = request.user as UserPayload;
            userId = userPayload.id;
        } catch (err) {
            // No token or invalid token, user is a guest (userId remains null)
        }

        const { id: boardId } = request.params as { id: string };

        // 3. FIX: Use the SAME security query as Hocuspocus
        const { rows, rowCount } = await pgPool.query(
            `
        SELECT b.id, b.name, b.owner_id, b.is_public, b.created_at
        FROM boards b
        LEFT JOIN board_permissions bp ON b.id = bp.board_id
        WHERE b.id = $1 AND (b.owner_id = $2 OR bp.user_id = $2 OR b.is_public = TRUE)
        LIMIT 1
        `,
            [boardId, userId]
        );

        if (rowCount === 0) {
            // This now correctly blocks guests from private boards
            return reply.status(404).send({ error: 'Board not found or access denied' });
        }

        return reply.send(rows[0]);
    });

    //Rename a board
    server.patch('/api/boards/:id', { preHandler: [verifyJWT] }, async (request, reply) => {
        const userPayload = request.user as UserPayload;
        const { id } = request.params as { id: string };
        const { name } = request.body as { name: string };

        if (!name || name.trim() === "") {
            return reply.status(400).send({ error: "Name cannot be empty." });
        }

        // Only the OWNER can rename the board
        const { rows, rowCount } = await pgPool.query(
            'UPDATE boards SET name = $1 WHERE id = $2 AND owner_id = $3 RETURNING id, name',
            [name, id, userPayload.id]
        );

        if (rowCount === 0) {
            return reply.status(403).send({ error: "Board not found or you are not the owner." });
        }

        return reply.send(rows[0]);
    });

    server.patch('/api/boards/:id/share', { preHandler: [verifyJWT] }, async (request, reply) => {
        const userPayload = request.user as UserPayload;
        const { id } = request.params as { id: string };
        const { is_public } = request.body as { is_public: boolean };

        // Query: Only the owner can change the public status
        const { rows, rowCount } = await pgPool.query(
            'UPDATE boards SET is_public = $1 WHERE id = $2 AND owner_id = $3 RETURNING id, is_public, name, owner_id, created_at',
            [is_public, id, userPayload.id]
        );

        if (rowCount === 0) {
            return reply.status(403).send({ error: "Board not found or you are not the owner." });
        }

        return reply.send(rows[0]);
    });

    server.post('/api/boards/:id/invite', { preHandler: [verifyJWT] }, async (request, reply) => {
        const userPayload = request.user as UserPayload;
        const { id: boardId } = request.params as { id: string };
        const { email: emailToInvite } = request.body as { email: string };


        if (!userPayload || !userPayload.id) {
            return reply.status(401).send({ error: 'Authentication required.' });
        }
        const userId = userPayload.id;

        if (!emailToInvite) {
            return reply.status(400).send({ error: "Email is required." });
        }

        // Step 1: Check if the person inviting is the owner
        const ownerCheck = await pgPool.query(
            'SELECT id FROM boards WHERE id = $1 AND owner_id = $2',
            [boardId, userPayload.id]
        );

        if (ownerCheck.rowCount === 0) {
            return reply.status(403).send({ error: "You are not the owner of this board." });
        }

        // Step 2: Find the user we want to invite
        const { rows: userRows, rowCount: userCount } = await pgPool.query(
            'SELECT id FROM users WHERE email = $1',
            [emailToInvite]
        );

        if (userCount === 0) {
            return reply.status(404).send({ error: "User with that email not found." });
        }
        const userToInviteId = userRows[0].id;

        if (userId === userToInviteId) {
            return reply.status(400).send({ error: "You cannot invite yourself to your own board." });
        }

        // Step 3: Add them to the permissions table
        try {
            await pgPool.query(
                'INSERT INTO board_permissions (user_id, board_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [userToInviteId, boardId]
            );
        } catch (err) {
            server.log.error(err);
            return reply.status(500).send({ error: "Failed to add permission." });
        }

        return reply.status(201).send({ message: "User invited successfully." });
    });

    // 6. DELETE /api/boards/:id: Deletes a board
    server.delete('/api/boards/:id', { preHandler: [verifyJWT] }, async (request, reply) => {
        const userPayload = request.user as UserPayload;

        if (!userPayload || !userPayload.id) {
            return reply.status(401).send({ error: 'Authentication required.' });
        }
        const userId = userPayload.id;
        const { id } = request.params as { id: string };

        // Query: Only delete if the user is the board's owner
        const result = await pgPool.query(
            'DELETE FROM boards WHERE id = $1 AND owner_id = $2 RETURNING id',
            [id, userId]
        );

        if (result.rowCount === 0) {
            return reply.status(403).send({ error: "Board not found or you are not the owner." });
        }

        // NOTE: ON DELETE CASCADE on the boards table will automatically delete
        // entries from board_permissions and yjs_docs!

        return reply.status(204).send();
    });
});

// 4. Start the server
const start = async () => {
    try {
        const sqlPath = path.join(__dirname, 'init-db.sql');
        const sqlScript = await fs.readFile(sqlPath, 'utf8');
        await pgPool.query(sqlScript);
        server.log.info('Database schema initialized successfully.');

        await server.listen({ port: 8080, host: '0.0.0.0' });
        console.log(`API server listening on http://localhost:8080`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();