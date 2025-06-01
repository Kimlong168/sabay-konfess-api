import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './user.repository';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { IsNull, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(createUserDto: CreateUserDto, file: Express.Multer.File) {
    try {
      const userEntity = this.userRepository.create(createUserDto);
      const passwordHash = await this.hashPassword(createUserDto.password);

      if (!passwordHash) {
        throw new BadRequestException('Password hashing failed');
      }

      userEntity.password = passwordHash;

      if (file) {
        const image = await this.cloudinaryService.uploadImage(file);
        userEntity.profileImage = image.secure_url;
      }

      const user = await this.userRepository.save(userEntity);

      if (!user) {
        throw new BadRequestException('User not created');
      }

      return user;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // Re-throw if it's already a BadRequestException
      }
      throw new BadRequestException('Error creating user: ' + error.message);
    }
  }

  async findAll() {
    return await this.userRepository.find();
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    file: Express.Multer.File,
  ) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (file) {
      const image = await this.cloudinaryService.uploadImage(file);
      user.profileImage = image.secure_url;
    }

    const savedUser = await this.userRepository.save({
      ...user,
      ...updateUserDto,
    });

    if (!savedUser) {
      throw new BadRequestException('User not updated');
    }
    return savedUser;
  }

  async remove(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const deletedUser = await this.userRepository.remove(user);

    if (!deletedUser) {
      throw new BadRequestException('User not deleted');
    }

    return deletedUser;
  }

  async hashPassword(password: string) {
    try {
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new BadRequestException('Error hashing password: ' + error.message);
    }
  }

  async compareHash(password: string, hashedPassword: string) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new BadRequestException(
        'Error comparing password: ' + error.message,
      );
    }
  }

  async findByPhone(phone: string) {
    return await this.userRepository.findOne({ where: { phone } });
  }

  async findByUsername(username: string) {
    return await this.userRepository.findOne({ where: { username } });
  }

  async findByChatId(chatId: string) {
    return await this.userRepository.findOne({ where: { chatId } });
  }

  async findAllWithChatId(limit?: number) {
    const options: any = {
      where: {
        chatId: Not(IsNull()),
      },
    };

    if (limit) {
      options.take = limit;
    }

    return this.userRepository.find(options);
  }
}
