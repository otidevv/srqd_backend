import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async enviarConstancia(
    destinatario: string,
    nombreCompleto: string,
    codigoCaso: string,
    pdfBuffer: Buffer,
  ) {
    try {
      await this.mailerService.sendMail({
        to: destinatario,
        subject: `Constancia de Reclamo/Queja/Denuncia - Código ${codigoCaso}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">UNAMAD</h1>
              <p style="margin: 5px 0;">Universidad Nacional Amazónica de Madre de Dios</p>
            </div>

            <div style="padding: 30px; background-color: #f9fafb;">
              <h2 style="color: #1e40af;">Constancia de Registro</h2>

              <p>Estimado(a) <strong>${nombreCompleto}</strong>,</p>

              <p>Hemos recibido su reclamo/queja/denuncia correctamente. Se le ha asignado el siguiente código de seguimiento:</p>

              <div style="background-color: white; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0;">
                <h3 style="margin: 0; color: #1e40af; font-size: 24px;">${codigoCaso}</h3>
              </div>

              <p>Adjunto a este correo encontrará la constancia en formato PDF con todos los detalles de su solicitud.</p>

              <p><strong>Importante:</strong></p>
              <ul>
                <li>Guarde este código para realizar el seguimiento de su caso</li>
                <li>Conserve la constancia adjunta como respaldo</li>
                <li>Recibirá notificaciones sobre el estado de su caso a este correo</li>
              </ul>

              <p>Para consultar el estado de su caso, puede ingresar a nuestro sistema con el código proporcionado.</p>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                <p><strong>Sistema de Registro de Reclamos, Quejas y Denuncias</strong></p>
                <p>Universidad Nacional Amazónica de Madre de Dios</p>
                <p>Este es un correo automático, por favor no responder.</p>
              </div>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `Constancia-${codigoCaso}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      return { success: true };
    } catch (error) {
      console.error('Error al enviar correo:', error);
      throw error;
    }
  }

  async enviarEmailResetPassword(
    destinatario: string,
    nombreCompleto: string,
    resetToken: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      await this.mailerService.sendMail({
        to: destinatario,
        subject: 'Recuperación de Contraseña - Sistema SRQD',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">UNAMAD</h1>
              <p style="margin: 5px 0;">Universidad Nacional Amazónica de Madre de Dios</p>
            </div>

            <div style="padding: 30px; background-color: #f9fafb;">
              <h2 style="color: #1e40af;">Recuperación de Contraseña</h2>

              <p>Estimado(a) <strong>${nombreCompleto}</strong>,</p>

              <p>Hemos recibido una solicitud para restablecer la contraseña de su cuenta en el Sistema SRQD.</p>

              <p>Para restablecer su contraseña, haga clic en el siguiente botón:</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Restablecer Contraseña
                </a>
              </div>

              <p>O copie y pegue el siguiente enlace en su navegador:</p>
              <p style="background-color: white; padding: 10px; border: 1px solid #e5e7eb; border-radius: 5px; word-break: break-all; font-size: 12px;">
                ${resetUrl}
              </p>

              <p><strong>Importante:</strong></p>
              <ul>
                <li>Este enlace es válido por <strong>1 hora</strong></li>
                <li>Si no solicitó este cambio, ignore este correo</li>
                <li>Por seguridad, nunca comparta este enlace con nadie</li>
              </ul>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                <p><strong>Sistema de Registro de Reclamos, Quejas y Denuncias</strong></p>
                <p>Universidad Nacional Amazónica de Madre de Dios</p>
                <p>Este es un correo automático, por favor no responder.</p>
              </div>
            </div>
          </div>
        `,
      });

      return { success: true };
    } catch (error) {
      console.error('Error al enviar correo de recuperación:', error);
      throw error;
    }
  }
}
