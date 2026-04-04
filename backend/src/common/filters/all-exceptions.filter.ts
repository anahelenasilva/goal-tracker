import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (this.isObject(exceptionResponse)) {
        const responseMessage = this.getMessageFromExceptionResponse(exceptionResponse);
        const responseError = this.getStringProperty(exceptionResponse, 'error');
        message = responseMessage ?? message;
        error = responseError ?? error;
      }
    } else if (exception instanceof QueryFailedError) {
      const driverError = this.getDriverError(exception);
      const driverCode = driverError ? this.getStringProperty(driverError, 'code') : undefined;
      const driverMessage = driverError ? this.getStringProperty(driverError, 'message') : undefined;
      const driverDetail = driverError ? this.getStringProperty(driverError, 'detail') : undefined;
      const combinedErrorText = `${driverMessage ?? ''} ${driverDetail ?? ''}`.toLowerCase();
      if (driverCode === '22P02') {
        if (combinedErrorText.includes('uuid')) {
          status = HttpStatus.NOT_FOUND;
          message = 'Resource not found';
          error = 'Not Found';
        } else {
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid request';
          error = 'Bad Request';
        }
      } else {
        message = 'Internal server error';
        this.logger.error(`Unhandled QueryFailedError: ${exception.message}`, exception.stack);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    } else {
      this.logger.error('Unknown exception', exception);
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message: Array.isArray(message) ? message : [message],
    };

    this.logger.error(
      `HTTP ${status} Error: ${JSON.stringify(errorResponse)}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json(errorResponse);
  }

  private isObject(value: unknown): value is object {
    return typeof value === 'object' && value !== null;
  }

  private getStringProperty(value: object, property: string): string | undefined {
    if (!Object.hasOwn(value, property)) {
      return undefined;
    }
    const propertyValue = Reflect.get(value, property);
    return typeof propertyValue === 'string' ? propertyValue : undefined;
  }

  private getMessageFromExceptionResponse(value: object): string | undefined {
    if (!Object.hasOwn(value, 'message')) {
      return undefined;
    }
    const messageValue = Reflect.get(value, 'message');
    if (typeof messageValue === 'string') {
      return messageValue;
    }
    if (Array.isArray(messageValue) && messageValue.every((entry) => typeof entry === 'string')) {
      return messageValue.join(', ');
    }
    return undefined;
  }

  private getDriverError(exception: QueryFailedError): object | undefined {
    if (!Object.hasOwn(exception, 'driverError')) {
      return undefined;
    }
    const driverError = Reflect.get(exception, 'driverError');
    return this.isObject(driverError) ? driverError : undefined;
  }
}
