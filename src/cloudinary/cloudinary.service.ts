import { Injectable } from '@nestjs/common';
import { UploadApiResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'Sabay-Konfess',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        )
        .end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<{ result: string }> {
    return cloudinary.uploader.destroy(publicId);
  }

  async replaceImage(
    oldPublicId: string,
    newFile: Express.Multer.File,
  ): Promise<UploadApiResponse> {
    return await cloudinary.uploader.upload(newFile.path, {
      public_id: oldPublicId,
      overwrite: true,
      resource_type: 'image', // or 'auto' if unsure
    });
  }
}
