export class AppRpcErrorFormatter {
  static format(error: any): Record<string, any> {
    const formattedError: Record<string, any> = {
      message: error.message || 'An unknown error occurred',
      code: 'Unknown server error',
      status: '500',
      response: {},
    };

    if (error instanceof Error) {
      formattedError.name = error.name;
      formattedError.stack = error.stack;
    }

    if (error.response) {
      formattedError.response = error.response;
    }

    if (error.code) {
      formattedError.code = error.code;
    }
    if (error.status) {
      formattedError.status = error.status;
    }

    if (error instanceof TypeError) {
      formattedError.code = 'TYPE_ERROR';
    } else if (error.name === 'ValidationError') {
      formattedError.code = 'VALIDATION_ERROR';
      formattedError.details = error.details;
    } else if (error.name === 'BSONError') {
      formattedError.code = 'BSON_ERROR';
    }

    return formattedError;
  }
}
