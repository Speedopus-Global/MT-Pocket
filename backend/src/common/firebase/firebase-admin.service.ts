/**
 * FirebaseAdminService — Firebase Admin SDK singleton for NestJS
 * ─────────────────────────────────────────────────────────────────────────
 * Initialises Firebase Admin once at startup and exposes `verifyIdToken()`
 * which the AuthService uses to validate Firebase phone-auth tokens sent
 * from the frontend.
 *
 * Required .env key:
 *   FIREBASE_SERVICE_ACCOUNT_JSON — the full JSON content of the Firebase
 *                                   service-account key file, stringified
 *                                   into a single line (or a file path).
 *
 * Alternative: set GOOGLE_APPLICATION_CREDENTIALS to the file path of
 * the service-account key and omit FIREBASE_SERVICE_ACCOUNT_JSON.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { Injectable, Logger, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app: App | null = null;

  onModuleInit() {
    if (getApps().length > 0) {
      this.logger.log('Firebase Admin already initialised — reusing existing app');
      this.app = getApps()[0];
      return;
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
    const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

    try {
      if (serviceAccountJson) {
        let serviceAccount: any;
        const cwdPath = path.resolve(process.cwd(), serviceAccountJson);
        const rootPath = path.resolve(__dirname, '../../..', serviceAccountJson);

        if (fs.existsSync(serviceAccountJson)) {
          serviceAccount = JSON.parse(fs.readFileSync(serviceAccountJson, 'utf-8'));
        } else if (fs.existsSync(cwdPath)) {
          serviceAccount = JSON.parse(fs.readFileSync(cwdPath, 'utf-8'));
        } else if (fs.existsSync(rootPath)) {
          serviceAccount = JSON.parse(fs.readFileSync(rootPath, 'utf-8'));
        } else {
          // If not a file, parse as raw JSON string
          serviceAccount = JSON.parse(serviceAccountJson);
        }

        this.app = initializeApp({
          credential: cert(serviceAccount),
        });
        this.logger.log('Firebase Admin initialised successfully');
      } else if (googleAppCreds && fs.existsSync(googleAppCreds)) {
        this.app = initializeApp({
          credential: applicationDefault(),
        });
        this.logger.log('Firebase Admin initialised with GOOGLE_APPLICATION_CREDENTIALS');
      } else {
        this.logger.warn(
          'FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS not configured. ' +
          'Phone authentication token verification will fail until credentials are provided.',
        );
      }
    } catch (err: any) {
      this.logger.error('Failed to initialise Firebase Admin', err?.message || err);
    }
  }

  /**
   * Verify a Firebase ID token (JWT) and return the decoded claims.
   * The `phone_number` claim contains the E.164 phone number that
   * Firebase authenticated.
   */
  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    if (!this.app && getApps().length === 0) {
      throw new InternalServerErrorException(
        'Firebase Admin SDK is not initialised. Please configure FIREBASE_SERVICE_ACCOUNT_JSON in .env.',
      );
    }
    const auth = getAuth(this.app || getApps()[0]);
    return auth.verifyIdToken(idToken);
  }
}
