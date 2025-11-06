import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller('dni')
export class DniController {
  @Get('consulta/:dni')
  @Public() // Endpoint público para consultar DNI
  async consultarDNI(@Param('dni') dni: string) {
    // Validar formato de DNI
    if (!/^\d{8}$/.test(dni)) {
      throw new HttpException(
        'DNI inválido. Debe contener 8 dígitos',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Hacer fetch a la API de UNAMAD
      const response = await fetch(
        `https://apidatos.unamad.edu.pe/api/consulta/${dni}`,
      );

      if (!response.ok) {
        throw new HttpException(
          'DNI no encontrado en la base de datos',
          HttpStatus.NOT_FOUND,
        );
      }

      const data = await response.json();

      // Retornar datos
      return {
        success: true,
        data: {
          dni: data.DNI,
          nombres: data.NOMBRES,
          apellidoPaterno: data.AP_PAT,
          apellidoMaterno: data.AP_MAT,
          sexo: data.SEXO,
          fechaNacimiento: data.FECHA_NAC,
          direccion: data.DIRECCION,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error al consultar el DNI. Intente nuevamente.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
