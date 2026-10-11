#!/bin/sh
echo "Running databasse migrations..."
npx prisma migrate deploy
echo "Running the dummy university data..."
node src/utility/seedUniversityData.js
echo "Starting server..."
node src/server.js

