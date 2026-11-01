import { Global, Module } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { RoleManagementService } from './role-management.service';

@Global()
@Module({
  providers: [PermissionsGuard, RoleManagementService],
  exports: [PermissionsGuard, RoleManagementService],
})
export class AuthorizationModule {}
