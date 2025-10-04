import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ResourceDocument = Resource & Document;

@Schema({ timestamps: true })
export class Resource {
  @Prop({ required: true, type: 'ObjectId', ref: 'Company' })
  companyId: string;

  @Prop({ required: true, enum: ['file', 'url'] })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  url?: string;

  @Prop()
  fileUrl?: string;

  @Prop()
  filePath?: string;

  @Prop()
  fileSize?: number;

  @Prop()
  mimeType?: string;

  @Prop({ default: false })
  processed: boolean;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);

