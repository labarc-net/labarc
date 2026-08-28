import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { TenantGuard } from '../common/guards/tenant.guard'
import { PERMISSION_KEYS } from '../common/security/permissions.constants'
import { AddTimelineNoteDto } from './dto/add-timeline-note.dto'
import { CreateIncidentDto } from './dto/create-incident.dto'
import { UpdateIncidentDto } from './dto/update-incident.dto'
import { IncidentsService } from './incidents.service'

@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('organizations/:organizationId/incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @RequirePermissions(PERMISSION_KEYS.INCIDENTS_READ)
  @Get()
  list(
    @Param('organizationId') organizationId: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: 'open' | 'investigating' | 'capa' | 'resolved' | 'closed',
    @Query('severity') severity?: 'low' | 'moderate' | 'high' | 'critical',
    @Query('equipmentId') equipmentId?: string,
  ) {
    return this.incidentsService.list(organizationId, { departmentId, status, severity, equipmentId })
  }

  @RequirePermissions(PERMISSION_KEYS.INCIDENTS_READ)
  @Get(':incidentId')
  get(@Param('organizationId') organizationId: string, @Param('incidentId') incidentId: string) {
    return this.incidentsService.getById(organizationId, incidentId)
  }

  @RequirePermissions(PERMISSION_KEYS.INCIDENTS_MANAGE)
  @Post()
  create(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateIncidentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidentsService.create(organizationId, dto, user)
  }

  @RequirePermissions(PERMISSION_KEYS.INCIDENTS_MANAGE)
  @Patch(':incidentId')
  update(
    @Param('organizationId') organizationId: string,
    @Param('incidentId') incidentId: string,
    @Body() dto: UpdateIncidentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidentsService.update(organizationId, incidentId, dto, user)
  }

  @RequirePermissions(PERMISSION_KEYS.INCIDENTS_MANAGE)
  @Post(':incidentId/timeline')
  addNote(
    @Param('organizationId') organizationId: string,
    @Param('incidentId') incidentId: string,
    @Body() dto: AddTimelineNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidentsService.addNote(organizationId, incidentId, dto, user)
  }
}
