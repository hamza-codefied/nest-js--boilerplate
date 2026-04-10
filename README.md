# Ecommerce Store API

A NestJS-based ecommerce application with user authentication, product management, and shopping cart functionality. Perfect for learning NestJS best practices!

## 📚 Learning Resources

This project includes **4 comprehensive guides** for learning NestJS:

1. **[LEARNING_GUIDE.md](./LEARNING_GUIDE.md)** - Complete step-by-step guide for beginners
   - NestJS fundamentals and core concepts
   - Project structure and organization
   - Detailed explanations of Modules, Services, Controllers, DTOs, Guards
   - Complete request flow examples
   - ⭐ **START HERE if you're new to NestJS**

2. **[CODE_WALKTHROUGH.md](./CODE_WALKTHROUGH.md)** - Detailed code explanations
   - Every file explained with embedded code comments
   - Schemas, DTOs, Services, Controllers breakdown
   - How authentication and JWT work
   - Database operations with Mongoose
   - Complete flow examples

3. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Visual reference guide
   - Architecture and request lifecycle diagrams
   - Module dependencies diagram
   - API endpoints map
   - Common patterns and decorators reference
   - HTTP status codes and examples
   - **GREAT for quick lookups**

4. **[BEST_PRACTICES.md](./BEST_PRACTICES.md)** - Best practices & common mistakes
   - 10 best practices with examples
   - 10 common mistakes with solutions
   - Debugging tips and code review checklist
   - Security practices

## Features

- User registration and login with JWT authentication
- Product CRUD operations
- Shopping cart management
- MongoDB database with Mongoose
- Input validation with class-validator
- **CORS enabled** - Allows requests from any origin
- Professional NestJS structure with best practices

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables. Create a `.env` file in the root directory:
   ```
   MONGO_URI=mongodb://localhost:27017/ecommerce
   JWT_SECRET=your_jwt_secret_here
   PORT=3000
   ```

4. Start MongoDB locally or update MONGO_URI for your database.

5. Run the application:
   ```bash
   npm run start:dev
   ```

## API Endpoints

### Authentication
- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Login user

### Users (Protected - requires JWT)
- `GET /users` - Get all users

### Products (Public)
- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create a new product
- `PATCH /products/:id` - Update a product
- `DELETE /products/:id` - Delete a product

### Cart (Protected - requires JWT)
- `GET /cart` - Get user's cart
- `POST /cart/add` - Add item to cart
- `PATCH /cart/item/:productId` - Update cart item quantity
- `DELETE /cart/item/:productId` - Remove item from cart
- `DELETE /cart` - Clear cart

## Project Structure

```
src/
├── common/
│   ├── dto/          # Data Transfer Objects (validation)
│   ├── guards/       # Route protectors (JwtAuthGuard)
│   └── schemas/      # MongoDB schemas (User, Product, Cart)
├── modules/
│   ├── auth/         # Authentication (signup, login, JWT)
│   ├── users/        # User management
│   ├── products/     # Product CRUD operations
│   └── cart/         # Shopping cart operations
├── app.controller.ts # Root controller
├── app.module.ts     # Root module
└── main.ts           # Application entry point
```

## Technologies Used

- **NestJS** - Progressive Node.js framework
- **MongoDB** with **Mongoose** - Database
- **JWT (jsonwebtoken)** - Authentication & authorization
- **bcrypt** - Password hashing
- **class-validator** - Input validation
- **class-transformer** - Data transformation
- **TypeScript** - Type safety

## Testing with Postman

Import the `Ecommerce_API.postman_collection.json` file into Postman:

1. Open Postman → Import → Select the JSON file
2. The collection includes:
   - Environment variables for base URL and JWT token
   - Sample requests with proper headers and bodies
   - Automatic token storage after login

### Usage:
1. Set the `{{baseUrl}}` variable (default: http://localhost:3000)
2. Start with **Signup** or **Login** to get a token
3. Token is automatically saved for protected routes
4. Test other endpoints with the token

## Commands
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Commands

```bash
# Development
npm run start:dev          # Start with hot reload (best for learning)
npm run start              # Start server
npm run build              # Build for production
npm run lint               # Lint code
npm run format             # Format code

# Testing
npm run test               # Run unit tests
npm run test:watch        # Run tests in watch mode
npm run test:cov          # Test with coverage report
npm run test:e2e          # Run E2E tests
```

## Learning Path

### For Complete Beginners:

1. **Read the basics** (15 mins)
   - Read [LEARNING_GUIDE.md](./LEARNING_GUIDE.md) → "NestJS Fundamentals" section
   - Understand what Modules, Controllers, Services do

2. **Understand the project** (20 mins)
   - Read [LEARNING_GUIDE.md](./LEARNING_GUIDE.md) → "Project Structure Overview" section
   - Look at the folder structure in your IDE

3. **Deep dive into code** (30 mins)
   - Read [CODE_WALKTHROUGH.md](./CODE_WALKTHROUGH.md) → "1. Schemas (Database Models)" section
   - Read [CODE_WALKTHROUGH.md](./CODE_WALKTHROUGH.md) → "2. DTOs (Data Validation)" section

4. **Learn the flow** (20 mins)
   - Read [CODE_WALKTHROUGH.md](./CODE_WALKTHROUGH.md) → "Complete Request Flow Example"
   - Read [LEARNING_GUIDE.md](./LEARNING_GUIDE.md) → "How API Requests Flow"

5. **Best practices** (20 mins)
   - Read [BEST_PRACTICES.md](./BEST_PRACTICES.md) → "Best Practices" section
   - Read [BEST_PRACTICES.md](./BEST_PRACTICES.md) → "Common Mistakes" section

### For Hands-on Learning:

1. Import Postman collection
2. Signup/Login to test authentication
3. Create some products
4. Add products to cart
5. Check the database in MongoDB Compass
6. Read the relevant code section for what you just tested

### Quick Lookups:

- **"How do I..."** → Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **"What does this code do?"** → Check [CODE_WALKTHROUGH.md](./CODE_WALKTHROUGH.md)
- **"What's the right way to do this?"** → Check [BEST_PRACTICES.md](./BEST_PRACTICES.md)
- **"I don't understand this concept"** → Check [LEARNING_GUIDE.md](./LEARNING_GUIDE.md)

## FAQ

**Q: How do I add authentication to a route?**
A: Use `@UseGuards(JwtAuthGuard)` on the controller. See [CODE_WALKTHROUGH.md](./CODE_WALKTHROUGH.md) section "5. Guards"

**Q: Why do I need DTOs?**
A: DTOs validate input data automatically. See [LEARNING_GUIDE.md](./LEARNING_GUIDE.md) section "DTOs (Data Transfer Objects)"

**Q: How does JWT authentication work?**
A: Read [CODE_WALKTHROUGH.md](./CODE_WALKTHROUGH.md) section "JWT Strategy" and "Complete Request Flow Example"

**Q: How do I query the database?**
A: Use MongoDB queries in services. See [CODE_WALKTHROUGH.md](./CODE_WALKTHROUGH.md) for examples of find(), create(), etc.

**Q: Why do I get "Cannot use import statement outside a module"?**
A: You need to build the project: `npm run build`

**Q: My token is not being stored in Postman**
A: Make sure you're using the Login endpoint, which has a test script to save the token. See Postman collection setup.

## Troubleshooting

**"Cannot connect to MongoDB"**
- Make sure MongoDB is running: `mongod`
- Check MONGO_URI in .env is correct
- Try connecting with MongoDB Compass to verify connection string

**"401 Unauthorized"**
- Make sure you have a valid JWT token
- Token might be expired (tokens last 1 hour by default)
- Get a new token by logging in

**"Validation failed"**
- Your request body doesn't match the DTO requirements
- Check the Postman collection for example payloads
- Read [CODE_WALKTHROUGH.md](./CODE_WALKTHROUGH.md) section "2. DTOs (Data Validation)"

**"CORS error"**
- CORS is enabled for all origins in this project
- Make sure your frontend is making requests to the correct port (default: 3000)
- Check that you're using the correct HTTP method and headers

## Next Steps

After understanding this project:

1. **Add features:**
   - Order management
   - Product reviews and ratings
   - User profile updates
   - Search and filtering

2. **Improve architecture:**
   - Add interceptors for response formatting
   - Add exception filters for better error handling
   - Add middleware for logging

3. **Add testing:**
   - Unit tests for services
   - Integration tests for controllers
   - E2E tests for API flows

4. **Study real projects:**
   - Look at NestJS examples on GitHub
   - Read NestJS documentation
   - Take advanced NestJS courses

## Resources
