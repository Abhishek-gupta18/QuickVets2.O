import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db, testConnection, closePool, isDatabaseAvailable } from './src/server/db.js';
import {
  vetClinics, users, pets, favoriteClinics,
  clinicReviews, bookings, emergencyRequests,
} from './src/server/schema.js';
import { signToken } from './src/server/jwt.js';
import { authenticateToken, optionalAuthenticateToken, requireRole } from './src/server/middleware.js';
import { getAdminAnalytics, getUserAnalytics, getVetAnalytics } from './src/server/analytics.js';
import {
  uploadDocument,
  deleteDocument,
  generateSignedUrl,
  validateFile,
  isCloudinaryConfigured,
} from './src/server/cloudinary.js';

// ──────────────────────────────────────────────
// Multer: memory storage, 10 MB limit
// ──────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB hard limit at transport layer
});

const app = express();
const PORT = 3000;

app.use(express.json());

// CORS: Allow frontend (Vercel) to call backend (Render)
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL, // Set this to your Vercel URL in production
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Same-origin requests (no Origin header) — allow
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Ensure all API routes return JSON content-type (prevent Vite SPA fallback confusion)
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Database availability gate: return proper JSON error if DB is down
// Skip for /api/health which is a diagnostic endpoint
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (!isDatabaseAvailable) {
    return res.status(503).json({
      error: 'Database is currently unavailable. Please ensure DATABASE_URL is configured and the database is running.',
      hint: 'Check server logs for connection details.'
    });
  }
  next();
});

// --- Utility Helpers ---
function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('FATAL: JWT_SECRET not configured.');
  return secret;
}

function getSessionExpiryForRole(role: string): number | undefined {
  if (role === 'pet_owner') {
    return 30 * 60;
  }

  return undefined;
}

function getISTTime(): string {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
  });
}

function getISTDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getFrontendUrl(req?: express.Request): string {
  return (process.env.FRONTEND_URL || (req ? `${req.protocol}://${req.get('host')}` : '') || '').replace(/\/$/, '');
}

function getBackendUrl(req?: express.Request): string {
  return (process.env.BACKEND_URL || (req ? `${req.protocol}://${req.get('host')}` : '') || '').replace(/\/$/, '');
}

function getGoogleOAuthRedirectUri(req: express.Request): string {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI || `${getBackendUrl(req)}/api/auth/google/callback`;
}

function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, entry) => {
    const separatorIndex = entry.indexOf('=');
    if (separatorIndex === -1) return acc;
    const key = entry.slice(0, separatorIndex).trim();
    const value = entry.slice(separatorIndex + 1).trim();
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {} as Record<string, string>);
}

function setGoogleOAuthCookie(res: express.Response, value: string) {
  const cookieParts = [
    `quickvet_google_oauth=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=600',
  ];

  if (process.env.NODE_ENV === 'production') {
    cookieParts.push('Secure');
  }

  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

function clearGoogleOAuthCookie(res: express.Response) {
  res.setHeader('Set-Cookie', 'quickvet_google_oauth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
}

function buildAuthRedirectUrl(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl || '/');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

function getDashboardForRole(role: string): string {
  if (role === 'admin') return 'admin_dashboard';
  if (role === 'veterinarian') return 'vet_dashboard';
  return 'user_dashboard';
}

async function fetchGoogleProfile(code: string, redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth is not configured.');
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    throw new Error('Failed to exchange Google authorization code.');
  }

  const tokenData = await tokenRes.json() as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error('Google access token missing from response.');
  }

  const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!profileRes.ok) {
    throw new Error('Failed to read Google profile information.');
  }

  const profile = await profileRes.json() as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };

  if (!profile.email || !profile.email_verified) {
    throw new Error('Google account email is not verified.');
  }

  return profile;
}

async function upsertGoogleUser(profile: { email: string; name?: string; picture?: string }, requestedRole: string) {
  const normalizedEmail = normalizeEmail(profile.email);
  const [existingUser] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

  if (existingUser) {
    const updates: Record<string, string> = {};
    if (!existingUser.avatarUrl && profile.picture) {
      updates.avatarUrl = profile.picture;
    }
    if (!existingUser.name && profile.name) {
      updates.name = profile.name;
    }

    if (Object.keys(updates).length > 0) {
      await db.update(users).set(updates).where(eq(users.id, existingUser.id));
    }

    return existingUser;
  }

  const id = `google-${crypto.randomBytes(8).toString('hex')}`;
  const avatarUrl = profile.picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(profile.name || normalizedEmail)}`;
  const passwordHash = `google-oauth:${crypto.randomBytes(32).toString('hex')}`;

  const [newUser] = await db.insert(users).values({
    id,
    email: normalizedEmail,
    passwordHash,
    name: profile.name || normalizedEmail.split('@')[0] || 'QuickVet User',
    role: requestedRole === 'veterinarian' ? 'veterinarian' : 'pet_owner',
    phone: '',
    avatarUrl,
    clinicId: null,
  }).returning();

  return newUser;
}


// ========================
// HEALTH CHECK (bypasses DB gate)
// ========================
app.get('/api/health', (req, res) => {
  res.json({
    status: isDatabaseAvailable ? 'healthy' : 'degraded',
    database: isDatabaseAvailable ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? '✅ configured' : '❌ missing',
      JWT_SECRET: process.env.JWT_SECRET ? '✅ configured' : '❌ missing',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✅ configured' : '❌ missing',
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? '✅ configured' : '❌ missing',
    }
  });
});


// ========================
// PUBLIC API ROUTES
// ========================

// AUTH: Google OAuth start
app.get('/api/auth/google/start', async (req, res) => {
  try {
    const intent = req.query.intent === 'signup' ? 'signup' : 'login';
    const role = req.query.role === 'veterinarian' ? 'veterinarian' : 'pet_owner';
    const state = crypto.randomBytes(16).toString('hex');
    const payload = JSON.stringify({ state, intent, role });

    setGoogleOAuthCookie(res, payload);

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).send('Google OAuth is not configured on the server.');
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', getGoogleOAuthRedirectUri(req));
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('prompt', 'select_account');
    authUrl.searchParams.set('include_granted_scopes', 'true');

    return res.redirect(authUrl.toString());
  } catch (err) {
    console.error('Google OAuth start error:', err);
    return res.status(500).send('Unable to start Google OAuth.');
  }
});

// AUTH: Google OAuth callback
app.get('/api/auth/google/callback', async (req, res) => {
  const frontendUrl = getFrontendUrl(req) || '/';
  const redirectWithError = (message: string) => {
    res.redirect(buildAuthRedirectUrl(frontendUrl, { oauth_error: message }));
  };

  try {
    const { code, state, error } = req.query as Record<string, string | undefined>;
    if (error) {
      clearGoogleOAuthCookie(res);
      return redirectWithError(error);
    }

    if (!code || !state) {
      clearGoogleOAuthCookie(res);
      return redirectWithError('missing_code');
    }

    const cookies = parseCookieHeader(req.headers.cookie);
    const oauthCookie = cookies.quickvet_google_oauth;
    if (!oauthCookie) {
      clearGoogleOAuthCookie(res);
      return redirectWithError('missing_state');
    }

    const parsedCookie = JSON.parse(oauthCookie) as { state?: string; intent?: string; role?: string };
    if (!parsedCookie.state || parsedCookie.state !== state) {
      clearGoogleOAuthCookie(res);
      return redirectWithError('state_mismatch');
    }

    const profile = await fetchGoogleProfile(code, getGoogleOAuthRedirectUri(req));
    const user = await upsertGoogleUser(profile, parsedCookie.role || 'pet_owner');
    const userResponse = await buildUserResponse(user.id);

    if (!userResponse) {
      clearGoogleOAuthCookie(res);
      return redirectWithError('user_not_found');
    }

    const token = signToken(
      { id: userResponse.id, email: userResponse.email, role: userResponse.role, clinicId: userResponse.clinicId || undefined },
      getJwtSecret(),
      getSessionExpiryForRole(userResponse.role)
    );

    clearGoogleOAuthCookie(res);
    return res.redirect(buildAuthRedirectUrl(frontendUrl, {
      oauth_token: token,
      oauth_provider: 'google',
      dashboard: getDashboardForRole(userResponse.role),
    }));
  } catch (err) {
    clearGoogleOAuthCookie(res);
    console.error('Google OAuth callback error:', err);
    return redirectWithError('oauth_failed');
  }
});

// AUTH: Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, name, password, role, phone } = req.body;
    if (!email || !name || !password || !role) {
      return res.status(400).json({ error: 'Missing required signup parameters.' });
    }
    if (!['pet_owner', 'veterinarian'].includes(role)) {
      return res.status(400).json({ error: 'Unsupported signup role.' });
    }
    const normalizedEmail = normalizeEmail(email);
    const existing = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered. Please login.' });
    }

    const id = `user-${Date.now()}`;
    const passwordHash = await bcrypt.hash(password, 10);
    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;

    const [newUser] = await db.insert(users).values({
      id, email: normalizedEmail, passwordHash, name, role,
      phone: phone || '', avatarUrl,
      clinicId: null,
    }).returning();

    const token = signToken(
      { id: newUser.id, email: normalizedEmail, role: newUser.role, clinicId: newUser.clinicId || undefined },
      getJwtSecret(),
      getSessionExpiryForRole(newUser.role)
    );

    // Build user response (exclude passwordHash)
    const userResponse = await buildUserResponse(newUser.id);
    res.status(201).json({ user: userResponse, token });
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error during signup.' });
  }
});


// AUTH: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(
      { id: user.id, email: normalizedEmail, role: user.role, clinicId: user.clinicId || undefined },
      getJwtSecret(),
      getSessionExpiryForRole(user.role)
    );

    const userResponse = await buildUserResponse(user.id);
    res.json({ user: userResponse, token });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// AUTH: Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (!user) {
      return res.status(404).json({ error: 'User does not exist with that email address.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.id));
    res.json({ message: 'Password updated successfully.' });
  } catch (err: any) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// AUTH: Google OAuth - Sign in or Sign up with Google ID Token
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential, role, isSignup } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential token is required.' });
    }

    // Verify the Google ID token using Google's tokeninfo endpoint
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!googleRes.ok) {
      return res.status(401).json({ error: 'Invalid Google credential. Please try again.' });
    }
    const googlePayload = await googleRes.json() as {
      sub: string;
      email: string;
      email_verified: string;
      name: string;
      picture: string;
      aud: string;
    };

    // Verify the audience (client ID) matches our app
    const expectedClientId = process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && googlePayload.aud !== expectedClientId) {
      return res.status(401).json({ error: 'Google token audience mismatch. Invalid client.' });
    }

    if (googlePayload.email_verified !== 'true') {
      return res.status(401).json({ error: 'Google email is not verified.' });
    }

    const normalizedEmail = normalizeEmail(googlePayload.email);
    const googleName = googlePayload.name || normalizedEmail.split('@')[0];
    const googleAvatar = googlePayload.picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(googleName)}`;

    // Only honour role for brand-new signups — logins always use stored DB role
    const requestedRole = (isSignup && role && ['pet_owner', 'veterinarian'].includes(role)) ? role : 'pet_owner';

    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

    if (existingUser) {
      // IMPORTANT: On login, ALWAYS use the user's stored role — never overwrite it.
      // Role changes must go through a dedicated settings flow, not the login flow.
      const effectiveRole = existingUser.role;

      // Existing user — log them in with their stored role
      const token = signToken(
        { id: existingUser.id, email: normalizedEmail, role: effectiveRole, clinicId: existingUser.clinicId || undefined },
        getJwtSecret(),
        getSessionExpiryForRole(effectiveRole)
      );
      const userResponse = await buildUserResponse(existingUser.id);
      return res.json({ user: userResponse, token });
    }

    // New user — create account with role from signup form (defaults to pet_owner)
    const userRole = requestedRole;
    const id = `user-${Date.now()}`;
    // Generate a random password hash (user won't use password login via Google)
    const randomPassword = `google_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const [newUser] = await db.insert(users).values({
      id,
      email: normalizedEmail,
      passwordHash,
      name: googleName,
      role: userRole,
      phone: '',
      avatarUrl: googleAvatar,
      clinicId: null,
    }).returning();

    const token = signToken(
      { id: newUser.id, email: normalizedEmail, role: newUser.role, clinicId: newUser.clinicId || undefined },
      getJwtSecret(),
      getSessionExpiryForRole(newUser.role)
    );

    const userResponse = await buildUserResponse(newUser.id);
    res.status(201).json({ user: userResponse, token });
  } catch (err: any) {
    console.error('Google OAuth error:', err);
    res.status(500).json({ error: 'Internal server error during Google authentication.' });
  }
});


// CLINICS: Public read
app.get('/api/clinics', async (_req, res) => {
  try {
    const allClinics = await db.select().from(vetClinics);
    // Map to frontend-compatible format
    const mapped = allClinics.map(c => ({
      id: c.id, name: c.name, description: c.description,
      address: c.address, area: c.area, city: c.city,
      latitude: c.latitude, longitude: c.longitude,
      phone: c.phone, rating: parseFloat(c.rating || '0'),
      reviewsCount: c.reviewsCount || 0, imageUrl: c.imageUrl,
      specialists: c.specialists, hasEmergency: c.hasEmergency,
      hasHomeVisit: c.hasHomeVisit, isOpenNow: c.isOpenNow,
      workingHours: c.workingHours, services: c.services,
      verificationDocuments: c.verificationDocuments || [],
      verificationStatus: c.verificationStatus || 'approved',
      licenseNumber: c.licenseNumber || '',
      veterinarianName: c.veterinarianName || '',
      yearsOfExperience: c.yearsOfExperience || '',
    }));
    res.json(mapped);
  } catch (err: any) {
    console.error('Get clinics error:', err);
    res.status(500).json({ error: 'Failed to fetch clinics.' });
  }
});

// REVIEWS: Public read
app.get('/api/clinics/:id/reviews', async (req, res) => {
  try {
    const reviews = await db.select().from(clinicReviews)
      .where(eq(clinicReviews.clinicId, req.params.id))
      .orderBy(desc(clinicReviews.createdAt));
    const mapped = reviews.map(r => ({
      id: r.id, clinicId: r.clinicId, userName: r.userName,
      userEmail: r.userEmail, petType: r.petType,
      rating: r.rating, reviewText: r.reviewText,
      date: r.createdAt ? r.createdAt.toISOString().split('T')[0] : getISTDate(),
    }));
    res.json(mapped);
  } catch (err: any) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});


// REVIEWS: Get all reviews (global feed) with clinic metadata
app.get('/api/reviews', async (req, res) => {
  try {
    const limitVal = parseInt(req.query.limit as string) || 100;
    const offsetVal = parseInt(req.query.offset as string) || 0;
    const petType = req.query.petType as string;
    const rating = req.query.rating as string;

    const conditions = [];
    if (petType && petType !== 'All') {
      conditions.push(eq(clinicReviews.petType, petType));
    }
    if (rating && rating !== 'All') {
      conditions.push(eq(clinicReviews.rating, parseInt(rating)));
    }

    let queryBuilder = db.select({
      id: clinicReviews.id,
      clinicId: clinicReviews.clinicId,
      userName: clinicReviews.userName,
      userEmail: clinicReviews.userEmail,
      petType: clinicReviews.petType,
      rating: clinicReviews.rating,
      reviewText: clinicReviews.reviewText,
      createdAt: clinicReviews.createdAt,
      clinicName: vetClinics.name,
      clinicArea: vetClinics.area,
      clinicCity: vetClinics.city,
      clinicImageUrl: vetClinics.imageUrl,
      veterinarianName: vetClinics.veterinarianName,
    })
    .from(clinicReviews)
    .leftJoin(vetClinics, eq(clinicReviews.clinicId, vetClinics.id));

    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions)) as any;
    }

    const reviews = await queryBuilder
      .orderBy(desc(clinicReviews.createdAt))
      .limit(limitVal)
      .offset(offsetVal);

    const mapped = reviews.map(r => ({
      id: r.id,
      clinicId: r.clinicId,
      userName: r.userName,
      userEmail: r.userEmail,
      petType: r.petType,
      rating: r.rating,
      reviewText: r.reviewText,
      date: r.createdAt ? r.createdAt.toISOString().split('T')[0] : getISTDate(),
      clinicName: r.clinicName || 'Unknown Clinic',
      clinicArea: r.clinicArea || '',
      clinicCity: r.clinicCity || '',
      clinicImageUrl: r.clinicImageUrl || '',
      veterinarianName: r.veterinarianName || '',
    }));
    
    res.json(mapped);
  } catch (err: any) {
    console.error('Get global reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});


// ========================
// PROTECTED API ROUTES (JWT required)
// ========================

// CLINICS: Create (authenticated)
app.post('/api/clinics', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      name, description, address, area, city, latitude, longitude, phone,
      specialists, hasEmergency, hasHomeVisit, workingHours, services, imageUrl,
      verificationDocuments, licenseNumber, veterinarianName, yearsOfExperience,
    } = req.body;
    if (!name || !address || !area || !phone) {
      return res.status(400).json({ error: 'Missing key details (Name, Address, Area, Phone).' });
    }
    if (!['veterinarian', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only veterinarians can submit professional verification profiles.' });
    }

    const id = `clinic-${Date.now()}`;
    const [newClinic] = await db.insert(vetClinics).values({
      id, name,
      description: description || 'Professional veterinary clinic.',
      address, area, city: city || 'Bengaluru',
      latitude: parseFloat(latitude) || 12.9716,
      longitude: parseFloat(longitude) || 77.5946,
      phone, rating: '5.00', reviewsCount: 0,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=600',
      specialists: specialists || ['Dog', 'Cat'],
      hasEmergency: hasEmergency || false,
      hasHomeVisit: hasHomeVisit || false,
      isOpenNow: true,
      workingHours: workingHours || '9:00 AM - 8:00 PM',
      services: services || ['General Consultations', 'Vaccination', 'Pharmacy'],
      // Strip any base64 dataUrl fields — only Cloudinary metadata is stored in DB
      verificationDocuments: Array.isArray(verificationDocuments)
        ? verificationDocuments.map(({ dataUrl: _omit, ...rest }: any) => rest)
        : [],
      verificationStatus: 'pending',
      licenseNumber: licenseNumber || '',
      veterinarianName: veterinarianName || '',
      yearsOfExperience: yearsOfExperience || '',
    }).returning();

    if (req.user.role === 'veterinarian') {
      await db.update(users).set({ clinicId: newClinic.id }).where(eq(users.id, req.user.id));
    }

    res.status(201).json({
      ...newClinic,
      rating: parseFloat(newClinic.rating || '5'),
      reviewsCount: newClinic.reviewsCount || 0,
      verificationDocuments: newClinic.verificationDocuments || [],
      verificationStatus: newClinic.verificationStatus || 'pending',
      licenseNumber: newClinic.licenseNumber || '',
      veterinarianName: newClinic.veterinarianName || '',
      yearsOfExperience: newClinic.yearsOfExperience || '',
    });
  } catch (err: any) {
    console.error('Create clinic error:', err);
    res.status(500).json({ error: 'Failed to create clinic.' });
  }
});

// CLINICS: Update verification status (admin only)
app.post('/api/clinics/:id/verification', authenticateToken, requireRole('admin'), async (req: any, res: any) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'approved', 'rejected', 'needs_documents', 'hold', 'suspended'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Unsupported verification status.' });
    }

    const [updated] = await db.update(vetClinics)
      .set({ verificationStatus: status })
      .where(eq(vetClinics.id, req.params.id))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Clinic verification profile not found.' });

    res.json({
      ...updated,
      rating: parseFloat(updated.rating || '0'),
      reviewsCount: updated.reviewsCount || 0,
      verificationDocuments: updated.verificationDocuments || [],
      verificationStatus: updated.verificationStatus || status,
      licenseNumber: updated.licenseNumber || '',
      veterinarianName: updated.veterinarianName || '',
      yearsOfExperience: updated.yearsOfExperience || '',
    });
  } catch (err: any) {
    console.error('Update clinic verification error:', err);
    res.status(500).json({ error: 'Failed to update verification status.' });
  }
});


// REVIEWS: Create (authenticated)
app.post('/api/clinics/:id/reviews', authenticateToken, async (req: any, res: any) => {
  try {
    const { rating, reviewText, petType } = req.body;
    const clinicId = req.params.id;
    if (!rating || !reviewText) {
      return res.status(400).json({ error: 'Rating and review comment are required.' });
    }

    const [reviewer] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    const id = `rev-${Date.now()}`;

    await db.insert(clinicReviews).values({
      id, clinicId,
      userName: reviewer?.name || 'Anonymous',
      userEmail: req.user.email,
      petType: petType || 'Pet',
      rating: parseInt(rating),
      reviewText,
    });

    // Recalculate average rating
    const allReviews = await db.select().from(clinicReviews).where(eq(clinicReviews.clinicId, clinicId));
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = (sum / allReviews.length).toFixed(2);

    await db.update(vetClinics).set({
      rating: avg, reviewsCount: allReviews.length,
    }).where(eq(vetClinics.id, clinicId));

    res.status(201).json({
      id, clinicId, userName: reviewer?.name || 'Anonymous',
      userEmail: req.user.email, petType: petType || 'Pet',
      rating: parseInt(rating), reviewText, date: getISTDate(),
    });
  } catch (err: any) {
    console.error('Create review error:', err);
    res.status(500).json({ error: 'Failed to publish review.' });
  }
});


// BOOKINGS: Get (tenant-isolated)
app.get('/api/bookings', authenticateToken, async (req: any, res: any) => {
  try {
    let results;
    if (req.user.role === 'admin') {
      results = await db.select().from(bookings)
        .orderBy(desc(bookings.createdAt));
    } else if (req.user.role === 'veterinarian') {
      results = await db.select().from(bookings)
        .where(eq(bookings.clinicId, req.user.clinicId || ''))
        .orderBy(desc(bookings.createdAt));
    } else {
      results = await db.select().from(bookings)
        .where(eq(bookings.petOwnerEmail, req.user.email))
        .orderBy(desc(bookings.createdAt));
    }

    const mapped = results.map(b => ({
      id: b.id, clinicId: b.clinicId, clinicName: b.clinicName,
      petOwnerName: b.petOwnerName, petOwnerEmail: b.petOwnerEmail,
      petName: b.petName, petType: b.petType, service: b.service,
      date: b.bookingDate, time: b.bookingTime, status: b.status,
      notes: b.notes, type: b.bookingType,
      createdAt: b.createdAt?.toISOString() || new Date().toISOString(),
    }));
    res.json(mapped);
  } catch (err: any) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});

// BOOKINGS: Create (authenticated)
app.post('/api/bookings', authenticateToken, async (req: any, res: any) => {
  try {
    const { clinicId, clinicName, petName, petType, service, date, time, type, notes } = req.body;
    if (!clinicId || !petName || !date || !time) {
      return res.status(400).json({ error: 'Missing essential booking fields.' });
    }

    const [owner] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    const id = `booking-${Date.now()}`;

    const [newBooking] = await db.insert(bookings).values({
      id, clinicId, clinicName: clinicName || 'Veterinary Clinic',
      petOwnerId: req.user.id,
      petOwnerName: owner?.name || 'Pet Parent',
      petOwnerEmail: req.user.email,
      petName, petType: petType || 'Dog',
      service: service || 'General Consultation',
      bookingDate: date, bookingTime: time,
      status: 'pending', notes: notes || '',
      bookingType: type || 'clinic_visit',
    }).returning();

    res.status(201).json({
      id: newBooking.id, clinicId: newBooking.clinicId, clinicName: newBooking.clinicName,
      petOwnerName: newBooking.petOwnerName, petOwnerEmail: newBooking.petOwnerEmail,
      petName: newBooking.petName, petType: newBooking.petType, service: newBooking.service,
      date: newBooking.bookingDate, time: newBooking.bookingTime, status: newBooking.status,
      notes: newBooking.notes, type: newBooking.bookingType,
      createdAt: newBooking.createdAt?.toISOString() || new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Failed to create booking.' });
  }
});


// BOOKINGS: Update status (vet only, clinic-scoped)
app.post('/api/bookings/:id/status', authenticateToken, requireRole('veterinarian'), async (req: any, res: any) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.clinicId !== req.user.clinicId) {
      return res.status(403).json({ error: 'You can only manage bookings for your own clinic.' });
    }

    const [updated] = await db.update(bookings).set({ status }).where(eq(bookings.id, id)).returning();
    res.json({
      id: updated.id, clinicId: updated.clinicId, clinicName: updated.clinicName,
      petOwnerName: updated.petOwnerName, petOwnerEmail: updated.petOwnerEmail,
      petName: updated.petName, petType: updated.petType, service: updated.service,
      date: updated.bookingDate, time: updated.bookingTime, status: updated.status,
      notes: updated.notes, type: updated.bookingType,
      createdAt: updated.createdAt?.toISOString() || '',
    });
  } catch (err: any) {
    console.error('Update booking status error:', err);
    res.status(500).json({ error: 'Failed to update booking.' });
  }
});


// EMERGENCY: Get (tenant-isolated)
app.get('/api/emergency', authenticateToken, async (req: any, res: any) => {
  try {
    let results;
    if (req.user.role === 'admin' || req.user.role === 'veterinarian') {
      results = await db.select().from(emergencyRequests).orderBy(desc(emergencyRequests.createdAt));
    } else {
      results = await db.select().from(emergencyRequests)
        .where(eq(emergencyRequests.petOwnerEmail, req.user.email))
        .orderBy(desc(emergencyRequests.createdAt));
    }

    const mapped = results.map(e => ({
      id: e.id, petOwnerName: e.petOwnerName, petOwnerEmail: e.petOwnerEmail,
      petName: e.petName, petType: e.petType, phone: e.phone,
      address: e.address, description: e.description,
      latitude: e.latitude, longitude: e.longitude, status: e.status,
      acceptedByClinicId: e.acceptedByClinicId,
      acceptedByClinicName: e.acceptedByClinicName,
      date: e.requestDate, time: e.requestTime,
      createdAt: e.createdAt?.toISOString() || new Date().toISOString(),
    }));
    res.json(mapped);
  } catch (err: any) {
    console.error('Get emergencies error:', err);
    res.status(500).json({ error: 'Failed to fetch emergencies.' });
  }
});

// EMERGENCY: Create (works for guests and authenticated users)
app.post('/api/emergency', optionalAuthenticateToken, async (req: any, res: any) => {
  try {
    const { petName, petType, phone, address, description, latitude, longitude, petOwnerName, petOwnerEmail } = req.body;
    if (!phone || !address || !description) {
      return res.status(400).json({ error: 'Emergency needs phone, address, and description.' });
    }

    const requesterId = req.user?.id || null;
    const requesterEmail = typeof petOwnerEmail === 'string' && petOwnerEmail.trim()
      ? petOwnerEmail.trim()
      : req.user?.email || `guest-emergency-${Date.now()}@quickvet.in`;
    const requesterName = typeof petOwnerName === 'string' && petOwnerName.trim()
      ? petOwnerName.trim()
      : req.user?.name || 'Emergency Guest User';

    let owner: any = null;
    if (requesterId) {
      [owner] = await db.select().from(users).where(eq(users.id, requesterId)).limit(1);
    }

    const id = `emergency-${Date.now()}`;
    const [newEmergency] = await db.insert(emergencyRequests).values({
      id,
      petOwnerId: requesterId,
      petOwnerName: owner?.name || requesterName,
      petOwnerEmail: requesterEmail,
      petName: petName || 'Unknown Pet',
      petType: petType || 'Dog',
      phone,
      address,
      description,
      latitude: parseFloat(latitude) || 12.9716,
      longitude: parseFloat(longitude) || 77.5946,
      status: requesterId ? 'pending' : 'notified',
      requestDate: getISTDate(),
      requestTime: getISTTime(),
    }).returning();

    res.status(201).json({
      id: newEmergency.id, petOwnerName: newEmergency.petOwnerName,
      petOwnerEmail: newEmergency.petOwnerEmail,
      petName: newEmergency.petName, petType: newEmergency.petType,
      phone: newEmergency.phone, address: newEmergency.address,
      description: newEmergency.description,
      latitude: newEmergency.latitude, longitude: newEmergency.longitude,
      status: newEmergency.status,
      acceptedByClinicId: newEmergency.acceptedByClinicId,
      acceptedByClinicName: newEmergency.acceptedByClinicName,
      date: newEmergency.requestDate, time: newEmergency.requestTime,
      createdAt: newEmergency.createdAt?.toISOString() || new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Create emergency error:', err);
    res.status(500).json({ error: 'Failed to create emergency request.' });
  }
});


// EMERGENCY: Update status (vet only)
app.post('/api/emergency/:id/status', authenticateToken, requireRole('veterinarian'), async (req: any, res: any) => {
  try {
    const { status, clinicId, clinicName } = req.body;
    const { id } = req.params;

    const [emergency] = await db.select().from(emergencyRequests).where(eq(emergencyRequests.id, id)).limit(1);
    if (!emergency) return res.status(404).json({ error: 'Emergency not found.' });

    const updateData: any = { status };
    if (clinicId) updateData.acceptedByClinicId = clinicId;
    if (clinicName) updateData.acceptedByClinicName = clinicName;

    const [updated] = await db.update(emergencyRequests).set(updateData).where(eq(emergencyRequests.id, id)).returning();
    res.json({
      id: updated.id, petOwnerName: updated.petOwnerName,
      petOwnerEmail: updated.petOwnerEmail,
      petName: updated.petName, petType: updated.petType,
      phone: updated.phone, address: updated.address,
      description: updated.description,
      latitude: updated.latitude, longitude: updated.longitude,
      status: updated.status,
      acceptedByClinicId: updated.acceptedByClinicId,
      acceptedByClinicName: updated.acceptedByClinicName,
      date: updated.requestDate, time: updated.requestTime,
      createdAt: updated.createdAt?.toISOString() || '',
    });
  } catch (err: any) {
    console.error('Update emergency error:', err);
    res.status(500).json({ error: 'Failed to update emergency.' });
  }
});


// USER: Toggle favorite clinic
app.post('/api/user/favorites', authenticateToken, async (req: any, res: any) => {
  try {
    const { clinicId } = req.body;
    if (!clinicId) return res.status(400).json({ error: 'clinicId is required.' });

    const existing = await db.select().from(favoriteClinics)
      .where(and(eq(favoriteClinics.userId, req.user.id), eq(favoriteClinics.clinicId, clinicId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(favoriteClinics)
        .where(and(eq(favoriteClinics.userId, req.user.id), eq(favoriteClinics.clinicId, clinicId)));
    } else {
      await db.insert(favoriteClinics).values({ userId: req.user.id, clinicId });
    }

    const allFavs = await db.select().from(favoriteClinics).where(eq(favoriteClinics.userId, req.user.id));
    res.json({ favoriteClinics: allFavs.map(f => f.clinicId) });
  } catch (err: any) {
    console.error('Toggle favorite error:', err);
    res.status(500).json({ error: 'Failed to toggle favorite.' });
  }
});

// USER: Add pet
app.post('/api/user/pets', authenticateToken, async (req: any, res: any) => {
  try {
    const { name, type, breed, age, weight, medicalHistory } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required.' });
    }

    const id = `pet-${Date.now()}`;
    await db.insert(pets).values({
      id, ownerId: req.user.id, name, type,
      breed: breed || 'Indie / Mix',
      age: age ? parseInt(age) : null,
      weight: weight || '',
      medicalHistory: medicalHistory ? [medicalHistory] : [],
    });

    // Return full updated user profile
    const userResponse = await buildUserResponse(req.user.id);
    res.status(201).json(userResponse);
  } catch (err: any) {
    console.error('Add pet error:', err);
    res.status(500).json({ error: 'Failed to add pet.' });
  }
});

// USER: Get current profile
app.get('/api/user/me', authenticateToken, async (req: any, res: any) => {
  try {
    const userResponse = await buildUserResponse(req.user.id);
    if (!userResponse) return res.status(404).json({ error: 'User not found.' });
    res.json(userResponse);
  } catch (err: any) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// ========================
// DOCUMENT ROUTES (Cloudinary)
// ========================

/**
 * POST /api/documents/upload
 * Upload a single verification document to Cloudinary.
 * Authenticated — veterinarians only.
 * Body: multipart/form-data  { file, docKey, label }
 */
app.post('/api/documents/upload', authenticateToken, upload.single('file'), async (req: any, res: any) => {
  try {
    if (!['veterinarian', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only veterinarians can upload verification documents.' });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        error: 'Document storage is not configured on this server. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      });
    }

    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      return res.status(400).json({ error: 'No file received. Send file as multipart/form-data with field name "file".' });
    }

    const docKey = typeof req.body.docKey === 'string' ? req.body.docKey.trim() : 'document';
    const label = typeof req.body.label === 'string' ? req.body.label.trim() : docKey;

    // Validate file type and size
    const validation = validateFile(file.mimetype, file.size, file.originalname);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Use the vet's clinicId as the folder segment; fall back to userId
    const vetId = req.user.clinicId || req.user.id;

    const meta = await uploadDocument(
      file.buffer,
      file.mimetype,
      file.originalname,
      vetId,
      docKey
    );

    const docId = `doc-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    res.status(201).json({
      id: docId,
      label,
      fileName: meta.fileName,
      fileType: meta.fileType,
      fileSize: meta.fileSize,
      uploadedAt: meta.uploadedAt,
      cloudinaryPublicId: meta.cloudinaryPublicId,
      resourceType: meta.resourceType,
    });
  } catch (err: any) {
    console.error('[Documents] Upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload document.' });
  }
});

/**
 * DELETE /api/documents/:publicId
 * Delete a document from Cloudinary.
 * Authenticated — veterinarians only.
 * publicId must be base64url-encoded to safely transmit slashes.
 */
app.delete('/api/documents/:publicId', authenticateToken, async (req: any, res: any) => {
  try {
    if (!['veterinarian', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only veterinarians can delete verification documents.' });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(503).json({ error: 'Document storage is not configured on this server.' });
    }

    const publicId = Buffer.from(req.params.publicId, 'base64url').toString('utf8');
    const resourceType = (req.query.resourceType === 'raw' ? 'raw' : 'image') as 'raw' | 'image';

    if (!publicId || !publicId.startsWith('quickvet/vets/')) {
      return res.status(400).json({ error: 'Invalid document reference.' });
    }

    await deleteDocument(publicId, resourceType);
    res.json({ deleted: true, publicId });
  } catch (err: any) {
    console.error('[Documents] Delete error:', err);
    res.status(500).json({ error: err.message || 'Failed to delete document.' });
  }
});

/**
 * GET /api/documents/:publicId/signed-url
 * Generate a short-lived signed URL for admin document viewing (or downloading).
 * Admin only. publicId must be base64url-encoded.
 * Query params:
 *   resourceType = 'raw' | 'image'
 *   download     = 'true'  → generates attachment URL (forces file download)
 */
app.get('/api/documents/:publicId/signed-url', authenticateToken, requireRole('admin'), async (req: any, res: any) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({ error: 'Document storage is not configured on this server.' });
    }

    const publicId = Buffer.from(req.params.publicId, 'base64url').toString('utf8');
    const resourceType = (req.query.resourceType === 'raw' ? 'raw' : 'image') as 'raw' | 'image';
    const asAttachment = req.query.download === 'true';

    if (!publicId || !publicId.startsWith('quickvet/vets/')) {
      return res.status(400).json({ error: 'Invalid document reference.' });
    }

    const result = generateSignedUrl(publicId, resourceType, asAttachment);
    res.json(result);
  } catch (err: any) {
    console.error('[Documents] Signed URL error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate signed URL.' });
  }
});

/**
 * GET /api/documents/:publicId/download
 * Forces a file download by generating a signed attachment URL and redirecting to it.
 * Admin only. publicId must be base64url-encoded.
 *
 * Why redirect instead of returning JSON?
 * The browser's <a download> attribute is ignored for cross-origin URLs.
 * By redirecting here, the browser hits Cloudinary directly with
 * Content-Disposition: attachment set, which triggers a real file download.
 *
 * NOTE: This uses a short-lived token in query string — acceptable because:
 *  - The URL expires in 1 hour
 *  - The asset is private (authenticated type)
 *  - This pattern is standard for CDN-based downloads
 */
app.get('/api/documents/:publicId/download', authenticateToken, requireRole('admin'), async (req: any, res: any) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({ error: 'Document storage is not configured on this server.' });
    }

    const publicId = Buffer.from(req.params.publicId, 'base64url').toString('utf8');
    const resourceType = (req.query.resourceType === 'raw' ? 'raw' : 'image') as 'raw' | 'image';

    if (!publicId || !publicId.startsWith('quickvet/vets/')) {
      return res.status(400).json({ error: 'Invalid document reference.' });
    }

    // Generate signed URL with attachment=true → Cloudinary sends Content-Disposition: attachment
    const { signedUrl } = generateSignedUrl(publicId, resourceType, true);

    // Redirect browser to Cloudinary — it will receive Content-Disposition: attachment
    // and the browser will trigger a native file download dialog
    res.redirect(302, signedUrl);
  } catch (err: any) {
    console.error('[Documents] Download redirect error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate download link.' });
  }
});



// ANALYTICS: Admin dashboard
app.get('/api/analytics/admin', authenticateToken, requireRole('admin'), async (_req: any, res: any) => {
  try {
    res.json(await getAdminAnalytics());
  } catch (err: any) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch admin analytics.' });
  }
});

// ANALYTICS: Veterinarian dashboard
app.get('/api/analytics/vet', authenticateToken, requireRole('veterinarian'), async (req: any, res: any) => {
  try {
    if (!req.user.clinicId) {
      return res.status(400).json({ error: 'Veterinarian profile is not linked to a clinic yet.' });
    }
    res.json(await getVetAnalytics(req.user.clinicId));
  } catch (err: any) {
    console.error('Vet analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch veterinarian analytics.' });
  }
});

// ANALYTICS: Pet owner dashboard
app.get('/api/analytics/user', authenticateToken, requireRole('pet_owner'), async (req: any, res: any) => {
  try {
    res.json(await getUserAnalytics(req.user.id));
  } catch (err: any) {
    console.error('User analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch user analytics.' });
  }
});


// ========================
// HELPER: Build user response with pets & favorites (no passwordHash)
// ========================
async function buildUserResponse(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const userPets = await db.select().from(pets).where(eq(pets.ownerId, userId));
  const userFavs = await db.select().from(favoriteClinics).where(eq(favoriteClinics.userId, userId));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone || '',
    avatarUrl: user.avatarUrl || '',
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    clinicId: user.clinicId || undefined,
    pets: userPets.map(p => ({
      id: p.id, name: p.name, type: p.type,
      breed: p.breed || undefined, age: p.age || undefined,
      weight: p.weight || undefined, medicalHistory: p.medicalHistory || [],
    })),
    favoriteClinics: userFavs.map(f => f.clinicId),
  };
}


// ========================
// VACCINATION APPOINTMENTS API
// ========================

// In-memory store for vaccination appointments (replace with DB table in production)
const vaccinationAppointments: any[] = [];
const vaccinationRecords: any[] = [];

// CREATE vaccination appointment
app.post('/api/vaccinations/appointments', authenticateToken, async (req: any, res: any) => {
  try {
    const { petId, petName, petType, clinicId, clinicName, vaccineName, vaccineType, diseasesProtected, scheduledDate, scheduledTime, notes } = req.body;
    if (!petId || !clinicId || !vaccineName || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const id = `vacc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const appointment = {
      id,
      petId, petName, petType,
      ownerId: req.user.id,
      ownerName: req.user.email,
      ownerEmail: req.user.email,
      clinicId, clinicName,
      vaccineName, vaccineType: vaccineType || 'core',
      diseasesProtected: diseasesProtected || [],
      scheduledDate, scheduledTime,
      status: 'scheduled',
      notes: notes || '',
      remindersSent: 0,
      workflowId: `wf-vacc-${id}`,
      createdAt: new Date().toISOString(),
    };

    vaccinationAppointments.push(appointment);

    // In production: Start Temporal workflow here
    // const handle = await temporalClient.workflow.start(VaccinationAppointmentWorkflow, {
    //   workflowId: appointment.workflowId,
    //   taskQueue: 'vaccination-queue',
    //   args: [{ appointmentId: id, petName, petType, ownerEmail: req.user.email, ... }],
    // });

    res.status(201).json(appointment);
  } catch (err: any) {
    console.error('Create vaccination appointment error:', err);
    res.status(500).json({ error: 'Failed to create vaccination appointment.' });
  }
});

// GET vaccination appointments for current user
app.get('/api/vaccinations/appointments', authenticateToken, async (req: any, res: any) => {
  try {
    const userAppts = vaccinationAppointments.filter(a => a.ownerId === req.user.id || a.ownerEmail === req.user.email);
    res.json(userAppts);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch vaccination appointments.' });
  }
});

// GET all vaccination appointments (admin)
app.get('/api/vaccinations/appointments/all', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
    res.json(vaccinationAppointments);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch all vaccination appointments.' });
  }
});

// UPDATE vaccination appointment status
app.put('/api/vaccinations/appointments/:id/status', authenticateToken, async (req: any, res: any) => {
  try {
    const { status, administeredBy, batchNumber, nextBoosterDate } = req.body;
    const appt = vaccinationAppointments.find(a => a.id === req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found.' });

    appt.status = status;
    appt.updatedAt = new Date().toISOString();
    if (administeredBy) appt.administeredBy = administeredBy;
    if (batchNumber) appt.batchNumber = batchNumber;
    if (nextBoosterDate) appt.nextBoosterDate = nextBoosterDate;

    // If completed, create a vaccination record
    if (status === 'completed') {
      const record = {
        id: `vrec-${Date.now()}`,
        petId: appt.petId,
        petName: appt.petName,
        vaccineName: appt.vaccineName,
        dateAdministered: appt.scheduledDate,
        clinicId: appt.clinicId,
        clinicName: appt.clinicName,
        veterinarianName: administeredBy || 'Veterinarian',
        batchNumber: batchNumber || '',
        nextBoosterDate: nextBoosterDate || '',
        notes: appt.notes,
        createdAt: new Date().toISOString(),
      };
      vaccinationRecords.push(record);
    }

    res.json(appt);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update appointment status.' });
  }
});

// CANCEL vaccination appointment
app.delete('/api/vaccinations/appointments/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const idx = vaccinationAppointments.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Appointment not found.' });

    vaccinationAppointments[idx].status = 'cancelled';
    vaccinationAppointments[idx].updatedAt = new Date().toISOString();

    // In production: Cancel Temporal workflow
    // await temporalClient.workflow.cancel(vaccinationAppointments[idx].workflowId);

    res.json({ message: 'Appointment cancelled.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to cancel appointment.' });
  }
});

// GET vaccination records for a pet
app.get('/api/vaccinations/records/:petId', authenticateToken, async (req: any, res: any) => {
  try {
    const records = vaccinationRecords.filter(r => r.petId === req.params.petId);
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch vaccination records.' });
  }
});


// ========================
// VITE MIDDLEWARE & SERVER START
// ========================
async function startServer() {
  // Test database connection before starting (non-fatal)
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('⚠️  WARNING: Database connection failed on startup.');
    console.error('   API routes will return 503 until the database becomes available.');
    console.error('   Check your DATABASE_URL and ensure PostgreSQL is running.');
    
    // Retry connection every 15s in background
    const retryInterval = setInterval(async () => {
      console.log('🔄 Retrying database connection...');
      const connected = await testConnection();
      if (connected) {
        console.log('🎉 Database connection restored!');
        clearInterval(retryInterval);
      }
    }, 15000);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🐾 QuickVet Server running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await closePool();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    await closePool();
    process.exit(0);
  });
}

startServer();
