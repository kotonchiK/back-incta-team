import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import fetch from 'node-fetch';
import { RecaptchaGuard } from './recaptcha.guard';

jest.mock('node-fetch');
const { Response } = jest.requireActual('node-fetch');

describe('RecaptchaGuard', () => {
  let guard: RecaptchaGuard;
  let mockExecutionContext: Partial<ExecutionContext>;

  beforeEach(() => {
    guard = new RecaptchaGuard();
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          body: {},
        }),
      }),
    };
  });

  it('should throw UnauthorizedException if reCAPTCHA token is missing', async () => {
    await expect(guard.canActivate(mockExecutionContext as ExecutionContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if reCAPTCHA token is invalid', async () => {
    mockExecutionContext.switchToHttp().getRequest().body.recaptchaToken = 'invalid-token';

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      new Response(JSON.stringify({ success: false }), { status: 200 }),
    );

    await expect(guard.canActivate(mockExecutionContext as ExecutionContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if reCAPTCHA score is too low', async () => {
    mockExecutionContext.switchToHttp().getRequest().body.recaptchaToken = 'low-score-token';

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      new Response(JSON.stringify({ success: true, score: 0.3 }), { status: 200 }),
    );

    await expect(guard.canActivate(mockExecutionContext as ExecutionContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should return true if reCAPTCHA token is valid', async () => {
    mockExecutionContext.switchToHttp().getRequest().body.recaptchaToken = 'valid-token';

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      new Response(JSON.stringify({ success: true, score: 0.9, action: 'submit' }), { status: 200 }),
    );

    await expect(guard.canActivate(mockExecutionContext as ExecutionContext)).resolves.toBe(true);
  });

  it('should throw UnauthorizedException if there is an error during validation', async () => {
    mockExecutionContext.switchToHttp().getRequest().body.recaptchaToken = 'error-token';

    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'));

    await expect(guard.canActivate(mockExecutionContext as ExecutionContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should call validateRecaptchaToken with the correct token', async () => {
    const validateRecaptchaTokenSpy = jest.spyOn(guard as any, 'validateRecaptchaToken');
    mockExecutionContext.switchToHttp().getRequest().body.recaptchaToken = 'test-token';

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      new Response(JSON.stringify({ success: true, score: 0.9, action: 'submit' }), { status: 200 }),
    );

    await guard.canActivate(mockExecutionContext as ExecutionContext);
    expect(validateRecaptchaTokenSpy).toHaveBeenCalledWith('test-token');
  });

  it('should throw UnauthorizedException if reCAPTCHA action is not "submit"', async () => {
    mockExecutionContext.switchToHttp().getRequest().body.recaptchaToken = 'wrong-action-token';

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      new Response(JSON.stringify({ success: true, score: 0.9, action: 'wrong-action' }), { status: 200 }),
    );

    await expect(guard.canActivate(mockExecutionContext as ExecutionContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if API response is malformed', async () => {
    mockExecutionContext.switchToHttp().getRequest().body.recaptchaToken = 'malformed-response-token';

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      new Response(JSON.stringify({ unexpectedField: true }), { status: 200 }),
    );

    await expect(guard.canActivate(mockExecutionContext as ExecutionContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if reCAPTCHA score is missing', async () => {
    mockExecutionContext.switchToHttp().getRequest().body.recaptchaToken = 'no-score-token';

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      new Response(JSON.stringify({ success: true, action: 'submit' }), { status: 200 }),
    );

    await expect(guard.canActivate(mockExecutionContext as ExecutionContext)).rejects.toThrow(UnauthorizedException);
  });
});
