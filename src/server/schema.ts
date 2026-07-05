/**
 * Drizzle ORM Schema for QuickVet PostgreSQL Database
 * 
 * 7 Tables: vet_clinics, users, pets, favorite_clinics, clinic_reviews, bookings, emergency_requests
 * Referential integrity with proper CASCADE/RESTRICT/SET NULL rules.
 */
import {
  pgTable,
  varchar,
  text,
  doublePrecision,
  numeric,
  integer,
  boolean,
  timestamp,
  date,
  primaryKey,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================
// TABLE: vet_clinics
// ============================================================
export const vetClinics = pgTable('vet_clinics', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  address: text('address').notNull(),
  area: varchar('area', { length: 100 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  phone: varchar('phone', { length: 30 }).notNull(),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('0.00'),
  reviewsCount: integer('reviews_count').default(0),
  imageUrl: text('image_url').notNull(),
  specialists: jsonb('specialists').notNull().$type<string[]>().default([]),
  hasEmergency: boolean('has_emergency').default(false),
  hasHomeVisit: boolean('has_home_visit').default(false),
  isOpenNow: boolean('is_open_now').default(true),
  workingHours: varchar('working_hours', { length: 100 }).notNull(),
  services: jsonb('services').notNull().$type<string[]>().default([]),
  verificationDocuments: jsonb('verification_documents').notNull().$type<Array<{
    id: string;
    label: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
    /** Cloudinary public_id — present for Cloudinary uploads */
    cloudinaryPublicId?: string;
    /** Cloudinary resource type: 'raw' (PDF) or 'image' */
    resourceType?: 'raw' | 'image';
    /** Legacy base64 data URL — only in demo/mock data */
    dataUrl?: string;
  }>>().default([]),
  verificationStatus: varchar('verification_status', { length: 30 }).default('approved'),
  licenseNumber: varchar('license_number', { length: 100 }),
  veterinarianName: varchar('veterinarian_name', { length: 120 }),
  yearsOfExperience: varchar('years_of_experience', { length: 30 }),
});

// ============================================================
// TABLE: users
// ============================================================
export const users = pgTable('users', {
  id: varchar('id', { length: 100 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'pet_owner' | 'veterinarian' | 'admin' | 'guest'
  phone: varchar('phone', { length: 30 }),
  avatarUrl: text('avatar_url'),
  clinicId: varchar('clinic_id', { length: 100 }).references(() => vetClinics.id, { onDelete: 'set null' }),
  resetTokenHash: varchar('reset_token_hash', { length: 255 }),
  resetTokenExpires: timestamp('reset_token_expires', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
}));

// ============================================================
// TABLE: pets
// ============================================================
export const pets = pgTable('pets', {
  id: varchar('id', { length: 100 }).primaryKey(),
  ownerId: varchar('owner_id', { length: 100 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  breed: varchar('breed', { length: 100 }),
  age: integer('age'),
  weight: varchar('weight', { length: 20 }),
  medicalHistory: jsonb('medical_history').notNull().$type<string[]>().default([]),
}, (table) => ({
  ownerIdx: index('idx_pets_owner').on(table.ownerId),
}));

// ============================================================
// TABLE: favorite_clinics (Join Table - Many-to-Many)
// ============================================================
export const favoriteClinics = pgTable('favorite_clinics', {
  userId: varchar('user_id', { length: 100 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  clinicId: varchar('clinic_id', { length: 100 }).notNull().references(() => vetClinics.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.clinicId] }),
}));

// ============================================================
// TABLE: clinic_reviews
// ============================================================
export const clinicReviews = pgTable('clinic_reviews', {
  id: varchar('id', { length: 100 }).primaryKey(),
  clinicId: varchar('clinic_id', { length: 100 }).notNull().references(() => vetClinics.id, { onDelete: 'cascade' }),
  userName: varchar('user_name', { length: 100 }).notNull(),
  userEmail: varchar('user_email', { length: 255 }).notNull(),
  petType: varchar('pet_type', { length: 50 }).notNull(),
  rating: integer('rating').notNull(), // CHECK (rating >= 1 AND rating <= 5) enforced at app level
  reviewText: text('review_text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  clinicIdx: index('idx_reviews_clinic').on(table.clinicId),
}));

// ============================================================
// TABLE: bookings
// ============================================================
export const bookings = pgTable('bookings', {
  id: varchar('id', { length: 100 }).primaryKey(),
  clinicId: varchar('clinic_id', { length: 100 }).notNull().references(() => vetClinics.id, { onDelete: 'restrict' }),
  clinicName: varchar('clinic_name', { length: 255 }).notNull(),
  petOwnerId: varchar('pet_owner_id', { length: 100 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  petOwnerName: varchar('pet_owner_name', { length: 100 }).notNull(),
  petOwnerEmail: varchar('pet_owner_email', { length: 255 }).notNull(),
  petName: varchar('pet_name', { length: 100 }).notNull(),
  petType: varchar('pet_type', { length: 50 }).notNull(),
  service: varchar('service', { length: 100 }).notNull(),
  bookingDate: date('booking_date').notNull(),
  bookingTime: varchar('booking_time', { length: 30 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'), // 'pending' | 'approved' | 'completed' | 'cancelled'
  notes: text('notes'),
  bookingType: varchar('booking_type', { length: 20 }).notNull(), // 'clinic_visit' | 'home_visit'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  ownerIdx: index('idx_bookings_user').on(table.petOwnerId),
  clinicIdx: index('idx_bookings_clinic').on(table.clinicId),
  dateIdx: index('idx_bookings_date').on(table.bookingDate),
}));

// ============================================================
// TABLE: emergency_requests
// ============================================================
export const emergencyRequests = pgTable('emergency_requests', {
  id: varchar('id', { length: 100 }).primaryKey(),
  petOwnerId: varchar('pet_owner_id', { length: 100 }).references(() => users.id, { onDelete: 'set null' }),
  petOwnerName: varchar('pet_owner_name', { length: 100 }).notNull(),
  petOwnerEmail: varchar('pet_owner_email', { length: 255 }).notNull(),
  petName: varchar('pet_name', { length: 100 }).notNull(),
  petType: varchar('pet_type', { length: 50 }).notNull(),
  phone: varchar('phone', { length: 30 }).notNull(),
  address: text('address').notNull(),
  description: text('description').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  status: varchar('status', { length: 20 }).default('pending'), // 'pending' | 'notified' | 'accepted' | 'completed'
  acceptedByClinicId: varchar('accepted_by_clinic_id', { length: 100 }).references(() => vetClinics.id, { onDelete: 'set null' }),
  acceptedByClinicName: varchar('accepted_by_clinic_name', { length: 255 }),
  requestDate: date('request_date').notNull(),
  requestTime: varchar('request_time', { length: 30 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  statusIdx: index('idx_emergencies_status').on(table.status),
  createdIdx: index('idx_emergencies_created').on(table.createdAt),
}));

// ============================================================
// TABLE: vaccination_appointments
// ============================================================
export const vaccinationAppointments = pgTable('vaccination_appointments', {
  id: varchar('id', { length: 100 }).primaryKey(),
  petId: varchar('pet_id', { length: 100 }).notNull().references(() => pets.id, { onDelete: 'cascade' }),
  petName: varchar('pet_name', { length: 100 }).notNull(),
  petType: varchar('pet_type', { length: 50 }).notNull(),
  ownerId: varchar('owner_id', { length: 100 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  ownerName: varchar('owner_name', { length: 100 }),
  ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
  clinicId: varchar('clinic_id', { length: 100 }).notNull().references(() => vetClinics.id, { onDelete: 'restrict' }),
  clinicName: varchar('clinic_name', { length: 255 }).notNull(),
  vaccineName: varchar('vaccine_name', { length: 100 }).notNull(),
  vaccineType: varchar('vaccine_type', { length: 50 }).default('core'),
  diseasesProtected: jsonb('diseases_protected').notNull().$type<string[]>().default([]),
  scheduledDate: date('scheduled_date').notNull(),
  scheduledTime: varchar('scheduled_time', { length: 30 }).notNull(),
  status: varchar('status', { length: 20 }).default('scheduled'), // 'scheduled' | 'completed' | 'cancelled' | 'missed'
  notes: text('notes'),
  remindersSent: integer('reminders_sent').default(0),
  workflowId: varchar('workflow_id', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  administeredBy: varchar('administered_by', { length: 120 }),
  batchNumber: varchar('batch_number', { length: 100 }),
  nextBoosterDate: varchar('next_booster_date', { length: 50 }),
}, (table) => ({
  ownerIdx: index('idx_vacc_owner').on(table.ownerId),
  petIdx: index('idx_vacc_pet').on(table.petId),
  clinicIdx: index('idx_vacc_clinic').on(table.clinicId),
}));

// ============================================================
// TABLE: vaccination_records
// ============================================================
export const vaccinationRecords = pgTable('vaccination_records', {
  id: varchar('id', { length: 100 }).primaryKey(),
  petId: varchar('pet_id', { length: 100 }).notNull().references(() => pets.id, { onDelete: 'cascade' }),
  petName: varchar('pet_name', { length: 100 }).notNull(),
  vaccineName: varchar('vaccine_name', { length: 100 }).notNull(),
  dateAdministered: date('date_administered').notNull(),
  clinicId: varchar('clinic_id', { length: 100 }).references(() => vetClinics.id, { onDelete: 'set null' }),
  clinicName: varchar('clinic_name', { length: 255 }).notNull(),
  veterinarianName: varchar('veterinarian_name', { length: 120 }),
  batchNumber: varchar('batch_number', { length: 100 }),
  nextBoosterDate: varchar('next_booster_date', { length: 50 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  petIdx: index('idx_vrec_pet').on(table.petId),
  clinicIdx: index('idx_vrec_clinic').on(table.clinicId),
}));

// ============================================================
// RELATIONS (for Drizzle relational query API)
// ============================================================
export const usersRelations = relations(users, ({ many, one }) => ({
  pets: many(pets),
  favoriteClinics: many(favoriteClinics),
  bookings: many(bookings),
  emergencyRequests: many(emergencyRequests),
  vaccinationAppointments: many(vaccinationAppointments),
  clinic: one(vetClinics, {
    fields: [users.clinicId],
    references: [vetClinics.id],
  }),
}));

export const petsRelations = relations(pets, ({ one, many }) => ({
  owner: one(users, {
    fields: [pets.ownerId],
    references: [users.id],
  }),
  vaccinationAppointments: many(vaccinationAppointments),
  vaccinationRecords: many(vaccinationRecords),
}));

export const vetClinicsRelations = relations(vetClinics, ({ many }) => ({
  reviews: many(clinicReviews),
  bookings: many(bookings),
  veterinarians: many(users),
  favoritedBy: many(favoriteClinics),
  vaccinationAppointments: many(vaccinationAppointments),
  vaccinationRecords: many(vaccinationRecords),
}));

export const favoriteClinicsRelations = relations(favoriteClinics, ({ one }) => ({
  user: one(users, {
    fields: [favoriteClinics.userId],
    references: [users.id],
  }),
  clinic: one(vetClinics, {
    fields: [favoriteClinics.clinicId],
    references: [vetClinics.id],
  }),
}));

export const clinicReviewsRelations = relations(clinicReviews, ({ one }) => ({
  clinic: one(vetClinics, {
    fields: [clinicReviews.clinicId],
    references: [vetClinics.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  clinic: one(vetClinics, {
    fields: [bookings.clinicId],
    references: [vetClinics.id],
  }),
  petOwner: one(users, {
    fields: [bookings.petOwnerId],
    references: [users.id],
  }),
}));

export const emergencyRequestsRelations = relations(emergencyRequests, ({ one }) => ({
  petOwner: one(users, {
    fields: [emergencyRequests.petOwnerId],
    references: [users.id],
  }),
  acceptedByClinic: one(vetClinics, {
    fields: [emergencyRequests.acceptedByClinicId],
    references: [vetClinics.id],
  }),
}));

export const vaccinationAppointmentsRelations = relations(vaccinationAppointments, ({ one }) => ({
  pet: one(pets, {
    fields: [vaccinationAppointments.petId],
    references: [pets.id],
  }),
  owner: one(users, {
    fields: [vaccinationAppointments.ownerId],
    references: [users.id],
  }),
  clinic: one(vetClinics, {
    fields: [vaccinationAppointments.clinicId],
    references: [vetClinics.id],
  }),
}));

export const vaccinationRecordsRelations = relations(vaccinationRecords, ({ one }) => ({
  pet: one(pets, {
    fields: [vaccinationRecords.petId],
    references: [pets.id],
  }),
  clinic: one(vetClinics, {
    fields: [vaccinationRecords.clinicId],
    references: [vetClinics.id],
  }),
}));
