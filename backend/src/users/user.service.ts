import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  findByPhone(phone: string) {
    return this.userModel.findOne({ phone }).exec();
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  findByIdentifier(identifier: string) {
    if (identifier.includes('@')) {
      return this.findByEmail(identifier);
    }
    return this.findByPhone(identifier);
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async findOrCreateByPhone(phone: string): Promise<UserDocument> {
    const existing = await this.findByPhone(phone);
    if (existing) return existing;
    return this.userModel.create({ phone });
  }

  updateById(id: string, update: Partial<User>) {
    return this.userModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }
}