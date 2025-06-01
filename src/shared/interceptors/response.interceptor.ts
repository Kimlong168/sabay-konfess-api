import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SUCCESS_MESSAGES } from '../constants/response-messages';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((x) => ({
        success: true,
        message: x.message || SUCCESS_MESSAGES.DEFAULT,
        data: x.data,
      })),
    );
  }
}
