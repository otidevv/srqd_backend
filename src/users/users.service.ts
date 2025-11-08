import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto, ChangePasswordDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private formatUser(user: any) {
    const { password: _, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      status: userWithoutPassword.status.toLowerCase(),
    };
  }

  async create(createUserDto: CreateUserDto) {
    // Verificar si el email ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Verificar si el documento ya existe
    if (createUserDto.tipoDocumento && createUserDto.numeroDocumento) {
      const existingDocument = await this.prisma.user.findFirst({
        where: {
          tipoDocumento: createUserDto.tipoDocumento,
          numeroDocumento: createUserDto.numeroDocumento,
        },
      });

      if (existingDocument) {
        throw new ConflictException('Este número de documento ya está registrado');
      }
    }

    // Verificar que el rol existe
    const role = await this.prisma.role.findUnique({
      where: { id: createUserDto.roleId },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Preparar datos para crear usuario
    const userData: any = {
      ...createUserDto,
      password: hashedPassword,
    };

    // Convertir fechaNacimiento a DateTime si existe
    if (createUserDto.fechaNacimiento) {
      userData.fechaNacimiento = new Date(createUserDto.fechaNacimiento);
    }

    // Crear usuario
    const user = await this.prisma.user.create({
      data: userData,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
        dependencia: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    // Actualizar contador del rol
    await this.updateRoleUsersCount(createUserDto.roleId);

    return {
      success: true,
      data: this.formatUser(user),
      message: 'Usuario creado exitosamente',
    };
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
            isSystem: true,
          },
        },
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
        dependencia: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    const usersWithoutPasswords = users.map(this.formatUser);

    return {
      success: true,
      data: usersWithoutPasswords,
      total: usersWithoutPasswords.length,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
            isSystem: true,
          },
        },
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
        dependencia: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      success: true,
      data: this.formatUser(user),
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

    // Si se está actualizando el documento, verificar que no esté en uso
    const finalTipoDocumento = updateUserDto.tipoDocumento !== undefined
      ? updateUserDto.tipoDocumento
      : existingUser.tipoDocumento;
    const finalNumeroDocumento = updateUserDto.numeroDocumento !== undefined
      ? updateUserDto.numeroDocumento
      : existingUser.numeroDocumento;

    if (finalTipoDocumento && finalNumeroDocumento) {
      // Solo validar si hay cambios en los datos del documento
      const documentChanged =
        updateUserDto.tipoDocumento !== undefined ||
        updateUserDto.numeroDocumento !== undefined;

      if (documentChanged) {
        const documentInUse = await this.prisma.user.findFirst({
          where: {
            AND: [
              { tipoDocumento: finalTipoDocumento },
              { numeroDocumento: finalNumeroDocumento },
              { NOT: { id } },
            ],
          },
        });

        if (documentInUse) {
          throw new ConflictException('Este número de documento ya está registrado');
        }
      }
    }

    // Si se está actualizando el rol, verificar que existe
    if (updateUserDto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: updateUserDto.roleId },
      });

      if (!role) {
        throw new NotFoundException('Rol no encontrado');
      }

      // Actualizar contadores si el rol cambió
      if (existingUser.roleId !== updateUserDto.roleId) {
        await this.updateRoleUsersCount(existingUser.roleId);
        await this.updateRoleUsersCount(updateUserDto.roleId);
      }
    }

    // Si se está actualizando la contraseña, hashearla
    let dataToUpdate: any = { ...updateUserDto };

    if (updateUserDto.password) {
      dataToUpdate.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Convertir fechaNacimiento a DateTime si existe
    if (updateUserDto.fechaNacimiento) {
      dataToUpdate.fechaNacimiento = new Date(updateUserDto.fechaNacimiento);
    }

    // Actualizar usuario
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
            isSystem: true,
          },
        },
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
        dependencia: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return {
      success: true,
      data: this.formatUser(updatedUser),
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

  // ============================================================================
  // MÉTODOS DE PERFIL
  // ============================================================================

  async getProfile(userId: string) {
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
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
        dependencia: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      success: true,
      data: this.formatUser(user),
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    // Verificar que el usuario existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Si se está actualizando el documento, verificar que no esté en uso
    if (updateProfileDto.numeroDocumento && updateProfileDto.tipoDocumento) {
      const documentInUse = await this.prisma.user.findFirst({
        where: {
          AND: [
            { tipoDocumento: updateProfileDto.tipoDocumento },
            { numeroDocumento: updateProfileDto.numeroDocumento },
            { NOT: { id: userId } },
          ],
        },
      });

      if (documentInUse) {
        throw new ConflictException('Este número de documento ya está registrado');
      }
    }

    // Si se está actualizando la sede, verificar que existe
    if (updateProfileDto.sedeId) {
      const sede = await this.prisma.sede.findUnique({
        where: { id: updateProfileDto.sedeId },
      });

      if (!sede) {
        throw new NotFoundException('Sede no encontrada');
      }
    }

    // Si se está actualizando la dependencia, verificar que existe
    if (updateProfileDto.dependenciaId) {
      const dependencia = await this.prisma.dependencia.findUnique({
        where: { id: updateProfileDto.dependenciaId },
      });

      if (!dependencia) {
        throw new NotFoundException('Dependencia no encontrada');
      }
    }

    // Preparar datos para actualizar
    const dataToUpdate: any = { ...updateProfileDto };

    // Convertir fechaNacimiento a DateTime si existe
    if (updateProfileDto.fechaNacimiento) {
      dataToUpdate.fechaNacimiento = new Date(updateProfileDto.fechaNacimiento);
    }

    // Actualizar perfil
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
            isSystem: true,
          },
        },
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
        dependencia: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return {
      success: true,
      data: this.formatUser(updatedUser),
      message: 'Perfil actualizado exitosamente',
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    // Obtener usuario
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Actualizar contraseña
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente',
    };
  }

  private async updateRoleUsersCount(roleId: string) {
    const count = await this.prisma.user.count({
      where: { roleId: roleId },
    });

    await this.prisma.role.update({
      where: { id: roleId },
      data: { usersCount: count },
    });
  }
}
