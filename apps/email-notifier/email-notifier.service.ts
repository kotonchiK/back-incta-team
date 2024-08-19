import { Injectable } from '@nestjs/common';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailNotifierService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(options: ISendMailOptions) {
    const { to, subject, template, html } = options;
    if (!to) {
      throw new Error('Email recipient "to" is required');
    }
    if (!subject) {
      throw new Error('Email subject is required');
    }
    if (!template && !html) {
      throw new Error('Email body is required');
    }
    await this.mailerService.sendMail({
      to,
      subject,
      html,
      template,
    });
  }
}
