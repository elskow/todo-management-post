import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { compressionConfig } from './config/compression.config';
import * as compression from 'compression';
import { Server } from 'http';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    let server: Server;
    let isShuttingDown = false;

    // Enable shutdown hooks
    app.enableShutdownHooks();

    app.enableCors();
    app.use(compression(compressionConfig));

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    const config = new DocumentBuilder()
      .setTitle('Social Media Post Management API')
      .setDescription('API for managing social media post tasks')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = process.env.PORT || 3000;
    server = await app.listen(port);

    // Graceful shutdown handling
    const signals = ['SIGTERM', 'SIGINT'];

    async function shutdown(signal: string) {
      if (isShuttingDown) {
        return;
      }
      isShuttingDown = true;

      Logger.log(
        `Received ${signal}, starting graceful shutdown...`,
        'Bootstrap',
      );

      try {
        // Stop accepting new requests
        server.close(() => {
          Logger.log('HTTP server closed', 'Bootstrap');
        });

        // Wait for existing requests to finish (adjust timeout as needed)
        const forceShutdownTimeout = setTimeout(() => {
          Logger.error(
            'Could not close connections in time, forcefully shutting down',
            'Bootstrap',
          );
          process.exit(1);
        }, 30000);

        // Close NestJS application
        await app.close();
        clearTimeout(forceShutdownTimeout);

        Logger.log('Application closed successfully', 'Bootstrap');
        process.exit(0);
      } catch (error) {
        Logger.error(`Error during graceful shutdown: ${error}`, 'Bootstrap');
        process.exit(1);
      }
    }

    for (const signal of signals) {
      process.on(signal, () => shutdown(signal));
    }

    // Unhandled rejection and exception handlers
    process.on('unhandledRejection', (reason, promise) => {
      Logger.error(
        `Unhandled Rejection at: ${promise}, reason: ${reason}`,
        'Bootstrap',
      );
    });

    process.on('uncaughtException', (error) => {
      Logger.error(`Uncaught Exception: ${error}`, 'Bootstrap');
      process.exit(1);
    });

    Logger.log(
      `Application is running on: http://localhost:${port}`,
      'Bootstrap',
    );
    Logger.log(
      `Swagger documentation is available at: http://localhost:${port}/api`,
      'Bootstrap',
    );
  } catch (error) {
    Logger.error(`Error starting the application: ${error}`, 'Bootstrap');
    process.exit(1);
  }
}

bootstrap();
