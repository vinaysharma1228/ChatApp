# Chat Application

## Overview
This chat application provides a real-time messaging platform with features such as text, image, and voice messaging, user authentication, and message reactions. It is built with a React frontend and a Node.js backend, utilizing WebSockets for real-time communication.

## Features

### Frontend

- **Components**
  - **ChatContainer**: Manages the chat interface, displaying messages, and handling message input.
  - **MessageInput**: Handles text, image, and voice message input, including recording and previewing voice messages.
  - **VoiceMessage**: Plays voice messages with controls for play, pause, and progress tracking.
  - **CompactVoicePlayer**: A simplified player for voice messages.
  - **MessageOptions**: Provides options for message actions like edit, delete, and reply.
  - **MessageReactions**: Displays and manages reactions to messages.
  - **EditMessageModal**: Modal for editing messages.
  - **Sidebar**: Displays a list of users for chat selection.
  - **AuthRoutes**: Manages authentication-related routes.
  - **ChatHeader**, **Navbar**, **NoChatSelected**: UI components for navigation and chat interface.

- **Pages**
  - **LoginPage**, **SignUpPage**: User authentication pages.
  - **ForgotPassword**, **ResetPassword**: Password recovery and reset pages.
  - **HomePage**, **ProfilePage**, **SettingsPage**: Main application pages for user interaction.
  - **AboutUs**, **PrivacyPolicy**, **TermsAndConditions**: Informational pages.

- **State Management**
  - **useChatStore**: Manages chat-related state, including messages, users, and socket connections.
  - **useAuthStore**: Manages authentication state.
  - **useThemeStore**: Manages theme settings.

- **Hooks and Context**
  - **useOutsideClick**: Custom hook for detecting clicks outside a component.
  - **SocketContext**, **MessagesContext**: Context providers for managing socket connections and message state.

- **Utilities**
  - **formatTimestamp**, **authUtils**: Utility functions for formatting and authentication.
  - **axios.js**: Configures Axios for API requests.

### Backend

- **Controllers**
  - **message.controller.js**: Manages message operations, including sending, receiving, and updating message status.
  - **auth.controller.js**: Handles user authentication, including login, signup, and password management.

- **Models**
  - **message.model.js**: Defines the schema for messages.
  - **user.model.js**: Defines the schema for users.

- **Routes**
  - **message.routes.js**: API endpoints for message operations.
  - **auth.routes.js**: API endpoints for authentication operations.

- **Utilities and Libraries**
  - **emailSender.js**: Utility for sending emails.
  - **socket.js**: Manages socket connections for real-time communication.
  - **cloudinary.js**: Configures Cloudinary for file uploads.

- **Middleware**
  - **auth.middleware.js**: Middleware for authentication checks.

- **Templates**
  - **welcomeEmail.hbs**, **forgotPassword.hbs**: Email templates for user notifications.

- **Seeds**
  - **user.seed.js**: Seed data for initializing the database with users.

## Installation

1. Clone the repository.
2. Navigate to the `frontend` and `backend` directories and run `npm install` to install dependencies.
3. Set up environment variables as needed in `.env` files.
4. Run the frontend and backend servers using `npm start`.

## Usage

- Access the application via the frontend URL.
- Log in or sign up to start chatting.
- Use the chat interface to send text, image, and voice messages.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
