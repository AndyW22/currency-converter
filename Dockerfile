# Use an official Node runtime as the base image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/server/app

# Copy package.json and package-lock.json
COPY ./package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY ./ .

# Build the app
RUN npm run build
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the app
CMD ["npm", "run", "start"]