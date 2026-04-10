# NestJS Quick Reference & Visual Diagrams

Quick lookup guide with diagrams for common NestJS patterns.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Frontend)                         │
│              (React, Vue, Angular, etc.)                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP Request
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS SERVER                            │
│                  (Managed by NestJS)                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  Guards  │ │ Pipes    │ │ Filters  │
        │(Auth)    │ │(Validate)│ │ (Error)  │
        └──────────┘ └──────────┘ └──────────┘
                            │
                            ▼
        ┌─────────────────────────────────┐
        │  CONTROLLER                     │
        │  (Route Handler)                │
        │  ProductsController             │
        └──────────────┬──────────────────┘
                       │ Calls
                       ▼
        ┌─────────────────────────────────┐
        │  SERVICE                        │
        │  (Business Logic)               │
        │  ProductsService                │
        └──────────────┬──────────────────┘
                       │ Queries
                       ▼
        ┌─────────────────────────────────┐
        │  REPOSITORY/MODEL               │
        │  (Database Queries)             │
        │  @InjectModel(Product)          │
        └──────────────┬──────────────────┘
                       │
                       ▼
        ┌─────────────────────────────────┐
        │  MONGODB                        │
        │  (Database)                     │
        └─────────────────────────────────┘
```

---

## Request Lifecycle Diagram

```
HTTP Request arrives
        │
        ▼
┌──────────────────────────────┐
│ MIDDLEWARE (CORS, Logger)    │
└──────────────────┬───────────┘
                   │
                   ▼
┌──────────────────────────────┐
│ GUARDS (@UseGuards)          │
│ - JwtAuthGuard               │
│ - Check authentication       │
│ - If fails: 401/403          │
└──────────────────┬───────────┘
                   │
                   ▼
┌──────────────────────────────┐
│ PIPES (@Body validation)     │
│ - Validate input             │
│ - Transform types            │
│ - If fails: 400 Bad Request  │
└──────────────────┬───────────┘
                   │
                   ▼
┌──────────────────────────────┐
│ CONTROLLER METHOD            │
│ @Post('products')            │
│ create(dto)                  │
└──────────────────┬───────────┘
                   │
                   ▼
┌──────────────────────────────┐
│ SERVICE METHOD               │
│ this.service.create(dto)     │
│ Database queries here        │
└──────────────────┬───────────┘
                   │
                   ▼
┌──────────────────────────────┐
│ RETURN RESPONSE              │
│ { id: "...", name: "..." }   │
│ Status: 201 Created          │
└──────────────────────────────┘
```

---

## Module Dependencies Diagram

```
                 ┌─────────────────┐
                 │   App Module    │ (ROOT)
                 └────────┬────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
    ┌────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Auth Mod   │  │ Products Mod │  │ Cart Mod     │
    ├────────────┤  ├──────────────┤  ├──────────────┤
    │ Service    │  │ Service      │  │ Service      │
    │ Controller │  │ Controller   │  │ Controller   │
    │ Guard      │  │              │  │ Guard        │
    │ Strategy   │  │              │  │ (JWT)        │
    └────────────┘  └──────────────┘  └──────────────┘
```

---

## API Endpoints Map

```
┌─ /auth
│  ├─ POST /signup
│  │  Input: { email, name, password }
│  │  Output: { access_token }
│  │
│  └─ POST /login
│     Input: { email, password }
│     Output: { access_token }
│
├─ /products (PUBLIC)
│  ├─ GET / → Get all products
│  ├─ GET /:id → Get single product
│  ├─ POST / → Create product
│  ├─ PATCH /:id → Update product
│  └─ DELETE /:id → Delete product
│
├─ /users (PROTECTED)
│  └─ GET / → Get all users
│     Required: Authorization: Bearer <token>
│
└─ /cart (PROTECTED)
   ├─ GET / → Get user's cart
   ├─ POST /add → Add item to cart
   ├─ PATCH /item/:productId → Update quantity
   ├─ DELETE /item/:productId → Remove item
   └─ DELETE / → Clear cart
   All require: Authorization: Bearer <token>
```

---

## Data Flow Examples

### 1. User Registration Flow

```
Frontend                        NestJS Backend              MongoDB
   │                                 │                         │
   │──POST /auth/signup           │                         │
   │  {email, name, password}      │                         │
   │                               │                         │
   │                    @Post('signup')                      │
   │                    ↓                                    │
   │                    AuthController                       │
   │                    ↓                                    │
   │                    ValidationPipe                       │
   │                    ✓ Validates DTO                      │
   │                    ↓                                    │
   │                    AuthService.signup()                 │
   │                    ├─ Hash password                     │
   │                    ├─ Check if exists ────────────────→│
   │                    │                      find({email}) │
   │                    │←────────────────────────────────────│
   │                    │                      { exists: false }
   │                    ├─ Create user ────────────────────→│
   │                    │      save({email, hashedPassword})│
   │                    │←────────────────────────────────────│
   │                    │                    { _id: "..." }  │
   │                    ├─ Sign JWT token                    │
   │                    └─ Return token                      │
   │←────────────────────────────────────────────────────────│
   │  { access_token: "eyJ..." }                            │
   │                                                         │
```

### 2. Adding Product to Cart Flow

```
Frontend                        NestJS Backend              MongoDB
   │                                 │                         │
   │──POST /cart/add              │                         │
   │  Header: Authorization        │                         │
   │  Body: {productId, quantity}  │                         │
   │                               │                         │
   │                    JwtAuthGuard                         │
   │                    ├─ Extract token                     │
   │                    ├─ Verify signature                  │
   │                    └─ Set req.user                      │
   │                    ↓                                    │
   │                    ValidationPipe                       │
   │                    ✓ Validates DTO                      │
   │                    ↓                                    │
   │                    CartController                       │
   │                    ↓                                    │
   │                    CartService.addToCart()             │
   │                    ├─ Check product exists ───────────→│
   │                    │                    find({_id})     │
   │                    │←───────────────────────────────────│
   │                    │              { name, price, ...}   │
   │                    ├─ Get user's cart ─────────────────→│
   │                    │                find({user})        │
   │                    │←───────────────────────────────────│
   │                    │              { items: [...] }      │
   │                    ├─ Add/update item                   │
   │                    ├─ Save cart ──────────────────────→│
   │                    │              save()                │
   │                    │←───────────────────────────────────│
   │                    │          { _id, user, items, ... } │
   │                    └─ Populate products                 │
   │                    (Replace product IDs with data)      │
   │←───────────────────────────────────────────────────────│
   │  { _id, user, items: [{product: {...}, qty: 2}], ... }│
```

---

## Decorators Reference

### Route Decorators
```typescript
@Controller('route')        // Define route prefix
@Get()                      // GET method
@Post()                     // POST method
@Patch()                    // PATCH method (partial update)
@Put()                      // PUT method (full update)
@Delete()                   // DELETE method
@Head()                     // HEAD method
@Options()                  // OPTIONS method
```

### Parameter Decorators
```typescript
@Body()           // Get request body
@Param('id')      // Get URL parameter
@Query('filter')  // Get query string
@Headers('auth')  // Get header
@Request()        // Get Express request
@Response()       // Get Express response
```

### Module Decorators
```typescript
@Module()         // Define module
@Injectable()     // Mark as provider
@Controller()     // Mark as controller
@Catch()          // Error handler
```

### Validation Decorators
```typescript
@IsEmail()        // Validate email
@IsString()       // Must be string
@IsNumber()       // Must be number
@IsNotEmpty()     // Cannot be empty
@MinLength(n)     // Min length
@MaxLength(n)     // Max length
@Min(n)           // Min value
@Max(n)           // Max value
@IsOptional()     // Field is optional
```

### Database Decorators
```typescript
@Schema()                          // Mongoose schema
@Prop()                           // Schema property
@InjectModel(Model.name)          // Inject model
@Prop({ ref: 'OtherModel' })     // Reference another model
```

### Protection Decorators
```typescript
@UseGuards(GuardClass)     // Apply guard
@UseInterceptors(...)      // Apply interceptor
@UseFilters(...)           // Apply filter
@SetMetadata('role', 'admin')  // Set metadata
```

---

## HTTP Status Codes Used

```
200 OK                  - Successful GET/PATCH/PUT
201 Created            - Success POST (resource created)
400 Bad Request        - Validation error in input
401 Unauthorized       - Missing/invalid JWT token
403 Forbidden          - Authenticated but no permission
404 Not Found          - Resource doesn't exist
500 Internal Error     - Server error
```

---

## Common Patterns

### Pattern 1: Service Injection
```typescript
@Injectable()
export class AService {
  constructor(private bService: BService) {}
  // ↑ NestJS automatically injects BService
  
  someMethod() {
    this.bService.doSomething();  // Use injected service
  }
}
```

### Pattern 2: Conditional Response
```typescript
@Get(':id')
async findOne(@Param('id') id: string) {
  const product = await this.service.findOne(id);
  if (!product) {
    throw new NotFoundException('Product not found');
  }
  return product;
}
```

### Pattern 3: Populate Related Data
```typescript
// Without populate
{ product: ObjectId("507f...") }

// With populate
const cart = await this.cartModel
  .findOne({user: userId})
  .populate('items.product')  // ← Replaces ObjectId with data
  .exec();
// Result: { product: { _id: "...", name: "...", price: 29.99 } }
```

### Pattern 4: Update Only Changed Fields
```typescript
// Merge changes with existing object
await this.model.findByIdAndUpdate(
  id,
  { name: 'New Name' },  // Only update name
  { new: true }           // Return updated document
);
```

### Pattern 5: Array Operations
```typescript
// Add to array
cart.items.push(newItem);

// Update in array
const item = cart.items.find(i => i.id === itemId);
if (item) item.quantity = 5;

// Remove from array
cart.items = cart.items.filter(i => i.id !== itemId);
```

---

## DTO Validation Examples

### Simple Validation
```typescript
export class CreateProductDto {
  @IsString()
  name: string;
}
// Valid: { name: "iPhone" }
// Invalid: { name: 123 }, { name: "" }
```

### Complex Validation
```typescript
export class SignupDto {
  @IsEmail()
  email: string;
  
  @IsString()
  @MinLength(6)
  @Matches(/[A-Z]/)  // Must contain uppercase
  password: string;
}
// Valid: { email: "user@example.com", password: "Password1" }
// Invalid: { email: "invalid", password: "short" }
```

### Optional Fields
```typescript
export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;
  
  @IsNumber()
  @IsOptional()
  price?: number;
}
// Valid: { name: "New Name" }
// Valid: { price: 99.99 }
// Valid: { name: "New Name", price: 99.99 }
// Valid: {} (empty - all optional)
```

---

## Environment Variables Usage

### .env file
```
DATABASE_URL=mongodb://localhost:27017/mydb
JWT_SECRET=my_secret_key_123
PORT=3000
NODE_ENV=development
```

### Access in Code
```typescript
import { ConfigService } from '@nestjs/config';

export class MyService {
  constructor(private config: ConfigService) {}
  
  doSomething() {
    const dbUrl = this.config.get<string>('DATABASE_URL');
    const port = this.config.get<number>('PORT');
    // Environment variables with type safety
  }
}
```

---

## Error Handling Examples

### Throw Errors
```typescript
if (!user) {
  throw new NotFoundException('User not found');
  // Returns: 404 with error message
}

if (!isValid) {
  throw new BadRequestException('Invalid input');
  // Returns: 400 with error message
}

if (!hasPermission) {
  throw new ForbiddenException('Access denied');
  // Returns: 403 with error message
}

if (!credentials) {
  throw new UnauthorizedException('Not logged in');
  // Returns: 401 with error message
}
```

### Handle with Try-Catch
```typescript
async someMethod() {
  try {
    const result = await this.service.doSomething();
    return result;
  } catch (error) {
    throw new InternalServerErrorException('Something went wrong');
  }
}
```

---

## Testing Checklist

```
□ POST /auth/signup - Create new user
□ POST /auth/login - Get token
□ GET /products - Get all products
□ POST /products - Create product
□ GET /products/:id - Get single product
□ PATCH /products/:id - Update product
□ DELETE /products/:id - Delete product
□ GET /users - Get users (protected)
□ GET /cart - Get cart (protected)
□ POST /cart/add - Add to cart (protected)
□ PATCH /cart/item/:id - Update quantity (protected)
□ DELETE /cart/item/:id - Remove item (protected)
□ DELETE /cart - Clear cart (protected)

Test error cases:
□ Invalid email format
□ Password too short
□ User already exists
□ User not found
□ Missing authorization token
□ Expired token
□ Product not found
□ Invalid product ID
```

---

## Quick Command Reference

```bash
# Development
npm run start:dev          # Start with hot reload
npm run build              # Build project
npm run lint               # Lint code
npm run format             # Format code

# Testing
npm run test               # Run unit tests
npm run test:cov           # Test with coverage
npm run test:e2e           # Run E2E tests

# Production
npm run build              # Build
npm run start:prod         # Run built app
```

---

## File Organization Best Practices

```
✗ BAD:                         ✓ GOOD:
src/                          src/
├── service.ts                ├── modules/
├── controller.ts             │  ├── products/
├── schema.ts                 │  │  ├── products.module.ts
├── dto.ts                    │  │  ├── products.service.ts
├── guard.ts                  │  │  ├── products.controller.ts
└── main.ts                   │  │  └── dto/
                              │  └── cart/
Everything mixed up!         │     ├── cart.module.ts
                              │     ├── cart.service.ts
                              │     └── cart.controller.ts
                              ├── common/
                              │  ├── schemas/
                              │  ├── dto/
                              │  └── guards/
                              ├── app.module.ts
                              └── main.ts
                              
                              Organized by features!
```

---

## Mongoose vs SQL Concepts

```
MongoDB Term          SQL Term              NestJS
─────────────────────────────────────────────────────
Collection           Table                 @Schema
Document             Row                   Instance
Field                Column                @Prop
_id                  PRIMARY KEY           Automatic
Reference            FOREIGN KEY           { ref: 'Model' }
Array                JSON Array            { type: [SubSchema] }
```

---

This quick reference covers most common NestJS patterns. Use this alongside CODE_WALKTHROUGH.md for detailed explanations!
