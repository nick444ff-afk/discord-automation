#!/bin/bash

if [ "$NODE_ENV" = "production" ]; then
  echo "[Start Script] Running database migrations..."
  pnpm install # Ensure dependencies are installed, including tsx
  pnpm run migrate
  if [ $? -ne 0 ]; then
    echo "[Start Script] Database migrations failed. Exiting."
    exit 1
  fi
  echo "[Start Script] Database migrations completed."
fi

echo "[Start Script] Starting server..."
pnpm install # Ensure dependencies are installed for the server
pnpm run start
