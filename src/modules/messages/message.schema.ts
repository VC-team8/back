import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema()
export class Source {
  @Prop({ required: true, enum: ['file', 'url'] })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  url?: string;

  @Prop()
  excerpt?: string;
}

const SourceSchema = SchemaFactory.createForClass(Source);

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true, type: 'ObjectId', ref: 'Conversation' })
  conversationId: string;

  @Prop({ required: true, enum: ['user', 'assistant'] })
  role: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [SourceSchema] })
  sources?: Source[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);

