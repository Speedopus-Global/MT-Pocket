import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';

// ⚠️ Adjust these three import paths to match where these actually live in
// your project — they're copied from what your other modules import them
// as (e.g. loan-requests.service.ts imports LoanRequest from
// '../loan-request/schemas/loan-request.schema' — mirror that here).
import { LoanRequest, LoanRequestSchema } from '../Loan/schemas/loan-request.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';

// ⚠️ Import the modules that EXPORT BlocksService and NotificationsService
// in your project (e.g. BlockModule, NotificationsModule) — names below are
// guesses based on your file names (Block.service.ts, notifications.service.ts).
import { BlocksModule } from '../Block/block.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: LoanRequest.name, schema: LoanRequestSchema },
      { name: User.name, schema: UserSchema },
    ]),
    // A SEPARATE JwtModule registration from AuthModule's — the gateway
    // needs its own JwtService instance to call .verify() during the socket
    // handshake (sockets never go through AuthGuard/passport). No signing
    // options needed here since we only ever call .verify(), and the secret
    // is passed per-call in chat.gateway.ts from JWT_ACCESS_SECRET.
    JwtModule.register({}),
    BlocksModule,
    NotificationsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}