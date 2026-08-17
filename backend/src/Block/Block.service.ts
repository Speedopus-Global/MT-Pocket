import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Block, BlockDocument } from './schemas/Block.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class BlocksService {
  constructor(
    @InjectModel(Block.name) private blockModel: Model<BlockDocument>,
    @InjectModel(User.name)  private userModel: Model<UserDocument>,
  ) {}

  async block(blockerId: string, blockedUserId: string) {
    if (blockerId === blockedUserId) {
      throw new BadRequestException('You cannot block yourself');
    }
    const target = await this.userModel.findById(blockedUserId).lean();
    if (!target) throw new NotFoundException('User not found');

    // upsert — blocking someone twice is a no-op, not an error
    await this.blockModel.updateOne(
      { blockerId: new Types.ObjectId(blockerId), blockedUserId: new Types.ObjectId(blockedUserId) },
      {
        $setOnInsert: {
          blockerId: new Types.ObjectId(blockerId),
          blockedUserId: new Types.ObjectId(blockedUserId),
        },
      },
      { upsert: true },
    );

    return { message: 'User blocked' };
  }

  async unblock(blockerId: string, blockedUserId: string) {
    await this.blockModel.deleteOne({
      blockerId: new Types.ObjectId(blockerId),
      blockedUserId: new Types.ObjectId(blockedUserId),
    });
    return { message: 'User unblocked' };
  }

  // Full records (with populated user info) — for a "Blocked users" settings screen
  async getMyBlockedUsers(blockerId: string) {
    return this.blockModel
      .find({ blockerId: new Types.ObjectId(blockerId) })
      .populate('blockedUserId', 'fullName phone avatarUrl')
      .sort({ createdAt: -1 })
      .lean();
  }

  // Just the raw ObjectId strings — cheap, for client-side filtering
  // (e.g. Marketplace hiding a blocked borrower's requests).
  async getMyBlockedUserIds(blockerId: string): Promise<string[]> {
    const rows = await this.blockModel
      .find({ blockerId: new Types.ObjectId(blockerId) })
      .select('blockedUserId')
      .lean();
    return rows.map((r) => r.blockedUserId.toString());
  }

  // True if EITHER user has blocked the other — gates offers/chat both ways,
  // so a blocked user can't just approach from the other direction.
  async isBlockedEitherWay(userIdA: string, userIdB: string): Promise<boolean> {
    if (!userIdA || !userIdB || userIdA === userIdB) return false;
    if (!Types.ObjectId.isValid(userIdA) || !Types.ObjectId.isValid(userIdB)) return false;
    const count = await this.blockModel.countDocuments({
      $or: [
        { blockerId: new Types.ObjectId(userIdA), blockedUserId: new Types.ObjectId(userIdB) },
        { blockerId: new Types.ObjectId(userIdB), blockedUserId: new Types.ObjectId(userIdA) },
      ],
    });
    return count > 0;
  }

  // NEW — bulk version of isBlockedEitherWay, for filtering a list of
  // results (e.g. LoanRequestsService.search()) in one query instead of
  // one countDocuments() call per result. Returns every user ID that is
  // blocked-either-way with `userId`: people this user blocked, PLUS
  // people who blocked this user.
  async getBlockedEitherWayUserIds(userId: string): Promise<string[]> {
    const uid = new Types.ObjectId(userId);
    const rows = await this.blockModel
      .find({ $or: [{ blockerId: uid }, { blockedUserId: uid }] })
      .select('blockerId blockedUserId')
      .lean();

    return rows.map((r) =>
      r.blockerId.toString() === userId
        ? r.blockedUserId.toString()
        : r.blockerId.toString(),
    );
  }
}