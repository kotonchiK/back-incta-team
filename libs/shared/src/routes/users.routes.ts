export enum EUsersRoutes {
  users = 'users',
  findUsers = 'find-users',
  createUser = 'create-user',
  findUserByEmail = 'find-user-by-email',
  findUserById = 'find-user-by-id',
  findUsersProviderByEmailOrLogin = 'find-users-provider-by-email-or-login',
  verifyEmailVerificationToken = 'verify-email',
  forgotPassword = 'forgot-password',
  resetPassword = 'reset-password',
  deleteUser = 'delete-user',
}

export enum EUsersParams {
  token = 'token',
  userId = 'user-id',
}
