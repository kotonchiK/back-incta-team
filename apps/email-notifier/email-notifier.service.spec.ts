import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailNotifierService } from './email-notifier.service';

describe('EmailNotifierService', () => {
  let service: EmailNotifierService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailNotifierService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmailNotifierService>(EmailNotifierService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call emailNotifierService.sendMail with correct parameters', async () => {
    const sendMailSpy = jest.spyOn(mailerService, 'sendMail');

    const mailOptions = {
      to: 'test@example.com',
      subject: 'Test Subject',
      template: 'test-template',
      html: '<body></body>',
      context: { key: 'value' },
    };

    await service.sendMail(mailOptions);

    expect(sendMailSpy).toHaveBeenCalledWith({
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
      template: mailOptions.template,
    });
  });

  it('should throw an error if emailNotifierService.sendMail fails', async () => {
    const sendMailSpy = jest
      .spyOn(mailerService, 'sendMail')
      .mockImplementation(() => {
        throw new Error('Failed to send email');
      });

    const mailOptions = {
      to: 'test@example.com',
      subject: 'Test Subject',
      template: 'test-template',
      html: '<body></body>',
      context: { key: 'value' },
    };

    await expect(service.sendMail(mailOptions)).rejects.toThrow(
      'Failed to send email',
    );

    expect(sendMailSpy).toHaveBeenCalledWith({
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
      template: mailOptions.template,
    });
  });

  it('should throw an error if "to" is not provided', async () => {
    const mailOptions = {
      to: '',
      subject: 'Test Subject',
      template: 'test-template',
      html: '<body></body>',
      context: { key: 'value' },
    };

    await expect(service.sendMail(mailOptions)).rejects.toThrow(
      'Email recipient "to" is required',
    );
  });

  it('should throw an error if "subject" is not provided', async () => {
    const mailOptions = {
      to: 'test@example.com',
      subject: '',
      template: 'test-template',
      html: '<body></body>',
      context: { key: 'value' },
    };

    await expect(service.sendMail(mailOptions)).rejects.toThrow(
      'Email subject is required',
    );
  });

  it('should throw an error if both "template" and "html" are not provided', async () => {
    const mailOptions = {
      to: 'test@example.com',
      subject: 'Test Subject',
      template: '',
      html: '',
      context: { key: 'value' },
    };

    await expect(service.sendMail(mailOptions)).rejects.toThrow(
      'Email body is required',
    );
  });

  it('should handle empty context', async () => {
    const sendMailSpy = jest.spyOn(mailerService, 'sendMail');

    const mailOptions = {
      to: 'test@example.com',
      subject: 'Test Subject',
      template: 'test-template',
      html: '<body></body>',
      context: {},
    };

    await service.sendMail(mailOptions);

    expect(sendMailSpy).toHaveBeenCalledWith({
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
      template: mailOptions.template,
    });
  });
});
