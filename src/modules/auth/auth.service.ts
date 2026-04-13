import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../../common/schemas/user.schema';
import { SignupDto, LoginDto } from '../../common/dto/auth.dto';
import { AuthResponseDto } from '../../common/dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    const { email, password, name, role: requestedRole } = signupDto;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const adminExists = await this.userModel.exists({ role: UserRole.ADMIN });
    let role = UserRole.USER;

    if (requestedRole === UserRole.ADMIN) {
      if (adminExists) {
        throw new UnauthorizedException('Admin already exists');
      }
      role = UserRole.ADMIN;
    } else if (!adminExists) {
      role = UserRole.ADMIN;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({ email, password: hashedPassword, name, role });
    await user.save();

    const token = this.jwtService.sign({ email: user.email, sub: user._id, role: user.role });
    
    return {
      success: true,
      message: 'User registered successfully',
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ email: user.email, sub: user._id, role: user.role });

    return {
      success: true,
      message: 'Login successful',
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }
}