import cors from 'cors';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    const isProd = process.env.NODE_ENV === 'production';

    // In development: allow any localhost port for convenience
    const isLocalhost = !isProd && /^http:\/\/localhost:\d+$/.test(origin);
    // Always allow the explicitly configured deployed frontend URL
    const isAllowed = isLocalhost || origin === process.env.CLIENT_URL;

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
});
