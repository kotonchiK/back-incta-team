export enum EDbEntityFields {
  id = 'id',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
}

export interface IDbEntity {
  [EDbEntityFields.id]: string;
  [EDbEntityFields.createdAt]?: Date;
  [EDbEntityFields.updatedAt]?: Date;
}
