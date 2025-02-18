import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { compressionConfig } from './config/compression.config';
import * as compression from 'compression';
import { Server } from 'http';
import { MetricsService } from './common/metrics/metrics.service';
import { MetricsInterceptor } from './common/metrics/metrics.interceptor';
import { ShutdownService } from './common/shutdown.service';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    let server: Server;

    const metricsService = app.get(MetricsService);
    const shutdownService = app.get(ShutdownService);

    app.useGlobalInterceptors(new MetricsInterceptor(metricsService));

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
    shutdownService.setServer(server);

    // Graceful shutdown handling
    const signals = ['SIGTERM', 'SIGINT'];
    for (const signal of signals) {
      process.on(signal, () => {
        Logger.log(`Received ${signal}, initiating shutdown...`, 'Bootstrap');
        app.close();
      });
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
