# 1. Use an official Node.js runtime as the base image
FROM node:20-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package.json and package-lock.json first (for better caching)
COPY package*.json ./

# 4. Install dependencies
RUN npm install --omit=dev

# 5. Copy the entire project (excluding files in .dockerignore)
COPY . .

# 6. Generate Prisma client
RUN npx prisma generate

# 7. Expose the port your app runs on
EXPOSE 3001

# 8. Set environment variables (Optional: Override in Kubernetes)
ENV PORT=3001
ENV NODE_ENV=production

# 9. Run the application
CMD ["npm", "run", "start"]
