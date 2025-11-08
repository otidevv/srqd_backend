import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar usuario por email con su rol
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
            isSystem: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar que el usuario esté activo
    if (user.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Tu cuenta está inactiva. Contacta al administrador.',
      );
    }

    // Verificar password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Actualizar lastLogin
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generar JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role?.name,
    };

    const token = this.jwtService.sign(payload);

    // Preparar respuesta (sin enviar el password)
    const { password: _, ...userWithoutPassword } = user;

    return {
      success: true,
      user: {
        ...userWithoutPassword,
        status: userWithoutPassword.status.toLowerCase(),
      },
      token,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
            isSystem: true,
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async requestPasswordReset(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Buscar usuario por email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Por seguridad, siempre retornamos éxito aunque el email no exista
    // Esto evita que atacantes descubran qué emails están registrados
    if (!user) {
      return {
        success: true,
        message:
          'Si el correo existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña.',
      };
    }

    // Verificar que el usuario esté activo
    if (user.status !== 'ACTIVE') {
      return {
        success: true,
        message:
          'Si el correo existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña.',
      };
    }

    // Generar token seguro
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Configurar expiración (1 hora)
    const resetPasswordExpires = new Date();
    resetPasswordExpires.setHours(resetPasswordExpires.getHours() + 1);

    // Guardar token en la base de datos
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetPasswordExpires,
      },
    });

    // Enviar email con el token (fire-and-forget pattern)
    this.mailService
      .enviarEmailResetPassword(user.email, user.name, resetToken)
      .catch((error) => {
        console.error('Error al enviar email de recuperación:', error);
        // No lanzamos el error para no revelar información al usuario
      });

    return {
      success: true,
      message:
        'Si el correo existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña.',
    };
  }

  async validateResetToken(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(), // Token no expirado
        },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'El token de recuperación es inválido o ha expirado',
      );
    }

    return {
      success: true,
      message: 'Token válido',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    // Buscar usuario con el token válido
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(), // Token no expirado
        },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'El token de recuperación es inválido o ha expirado',
      );
    }

    // Verificar que el usuario esté activo
    if (user.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Tu cuenta está inactiva. Contacta al administrador.',
      );
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Actualizar contraseña y limpiar tokens
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente',
    };
  }
}
