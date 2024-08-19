import { EProvider } from '@app/shared';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  @Prop({ type: Types.ObjectId })
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  deviceId: string;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true, index: true })
  expiresAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true, enum: EProvider })
  providerName: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
