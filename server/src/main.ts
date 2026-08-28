import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  app.useLogger(app.get(Logger))

  const config = app.get(ConfigService)

  app.enableCors({
    origin: config.get<string>('app.corsOrigin'),
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.useGlobalFilters(new HttpExceptionFilter())

  app.setGlobalPrefix('api')

  const port = config.get<number>('app.port') ?? 4000
  await app.listen(port)

  app.get(Logger).log(`LabArc API listening on http://localhost:${port}/api`)
}

bootstrap()
