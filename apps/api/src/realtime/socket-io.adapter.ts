import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';

// Gateway decorator options cannot read WEB_ORIGIN (env is loaded later), so CORS is set here.
export class RealtimeIoAdapter extends IoAdapter {
  private readonly origin: string;

  constructor(app: INestApplicationContext) {
    super(app);
    this.origin = app.get(ConfigService).get<string>('WEB_ORIGIN', 'http://localhost:5173');
  }

  createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: this.origin },
    } as ServerOptions);
  }
}
