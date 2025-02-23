# Stage 1: Build
FROM node:16 AS build

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code to the container
COPY . .

# Install TypeScript globally
RUN npm install -g typescript

# Compile TypeScript to JavaScript
RUN tsc

# Stage 2: Run
FROM node:16 AS production

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy only the compiled JavaScript files and package.json to the new image
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Expose the port your app runs on (default for Probot is 3000)
EXPOSE 3000

# Command to run your app
CMD ["node", "dist/main.js"]
