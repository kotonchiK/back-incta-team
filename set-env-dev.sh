#!/bin/bash
export NODE_ENV=development
export USERS_DATABASE_URL=postgresql://incta_dev_owner:GTRFeK6DAE8x@ep-square-lab-a21mu0u6.eu-central-1.aws.neon.tech/incta.users.dev?sslmode=require
exec "$@"
