# Modular Banking Demo

## 1. What This Application Does

The Modular Banking Demo is a showcase application that demonstrates a modular, microservices-based architecture for modern banking systems. It provides a user-friendly interface for typical banking operations (like Deposits, Lending, and Payments) while revealing the underlying technical services and event streams that power them.

This project is designed for both business and technical audiences, illustrating how a transition from a monolithic to a microservices architecture can be achieved.

## 2. How to Start the Application

This application is fully containerized using Docker. To build and run the application, follow these steps:

**Prerequisites:**
*   Docker and Docker Compose are installed and running on your machine.

**Start Command:**
1.  Navigate to the project's root directory in your terminal.
2.  Run the following command:
    ```bash
    docker-compose up --build -d
    ```
3.  This command will build the single application image (containing both frontend and backend) and start the container in the background.

**Accessing the Application:**
*   Once the container is running, you can access the application by navigating to **[http://localhost:5011](http://localhost:5011)** in your web browser.

## 3. Important: Get Your Environment File

Before you can build and run the container, you **must** obtain the necessary environment configuration file.

*   **Action Required**: Please contact **Temenos** to receive your `.env` file.
*   **Placement**: Place this file in the root directory of the project.

The build process will fail if the `.env` file is not present in the project root. This file contains essential credentials and endpoints for connecting to the banking APIs and event streaming services. 