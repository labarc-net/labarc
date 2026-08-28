import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggerModule } from 'nestjs-pino'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuditModule } from './audit/audit.module'
import { AuthModule } from './auth/auth.module'
import configuration from './common/config/configuration'
import { envValidationSchema } from './common/config/env.validation'
import { DatabaseModule } from './database/database.module'
import { DepartmentsModule } from './departments/departments.module'
import { EquipmentModule } from './equipment/equipment.module'
import { HealthModule } from './health/health.module'
import { IncidentsModule } from './incidents/incidents.module'
import { InventoryModule } from './inventory/inventory.module'
import { MaintenanceModule } from './maintenance/maintenance.module'
import { MembershipsModule } from './memberships/memberships.module'
import { OperationsModule } from './operations/operations.module'
import { OrganizationsModule } from './organizations/organizations.module'
import { QcModule } from './qc/qc.module'
import { RolesModule } from './roles/roles.module'
import { SupabaseModule } from './supabase/supabase.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    LoggerModule.forRootAsync({
      useFactory: () => ({
        pinoHttp: {
          level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
          transport:
            process.env.NODE_ENV === 'production'
              ? undefined
              : { target: 'pino-pretty', options: { singleLine: true } },
          autoLogging: true,
        },
      }),
    }),
    DatabaseModule,
    SupabaseModule,
    AuditModule,
    AuthModule,
    OrganizationsModule,
    DepartmentsModule,
    MembershipsModule,
    RolesModule,
    OperationsModule,
    QcModule,
    EquipmentModule,
    MaintenanceModule,
    IncidentsModule,
    InventoryModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
