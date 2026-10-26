import { IsNotEmpty, IsString } from 'class-validator';

/**
 * For Firebase phone auth: the frontend sends a Firebase ID token
 * after the user verifies the OTP client-side with Firebase.
 */
export class FirebasePhoneTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Firebase ID token is required' })
  firebaseIdToken: string;
}
