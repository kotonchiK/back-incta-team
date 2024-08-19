import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { appConfig, TAppConfig } from '@app/shared';
import { EmailNotifierService } from './email-notifier.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (_appConfig: TAppConfig) => ({
        transport: {
          host: _appConfig.SMTP_SERVER_HOST,
          port: _appConfig.SMTP_SERVER_PORT,
          secure: false,
          ignoreTLS: true,
          auth: {
            user: _appConfig.SMTP_AUTHENTICATION_USERNAME,
            pass: _appConfig.SMTP_AUTHENTICATION_PASSWORD,
          },
        },
        defaults: {
          from: '"notifier" <notifier@incta.team>',
        },
        /* template: {
                dir: join(__dirname, 'templates'),
                adapter: new HandlebarsAdapter(),
                options: {
                  strict: true,
                },
              }, */
      }),
      inject: [appConfig.KEY],
    }),
  ],
  providers: [EmailNotifierService],
  exports: [EmailNotifierService],
})
export class EmailNotifierModule {}
