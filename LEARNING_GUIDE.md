# NestJS Ecommerce Application - Complete Learning Guide

This guide explains everything built in this ecommerce application, perfect for learning NestJS from scratch.

---

## Table of Contents
1. [NestJS Fundamentals](#nestjs-fundamentals)
2. [Project Structure Overview](#project-structure-overview)
3. [Core Concepts Used](#core-concepts-used)
4. [Step-by-Step Explanation](#step-by-step-explanation)
5. [How API Requests Flow](#how-api-requests-flow)

---

## NestJS Fundamentals

### What is NestJS?
NestJS is a framework for building efficient, scalable Node.js server-side applications. It uses TypeScript and is built on top of Express.js.

### Key NestJS Concepts:

**1. Modules**
- Think of modules as feature bundles
- A module groups related components (controllers, services, etc.)
- Example: `AuthModule` contains all authentication-related logic

**2. Controllers**
- Handle incoming HTTP requests
- Decorated with `@Controller()`
- Define routes using decorators like `@Get()`, `@Post()`, etc.

**3. Services**
- Contains business logic
- Decorated with `@Injectable()`
- Used for database operations, data processing, etc.

**4. Decorators**
- Metadata markers for classes and methods
- Examples: `@Module()`, `@Controller()`, `@Injectable()`, `@Get()`

**5. Providers**
- Services and other utilities injected into controllers/services
- Managed by NestJS dependency injection container

**6. Guards**
- Middleware that protect routes
- Example: `JwtAuthGuard` to protect authenticated routes

---

## Project Structure Overview

```
src/
├── common/                    # Shared code across modules
│   ├── dto/                  # Data Transfer Objects (validation)
│   │   ├── auth.dto.ts       # Auth request/response models
│   │   ├── product.dto.ts    # Product validation models
│   │   └── cart.dto.ts       # Cart validation models
│   ├── guards/               # Route protectors
│   │   └── jwt-auth.guard.ts # JWT authentication guard
│   └── schemas/              # Database models
│       ├── user.schema.ts    # User database model
│       ├── product.schema.ts # Product database model
│       └── cart.schema.ts    # Cart database model
├── modules/                  # Feature modules
│   ├── auth/                 # Authentication feature
│   │   ├── auth.service.ts   # Auth business logic
│   │   ├── auth.controller.ts # Auth routes
│   │   ├── auth.module.ts    # Auth module setup
│   │   └── jwt.strategy.ts   # JWT strategy for passport
│   ├── users/                # User management feature
│   ├── products/             # Product management feature
│   └── cart/                 # Shopping cart feature
├── app.module.ts             # Root module
├── app.controller.ts         # Root controller
└── main.ts                   # Application entry point
```

---

## Core Concepts Used

### 1. DTOs (Data Transfer Objects)
**Purpose:** Validate incoming data and define response structure

```typescript
// Example from auth.dto.ts
export class SignupDto {
  @IsEmail()  // Decorator to validate email format
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @MinLength(6)  // Password must be at least 6 characters
  password: string;
}
```

**Why?** Ensures only valid data enters your system and auto-transforms data types.

---

### 2. Schemas (MongoDB Models)
**Purpose:** Define database structure using Mongoose

```typescript
// Example from user.schema.ts
@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

**Why?** Tells MongoDB what fields a User should have and their types/constraints.

---

### 3. Services (Business Logic)
**Purpose:** Handle all database operations and business logic

```typescript
// Example from users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }
}
```

**Why?** Separates business logic from HTTP routing, making code reusable and testable.

---

### 4. Controllers (Route Handlers)
**Purpose:** Define HTTP routes and call services

```typescript
// Example from users.controller.ts
@Controller('users')
@UseGuards(JwtAuthGuard)  // Protection: only authenticated users
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}
```

**Why?** Separates route handling from business logic, keeps code clean.

---

### 5. Guards (Route Protection)
**Purpose:** Protect routes from unauthorized access

```typescript
// Example from jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**Usage:** Added to controllers/routes with `@UseGuards(JwtAuthGuard)`

**Why?** Only allows authenticated users to access protected routes.

---

### 6. Modules (Feature Organization)
**Purpose:** Group related components together

```typescript
// Example from auth.module.ts
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({...}),
    MongooseModule.forFeature([...])
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService]  // Make available to other modules
})
export class AuthModule {}
```

**Why?** Keeps code organized, makes features reusable and maintainable.

---

## Step-by-Step Explanation

### Step 1: User Signup Process

**File Structure:**
```
auth.controller.ts → auth.service.ts → user.schema.ts → MongoDB
```

**Code Flow:**

1. **Frontend sends POST request:**
```json
POST /auth/signup
{
  "email": "user@example.com",
  "name": "John",
  "password": "password123"
}
```

2. **Controller receives it:**
```typescript
@Controller('auth')
export class AuthController {
  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }
}
```

- `@Post('signup')` - Listens to POST requests at `/auth/signup`
- `@Body()` - Extracts JSON body
- `signupDto: SignupDto` - Validates against DTO (email format, password length, etc.)

3. **Service processes the logic:**
```typescript
async signup(signupDto: SignupDto): Promise<{ access_token: string }> {
  const { email, password, name } = signupDto;

  // Check if user already exists
  const existingUser = await this.userModel.findOne({ email });
  if (existingUser) {
    throw new UnauthorizedException('User already exists');
  }

  // Hash password using bcrypt
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create new user in MongoDB
  const user = new this.userModel({ email, password: hashedPassword, name });
  await user.save();

  // Generate JWT token
  const payload = { email: user.email, sub: user._id };
  return {
    access_token: this.jwtService.sign(payload)
  };
}
```

**What happens:**
- Validates user doesn't exist
- Hashes password (never store plain text!)
- Saves to MongoDB
- Generates JWT token
- Returns token to frontend

---

### Step 2: User Login Process

**Similar flow:**
```
POST /auth/login → Check credentials → Generate token → Return token
```

**Key difference:**
- Instead of creating new user, we verify existing user
- Compare submitted password with hashed password in DB
- Generate and return token

```typescript
async login(loginDto: LoginDto): Promise<{ access_token: string }> {
  const { email, password } = loginDto;

  // Find user by email
  const user = await this.userModel.findOne({ email });
  
  // Verify password matches hashed password in DB
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // Generate token
  const payload = { email: user.email, sub: user._id };
  return { access_token: this.jwtService.sign(payload) };
}
```

---

### Step 3: JWT Authentication (Token Verification)

**How it works:**

1. **Frontend sends request with token:**
```
GET /cart
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

2. **JWT Strategy extracts and verifies token:**
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET')
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

- Extracts token from "Bearer ..." header
- Verifies token signature using JWT_SECRET
- If valid, adds user data to request object

3. **Guard checks authentication:**
```typescript
@Controller('cart')
@UseGuards(JwtAuthGuard)  // Only authenticated users allowed
export class CartController {
  @Get()
  getCart(@Request() req) {
    // req.user contains { userId, email }
    return this.cartService.getCart(req.user.userId);
  }
}
```

---

### Step 4: Product Management

**Get all products (no authentication needed):**
```typescript
@Controller('products')
export class ProductsController {
  @Get()
  findAll() {
    return this.productsService.findAll();
  }
}
```

**Create product:**
```typescript
@Post()
create(@Body() createProductDto: CreateProductDto) {
  return this.productsService.create(createProductDto);
}
```

**Service logic:**
```typescript
@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = new this.productModel(createProductDto);
    return product.save();
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  async findOne(id: string): Promise<Product | null> {
    return this.productModel.findById(id).exec();
  }
}
```

---

### Step 5: Shopping Cart

**Add to cart (protected route):**
```
POST /cart/add
Authorization: Bearer <token>
{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 2
}
```

**Service logic:**
```typescript
async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
  const { productId, quantity } = addToCartDto;

  // Verify product exists
  const product = await this.productModel.findById(productId);
  if (!product) {
    throw new NotFoundException('Product not found');
  }

  // Find or create cart for user
  let cart = await this.cartModel.findOne({ user: userId });
  if (!cart) {
    cart = new this.cartModel({ user: userId, items: [] });
  }

  // Check if product already in cart
  const existingItem = cart.items.find(
    item => item.product.toString() === productId
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;  // Increase quantity
  } else {
    cart.items.push({ product: new Types.ObjectId(productId), quantity });
  }

  cart.updatedAt = new Date();
  return cart.save().then(savedCart => savedCart.populate('items.product'));
}
```

**Why `.populate()`?**
```
Without populate: { product: ObjectId("...") }
With populate: { product: { _id: "...", name: "...", price: 29.99 } }
```
It replaces the ID with actual product data from database.

---

## How API Requests Flow

### Complete Flow for Adding Product to Cart

```
1. Frontend sends request
   POST /cart/add
   Headers: Authorization: Bearer <JWT_TOKEN>
   Body: { productId: "123", quantity: 2 }

2. Express receives request
   ↓

3. NestJS pipes validate @Body()
   - Checks if productId is valid MongoDB ID
   - Checks if quantity >= 1
   - If invalid, returns 400 error
   ↓

4. JwtAuthGuard executes
   - Extracts "Bearer <TOKEN>" from header
   - Verifies signature matches JWT_SECRET
   - If invalid, returns 401 Unauthorized
   - If valid, adds user data to request object
   ↓

5. CartController method executes
   @Post('add')
   addToCart(@Request() req, @Body() addToCartDto)
   - req.user contains { userId, email }
   - addToCartDto contains { productId, quantity }
   ↓

6. CartService.addToCart() called
   - Queries MongoDB for product
   - Queries MongoDB for user's cart
   - Updates cart in database
   - Populates product details
   ↓

7. Response sent to frontend
   { user: "...", items: [...], updatedAt: "..." }
   Status: 201 Created
```

---

## Dependency Injection Explained

**What is it?**
Instead of creating instances manually, NestJS injects them automatically.

**Example:**
```typescript
// DON'T do this (manual creation)
export class CartService {
  private cartModel = new Model();  // Manual
}

// DO this (dependency injection)
@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>
  ) {}
}
```

**Why?**
- Makes testing easier (can inject mock models)
- Cleaner code
- NestJS manages instances automatically
- Follows SOLID principles

---

## Environment Variables

**Why use `.env`?**
- Different configs for development, testing, production
- Never commit secrets to git
- Easy to change without code changes

**In this project:**
```
.env:
PORT=3000
MONGO_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=supersecretkey

Usage in code:
configService.get<string>('JWT_SECRET')
process.env.MONGO_URI
```

---

## Validation with class-validator

**DTOs validate automatically:**

```typescript
export class SignupDto {
  @IsEmail()  // Must be valid email format
  email: string;

  @IsString()  // Must be string
  @IsNotEmpty()  // Cannot be empty
  name: string;

  @IsString()
  @MinLength(6)  // Minimum 6 characters
  password: string;
}
```

**When used:**
```typescript
@Post('signup')
async signup(@Body() signupDto: SignupDto) { }
```

If validation fails, NestJS automatically returns:
```json
{
  "message": ["email must be an email", "password must be longer than 6 characters"],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## Key Takeaways for Learning NestJS

1. **Modular Structure** - Organize features into separate modules
2. **Separation of Concerns** - Controllers handle routes, Services handle logic
3. **DTOs** - Always validate input data
4. **Guards** - Protect sensitive routes with authentication
5. **Dependency Injection** - Let NestJS manage instances
6. **TypeScript** - Type safety prevents many bugs
7. **Async/Await** - Always use for database operations
8. **Error Handling** - Use NestJS exceptions (NotFoundException, UnauthorizedException, etc.)

---

## Next Steps

1. **Add more features:**
   - Order management
   - Payment integration
   - Product reviews

2. **Add testing:**
   - Unit tests for services
   - E2E tests for API endpoints

3. **Add documentation:**
   - Swagger/OpenAPI integration
   - API documentation

4. **Improve security:**
   - Rate limiting
   - Input sanitization
   - CORS configuration

---

## Common NestJS Decorators Reference

```typescript
@Module()           // Defines a module
@Controller()       // Defines a controller
@Injectable()       // Marks class as provider
@Get()              // GET request
@Post()             // POST request
@Patch()            // PATCH request
@Delete()           // DELETE request
@Body()             // Extract request body
@Param()            // Extract URL parameters
@Query()            // Extract query parameters
@Headers()          // Extract headers
@Request()          // Access Express request object
@UseGuards()        // Apply guard to route
@Prop()             // Define schema property
@Schema()           // Define MongoDB schema
@InjectModel()      // Inject Mongoose model
@IsEmail()          // Validate email format
@IsNotEmpty()       // Validate not empty
@MinLength()        // Validate minimum length
```

---

This guide covers everything in the ecommerce API. Feel free to ask questions about any specific part!
