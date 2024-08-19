import { Module } from '@nestjs/common';
import { databaseProviders } from '../providers/database.providers';
import { sessionProviders } from '../providers/session.provider';

@Module({
  providers: [...databaseProviders, ...sessionProviders],
  exports: [...databaseProviders, ...sessionProviders],
})
export class SchemaModule {}
