# NestJS Best Practices & Common Mistakes

Learn what to do and what to avoid when developing with NestJS.

---

## Best Practices

### 1. Module Organization

**✓ DO: Organize by Feature**
```
src/
├── modules/
│  ├── auth/
│  │  ├── auth.module.ts
│  │  ├── auth.service.ts
│  │  ├── auth.controller.ts
│  │  ├── jwt.strategy.ts
│  │  └── dto/
│  ├── products/
│  └── cart/
├── common/
│  ├── schemas/
│  ├── dto/
│  └── guards/
└── app.module.ts
```
**Why:** Clear logical separation, easy to maintain, scalable.

**✗ DON'T: Put everything in root**
```
src/
├── auth.service.ts
├── auth.controller.ts
├── products.service.ts
├── products.controller.ts
├── user.schema.ts
├── product.schema.ts
├── cart.schema.ts
└── main.ts
```
**Why:** Becomes messy, hard to find things, scales poorly.

---

### 2. Service Responsibility

**✓ DO: Keep Business Logic in Services**
```typescript
// auth.service.ts
@Injectable()
export class AuthService {
  async signup(signupDto: SignupDto) {
    // Business logic here
    const hashedPassword = await bcrypt.hash(signupDto.password, 10);
    const user = await this.userModel.create({...});
    return this.jwtService.sign({...});
  }
}

// auth.controller.ts
@Controller('auth')
export class AuthController {
  @Post('signup')
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
    // Just call service
  }
}
```

**✗ DON'T: Put Logic in Controllers**
```typescript
// BAD - Logic in controller
@Controller('auth')
export class AuthController {
  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    const hashedPassword = await bcrypt.hash(signupDto.password, 10);
    const user = await this.userModel.create({...});
    return this.jwtService.sign({...});
    // All logic here - hard to test, reuse, maintain
  }
}
```

---

### 3. Error Handling

**✓ DO: Use Specific Exceptions**
```typescript
// auth.service.ts
async login(loginDto: LoginDto) {
  const user = await this.userModel.findOne({ email: loginDto.email });
  
  if (!user) {
    throw new UnauthorizedException('Invalid email or password');
  }
  
  const isValid = await bcrypt.compare(loginDto.password, user.password);
  if (!isValid) {
    throw new UnauthorizedException('Invalid email or password');
  }
  
  return { access_token: this.jwtService.sign({...}) };
}
```

**✗ DON'T: Use Generic Errors**
```typescript
async login(loginDto: LoginDto) {
  try {
    // ...
  } catch (error) {
    throw new Error('Something went wrong');
    // Generic error - user can't understand what happened
  }
}
```

**✗ DON'T: Throw Errors with Wrong Status**
```typescript
if (!user) {
  throw new BadRequestException('User not found');
  // ✗ 400 Bad Request is wrong
  // ✓ Should be 404 Not Found or 401 Unauthorized
}
```

---

### 4. Data Validation

**✓ DO: Use DTOs for All Inputs**
```typescript
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;
}

@Controller('products')
export class ProductsController {
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    // DTO ensures data is valid
    return this.productsService.create(createProductDto);
  }
}
```

**✗ DON'T: Skip Validation**
```typescript
@Post()
create(@Body() data: any) {
  // ✗ No validation - data could be anything
  return this.productsService.create(data);
}
```

**✗ DON'T: Validate in Service**
```typescript
// auth.service.ts
async signup(data: any) {
  // ✗ Validation in service - should be in DTO
  if (!data.email || !data.email.includes('@')) {
    throw new Error('Invalid email');
  }
}
```

---

### 5. Dependency Injection

**✓ DO: Inject Dependencies**
```typescript
@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}
  
  async addToCart(userId: string, productId: string) {
    // Use injected models
  }
}
```

**✗ DON'T: Import and Create Manually**
```typescript
@Injectable()
export class CartService {
  private cartModel = require('./cart.model');  // ✗ Manual import
  
  async addToCart(userId: string, productId: string) {
    // Hard to test, not managed by NestJS
  }
}
```

---

### 6. Async Operations

**✓ DO: Use Async/Await**
```typescript
async findAll(): Promise<Product[]> {
  return await this.productModel.find().exec();
  // Clear and readable
}

async getCart(userId: string): Promise<Cart | null> {
  return await this.cartModel.findOne({ user: userId }).exec();
}
```

**✗ DON'T: Mix Promises**
```typescript
findAll(): Promise<Product[]> {
  return this.productModel.find().exec();  // ✗ No await
}
```

**✗ DON'T: Forget to Return Promises**
```typescript
async findAll() {
  this.productModel.find().exec();  // ✗ No await, no return
  // Function completes immediately
}
```

---

### 7. Type Safety

**✓ DO: Use TypeScript Types**
```typescript
@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) 
    private productModel: Model<ProductDocument>
  ) {}

  async findAll(): Promise<Product[]> {
    return await this.productModel.find().exec();
  }

  async findOne(id: string): Promise<Product | null> {
    return await this.productModel.findById(id).exec();
  }
}
```

**✗ DON'T: Use `any`**
```typescript
async findAll(): Promise<any[]> {  // ✗ any
  return await this.productModel.find().exec();
}

async findOne(id: any) {  // ✗ any
  return await this.productModel.findById(id).exec();
}
```

---

### 8. Avoid N+1 Queries

**✓ DO: Use Population**
```typescript
async getCart(userId: string): Promise<Cart> {
  // Single query with population
  return await this.cartModel
    .findOne({ user: userId })
    .populate('items.product')  // ← Populate in single query
    .exec();
}
```

**✗ DON'T: Query for Each Item**
```typescript
async getCart(userId: string): Promise<Cart> {
  const cart = await this.cartModel.findOne({ user: userId });
  
  // ✗ N+1 problem: One query per item
  for (const item of cart.items) {
    item.product = await this.productModel.findById(item.product);
  }
  
  return cart;
}
```

---

### 9. Environment Variables

**✓ DO: Use Environment Variables**
```
.env:
DATABASE_URL=mongodb://localhost:27017/mydb
JWT_SECRET=mysecretkey
PORT=3000

Code:
const dbUrl = this.configService.get<string>('DATABASE_URL');
const port = this.configService.get<number>('PORT');
```

**✗ DON'T: Hardcode Secrets**
```typescript
const dbUrl = 'mongodb://localhost:27017/mydb';  // ✗ Hardcoded!
const secret = 'mysecretkey';  // ✗ Visible in code!
```

**✗ DON'T: Push `.env` to Git**
```
✗ Add to git:
.env file visible in repository
Everyone can see passwords, API keys, etc.

✓ Make private:
# .gitignore
.env
```

---

### 10. Security

**✓ DO: Hash Passwords**
```typescript
async signup(signupDto: SignupDto) {
  const hashedPassword = await bcrypt.hash(signupDto.password, 10);
  // ↑ Always hash before storing
  
  await this.userModel.create({
    email: signupDto.email,
    password: hashedPassword,
    name: signupDto.name,
  });
}
```

**✗ DON'T: Store Plain Passwords**
```typescript
async signup(signupDto: SignupDto) {
  await this.userModel.create(signupDto);
  // ✗ Plain text password stored
  // If database is breached, passwords exposed
}
```

**✓ DO: Validate Input Thoroughly**
```typescript
export class UpdateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsNumber()
  @Min(0)
  @Max(1000000)
  price?: number;
}
```

**✗ DON'T: Accept Any Input**
```typescript
export class UpdateProductDto {
  name?: any;
  price?: any;
}
// ✗ No validation - attacker can inject anything
```

---

## Common Mistakes

### Mistake 1: Circular Dependencies

**✗ Problem:**
```typescript
// user.service.ts
@Injectable()
export class UserService {
  constructor(private cartService: CartService) {}
}

// cart.service.ts
@Injectable()
export class CartService {
  constructor(private userService: UserService) {}
}
// ✗ Each depends on other - causes infinite loop
```

**Solution: Use Modules for Organization**
```typescript
// Share through module exports
@Module({
  providers: [CartService],
  exports: [CartService],  // Export for other modules
})
export class CartModule {}

@Module({
  imports: [CartModule],  // Import shared service
  providers: [UserService],
})
export class UserModule {}
```

---

### Mistake 2: Async/Await Errors

**✗ Forgetting Async**
```typescript
@Get()
findAll() {  // ✗ Missing async
  return this.productModel.find().exec();
  // Returns Promise immediately without waiting
}
```

**✓ Fix:**
```typescript
@Get()
async findAll() {  // ✓ async
  return await this.productModel.find().exec();  // Wait for result
}
```

**✗ Forgetting Await**
```typescript
async addToCart(userId: string, productId: string) {
  const product = this.productModel.findById(productId);  // ✗ No await
  if (!product) {  // product is always falsy (Promise)
    throw new Error('Not found');
  }
}
```

**✓ Fix:**
```typescript
async addToCart(userId: string, productId: string) {
  const product = await this.productModel.findById(productId);  // ✓ await
  if (!product) {
    throw new Error('Not found');
  }
}
```

---

### Mistake 3: Wrong Guard Usage

**✗ Guard on Module (Applies to Nothing)**
```typescript
@UseGuards(JwtAuthGuard)  // ✗ Wrong level
@Module({
  controllers: [CartController],
})
export class CartModule {}
```

**✓ Guard on Controller**
```typescript
@Controller('cart')
@UseGuards(JwtAuthGuard)  // ✓ Protects all routes
export class CartController {}
```

**✓ Guard on Route**
```typescript
@Controller('cart')
export class CartController {
  @Get()
  @UseGuards(JwtAuthGuard)  // ✓ Protects only this route
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.userId);
  }
}
```

---

### Mistake 4: Wrong HTTP Status

**✗ Wrong Statuses**
```typescript
@Post('product')
async create(@Body() createDto: CreateProductDto) {
  return this.service.create(createDto);
  // ✗ Returns 200 OK
  // ✓ Should return 201 Created
}

@Delete(':id')
async remove(@Param('id') id: string) {
  return this.service.remove(id);
  // ✗ Returns 200 OK
  // ✓ Should return 204 No Content (or 200 OK is acceptable)
}
```

**✓ Correct Statuses**
```typescript
@Post('product')
async create(@Body() createDto: CreateProductDto) {
  const product = await this.service.create(createDto);
  return { statusCode: 201, data: product };
  // Or NestJS automatically returns 201 for POST
}

@Delete(':id')
async remove(@Param('id') id: string) {
  await this.service.remove(id);
  return { statusCode: 204, message: 'Deleted' };
}
```

---

### Mistake 5: Unhandled Exceptions

**✗ Program Crashes**
```typescript
@Get(':id')
async findOne(@Param('id') id: string) {
  return this.service.findOne(id);
  // If service throws error, API crashes
}
```

**✓ Handle Gracefully**
```typescript
@Get(':id')
async findOne(@Param('id') id: string) {
  try {
    return this.service.findOne(id);
  } catch (error) {
    throw new InternalServerErrorException('Database error');
  }
  // API stays running, returns error response
}
```

---

### Mistake 6: Missing Return Statement

**✗ Returns Undefined**
```typescript
@Post('product')
async create(@Body() createDto: CreateProductDto) {
  this.service.create(createDto);  // ✗ No return
  // Returns undefined to client
}
```

**✓ Return Result**
```typescript
@Post('product')
async create(@Body() createDto: CreateProductDto) {
  return await this.service.create(createDto);  // ✓ Return
}
```

---

### Mistake 7: Modifying Request/Response Incorrectly

**✗ Wrong Way**
```typescript
@Get('profile')
getProfile(@Response() res: Express.Response, @Request() req) {
  res.json({ user: req.user });  // ✗ Manual response
}
```

**✓ Right Way**
```typescript
@Get('profile')
getProfile(@Request() req) {
  return { user: req.user };  // ✓ NestJS handles response
}
```

---

### Mistake 8: Not Using Validation

**✗ No Validation**
```typescript
@Post()
create(@Body() data: any) {  // ✗ any type, no validation
  return this.service.create(data);
}

// Client sends: { name: 123, price: "not a number" }
// Accepted as-is, causes errors later
```

**✓ Full Validation**
```typescript
export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsNumber()
  @Min(0)
  price: number;
}

@Post()
create(@Body() createDto: CreateProductDto) {
  // ✓ Validated, type-safe data
  return this.service.create(createDto);
}

// Client sends: { name: 123, price: "not a number" }
// Rejected: 400 Bad Request with validation errors
```

---

### Mistake 9: Using String Instead of ObjectId

**✗ Type Mismatch**
```typescript
@Delete(':id')
async remove(@Param('id') id: string) {
  // ✗ id is string, but MongoDB expects ObjectId
  return this.service.remove(id);
}
```

**✓ Type Validation**
```typescript
export class RemoveProductDto {
  @IsMongoId()  // Validates ObjectId format
  id: string;
}

@Delete(':id')
async remove(@Param('id', new ParseObjectIdPipe()) id: string) {
  // ✓ Validates before calling service
  return this.service.remove(id);
}
```

---

### Mistake 10: Not Exporting Services from Modules

**✗ Can't Use in Other Modules**
```typescript
@Module({
  providers: [AuthService],
  // ✗ Not exported - other modules can't use
})
export class AuthModule {}

@Module({
  imports: [AuthModule],
  providers: [UserService],  // ✗ Can't inject AuthService
})
export class UserModule {}
```

**✓ Export Services**
```typescript
@Module({
  providers: [AuthService],
  exports: [AuthService],  // ✓ Available to other modules
})
export class AuthModule {}

@Module({
  imports: [AuthModule],
  providers: [UserService],
})
export class UserModule {
  constructor(private authService: AuthService) {}  // ✓ Works now
}
```

---

## Debugging Tips

### 1. Use Console Logging
```typescript
async addToCart(userId: string, productId: string) {
  console.log('[addToCart] userId:', userId, 'productId:', productId);
  
  const product = await this.productModel.findById(productId);
  console.log('[addToCart] product:', product);
  
  let cart = await this.cartModel.findOne({ user: userId });
  console.log('[addToCart] cart:', cart);
  
  // ... rest of logic
}
```

### 2. Check Environment Variables
```typescript
export class MyService {
  constructor(private config: ConfigService) {
    // Print what's loaded
    console.log('JWT_SECRET:', this.config.get('JWT_SECRET'));
    console.log('MONGO_URI:', this.config.get('MONGO_URI'));
  }
}
```

### 3. Test with Postman
- Send requests manually
- Check response headers, status codes
- Verify error messages

### 4. Check Network Tab
- Browser DevTools → Network
- See exact request/response
- Check for 401/403/500 errors

### 5. Enable Debug Mode
```bash
DEBUG=* npm run start:dev
# Shows detailed logs for everything
```

---

## Code Review Checklist

Before committing, check:

```
□ All functions async where needed
□ All async calls have await
□ DTOs validate all inputs
□ Services don't repeat logic
□ No circular dependencies
□ Error handling in place
□ Types are specific (not any)
□ Modules export shared services
□ Environment variables used for secrets
□ No hardcoded passwords/keys
□ Comments explain complex logic
□ No console.log() in production code
□ Database queries optimized (populate used)
□ Proper HTTP status codes
□ Guards protect sensitive routes
```

---

This guide helps you avoid common pitfalls and write professional NestJS code!
