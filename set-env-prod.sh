#!/bin/bash
export NODE_ENV=production
export USERS_DATABASE_URL=postgresql://incta_owner:3CMFrD9LfkEV@ep-square-lab-a21mu0u6.eu-central-1.aws.neon.tech/incta.users.prod?sslmode=require
echo "USERS_DATABASE_URL is set to: $USERS_DATABASE_URL"
exec "$@"
