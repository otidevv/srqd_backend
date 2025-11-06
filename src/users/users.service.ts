import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // Verificar si el email ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Crear usuario
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    // Remover password de la respuesta
    const { password: _, ...userWithoutPassword } = user;

    return {
      success: true,
      data: {
        ...userWithoutPassword,
        role: userWithoutPassword.role.toLowerCase(),
        status: userWithoutPassword.status.toLowerCase(),
      },
      message: 'Usuario creado exitosamente',
    };
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Remover passwords de todos los usuarios
    const usersWithoutPasswords = users.map((user) => {
      const { password: _, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        role: userWithoutPassword.role.toLowerCase(),
        status: userWithoutPassword.status.toLowerCase(),
      };
    });

    return {
      success: true,
      data: usersWithoutPasswords,
      total: usersWithoutPasswords.length,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const { password: _, ...userWithoutPassword } = user;

    return {
      success: true,
      data: {
        ...userWithoutPassword,
        role: userWithoutPassword.role.toLowerCase(),
        status: userWithoutPassword.status.toLowerCase(),
      },
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Verificar que el usuario existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Si se está actualizando el email, verificar que no esté en uso
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailInUse = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailInUse) {
        throw new ConflictException('El email ya está en uso');
      }
    }

    // Si se está actualizando la contraseña, hashearla
    let dataToUpdate: any = { ...updateUserDto };

    if (updateUserDto.password) {
      dataToUpdate.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Actualizar usuario
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    return {
      success: true,
      data: {
        ...userWithoutPassword,
        role: userWithoutPassword.role.toLowerCase(),
        status: userWithoutPassword.status.toLowerCase(),
      },
      message: 'Usuario actualizado exitosamente',
    };
  }

  async remove(id: string) {
    // Verificar que el usuario existe
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar si el usuario tiene casos asignados
    const casosAsignados = await this.prisma.caso.count({
      where: { asignadoA: id },
    });

    if (casosAsignados > 0) {
      throw new BadRequestException(
        `No se puede eliminar el usuario porque tiene ${casosAsignados} caso(s) asignado(s)`,
      );
    }

    // Eliminar usuario
    await this.prisma.user.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Usuario eliminado exitosamente',
    };
  }
}
