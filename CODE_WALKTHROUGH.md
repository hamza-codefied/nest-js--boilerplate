# NestJS Implementation - Code Walkthrough

Detailed code explanations for each part of the ecommerce application.

---

## 1. Schemas (Database Models)

### User Schema
**File:** `src/common/schemas/user.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;
// ↑ Combines User interface with Mongoose Document type

@Schema()  // Tell Mongoose this is a database schema
export class User {
  @Prop({ required: true, unique: true })
  // required: true - email is mandatory
  // unique: true - no two users can have same email
  email: string;

  @Prop({ required: true })
  password: string;
  // Password is always hashed before storing

  @Prop({ required: true })
  name: string;

  @Prop({ default: Date.now })
  // auto-sets to current time if not provided
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

**Database Entry Example:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "password": "$2b$10$hashed....",
  "name": "John Doe",
  "createdAt": "2024-04-10T10:30:00Z"
}
```

---

### Product Schema
**File:** `src/common/schemas/product.schema.ts`

```typescript
@Schema()
export class Product {
  @Prop({ required: true })
  name: string;
  // Product name (e.g., "iPhone 15")

  @Prop({ required: true })
  description: string;
  // Product description/details

  @Prop({ required: true, type: Number })
  price: number;
  // Always specify type: Number for prices

  @Prop()
  imageUrl?: string;
  // Optional image URL (? means optional)

  @Prop({ default: Date.now })
  createdAt: Date;
}
```

---

### Cart Schema
**File:** `src/common/schemas/cart.schema.ts`

```typescript
@Schema()
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  // type: Types.ObjectId - Reference to Product collection
  // ref: 'Product' - Which model to reference
  product: Types.ObjectId;

  @Prop({ required: true, type: Number, min: 1 })
  // min: 1 - Quantity cannot be 0 or negative
  quantity: number;
}

@Schema()
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  // unique: true - Each user can have only ONE cart
  user: Types.ObjectId;

  @Prop({ type: [CartItem], default: [] })
  // type: [CartItem] - Array of CartItems
  items: CartItem[];

  @Prop({ default: Date.now })
  updatedAt: Date;
}
```

**Database Entry Example:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "user": "507f1f77bcf86cd799439011",
  "items": [
    {
      "product": "507f1f77bcf86cd799439020",
      "quantity": 2
    },
    {
      "product": "507f1f77bcf86cd799439021",
      "quantity": 1
    }
  ],
  "updatedAt": "2024-04-10T10:30:00Z"
}
```

---

## 2. DTOs (Data Validation)

### Auth DTO
**File:** `src/common/dto/auth.dto.ts`

```typescript
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// SIGNUP VALIDATION
export class SignupDto {
  @IsEmail()
  // Validates email format (e.g., user@example.com)
  // Rejects: plaintext, user@, @example.com
  email: string;

  @IsString()
  // Must be text, not number or object
  @IsNotEmpty()
  // Cannot be empty string
  name: string;

  @IsString()
  @MinLength(6)
  // Password must be at least 6 characters
  password: string;
}

// LOGIN VALIDATION
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
```

**How it works:**
```typescript
@Post('signup')
async signup(@Body() signupDto: SignupDto) {
  // Before reaching this method, @Body() validates input
  // If validation fails, returns 400 Bad Request automatically
  return this.authService.signup(signupDto);
}
```

**Example Invalid Request:**
```json
POST /auth/signup
{
  "email": "not-an-email",
  "name": "John",
  "password": "123"
}
```

**Response:**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

---

### Product DTO
**File:** `src/common/dto/product.dto.ts`

```typescript
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

// CREATE PRODUCT
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  // Price cannot be negative
  price: number;

  @IsString()
  @IsOptional()
  // Optional field (can be omitted)
  imageUrl?: string;
}

// UPDATE PRODUCT (all fields optional)
export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
```

---

### Cart DTO
**File:** `src/common/dto/cart.dto.ts`

```typescript
import { IsMongoId, IsNumber, Min } from 'class-validator';

export class AddToCartDto {
  @IsMongoId()
  // Validates it's a valid MongoDB ObjectId format
  productId: string;

  @IsNumber()
  @Min(1)
  // Quantity minimum is 1 (not 0 or negative)
  quantity: number;
}

export class UpdateCartItemDto {
  @IsNumber()
  @Min(1)
  quantity: number;
}
```

---

## 3. Services (Business Logic)

### Auth Service
**File:** `src/modules/auth/auth.service.ts`

```typescript
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    // ↑ Mongoose model for User collection
    private jwtService: JwtService,
    // ↑ Service to sign/verify JWT tokens
  ) {}

  // SIGNUP LOGIC
  async signup(signupDto: SignupDto): Promise<{ access_token: string }> {
    const { email, password, name } = signupDto;

    // Step 1: Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    //                     ↑ MongoDB query: find user by email
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
      // ↑ Return 401 status with this message
    }

    // Step 2: Hash password (NEVER store plain passwords!)
    const hashedPassword = await bcrypt.hash(password, 10);
    //                                        ↑ 10 = salt rounds
    // Example: "password123" becomes:
    // "$2b$10$N9qo8uLOickgx2ZMRZoMymB.T3HnPsxaVvCB8MTJW0H9AH6JdOHCi"

    // Step 3: Create new user document
    const user = new this.userModel({ email, password: hashedPassword, name });
    await user.save();
    // ↑ Insert into MongoDB

    // Step 4: Generate JWT token
    const payload = { 
      email: user.email, 
      sub: user._id  // "sub" = subject (user ID)
    };
    return {
      access_token: this.jwtService.sign(payload)
      // ↑ Encodes payload and signs with JWT_SECRET
    };
  }

  // LOGIN LOGIC
  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const { email, password } = loginDto;

    // Step 1: Find user by email
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Step 2: Compare submitted password with hashed password in DB
    const isPasswordValid = await bcrypt.compare(password, user.password);
    //                                ↑ Decrypts and compares
    // Returns: true if "password123" matches the hash
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Step 3: Generate token (same as signup)
    const payload = { email: user.email, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
```

---

### Products Service
**File:** `src/modules/products/products.service.ts`

```typescript
@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>
  ) {}

  // CREATE
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = new this.productModel(createProductDto);
    // ↑ Create new document (not yet in DB)
    return product.save();
    // ↑ Save to MongoDB and return created document
  }

  // READ ALL
  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
    // find() = get all documents
    // .exec() = execute query (returns Promise)
  }

  // READ ONE
  async findOne(id: string): Promise<Product | null> {
    return this.productModel.findById(id).exec();
    // findById() = find by MongoDB _id field
    // Returns null if not found
  }

  // UPDATE
  async update(
    id: string, 
    updateProductDto: UpdateProductDto
  ): Promise<Product | null> {
    return this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      //                              ↑ { new: true } returns updated document
      // Without it, returns old document before update
      .exec();
  }

  // DELETE
  async remove(id: string): Promise<Product | null> {
    return this.productModel.findByIdAndDelete(id).exec();
    // Finds document and deletes it, returns deleted document
  }
}
```

---

### Cart Service
**File:** `src/modules/cart/cart.service.ts`

```typescript
@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  // GET CART
  async getCart(userId: string): Promise<Cart> {
    let cart = await this.cartModel
      .findOne({ user: userId })
      .populate('items.product')
      // ↑ Replace product ObjectId with actual product data
      .exec();

    if (!cart) {
      // Create empty cart if doesn't exist
      cart = new this.cartModel({ user: userId, items: [] });
      await cart.save();
    }
    return cart;
  }

  // ADD TO CART
  async addToCart(
    userId: string, 
    addToCartDto: AddToCartDto
  ): Promise<Cart> {
    const { productId, quantity } = addToCartDto;

    // Step 1: Verify product exists in database
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Step 2: Find or create cart for user
    let cart = await this.cartModel.findOne({ user: userId });
    if (!cart) {
      cart = new this.cartModel({ user: userId, items: [] });
    }

    // Step 3: Check if product already in cart
    const existingItem = cart.items.find(
      item => item.product.toString() === productId
    );

    if (existingItem) {
      // If exists, increase quantity
      existingItem.quantity += quantity;
    } else {
      // If new, add to items array
      cart.items.push({ 
        product: new Types.ObjectId(productId), 
        quantity 
      });
    }

    // Step 4: Save and return
    cart.updatedAt = new Date();
    return cart
      .save()
      .then(savedCart => savedCart.populate('items.product'));
      // ↑ Return with full product data filled in
  }

  // UPDATE QUANTITY
  async updateCartItem(
    userId: string, 
    productId: string, 
    updateDto: UpdateCartItemDto
  ): Promise<Cart> {
    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = cart.items.find(
      item => item.product.toString() === productId
    );
    if (!item) {
      throw new NotFoundException('Item not in cart');
    }

    item.quantity = updateDto.quantity;
    cart.updatedAt = new Date();
    return cart.save()
      .then(savedCart => savedCart.populate('items.product'));
  }

  // REMOVE FROM CART
  async removeFromCart(userId: string, productId: string): Promise<Cart> {
    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Filter out the item with matching productId
    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );
    
    cart.updatedAt = new Date();
    return cart.save()
      .then(savedCart => savedCart.populate('items.product'));
  }

  // CLEAR CART
  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    cart.items = [];  // Empty array
    cart.updatedAt = new Date();
    return cart.save();
  }
}
```

---

## 4. Controllers (Route Handlers)

### Auth Controller
**File:** `src/modules/auth/auth.controller.ts`

```typescript
@Controller('auth')
// ↑ All routes in this controller start with /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  // ↑ Route: POST /auth/signup
  async signup(@Body() signupDto: SignupDto) {
    // @Body() extracts JSON body and validates with SignupDto
    return this.authService.signup(signupDto);
  }

  @Post('login')
  // ↑ Route: POST /auth/login
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
```

**Usage Example:**
```
Frontend sends:
  POST http://localhost:3000/auth/signup
  Content-Type: application/json
  
  {
    "email": "john@example.com",
    "name": "John Doe",
    "password": "password123"
  }

Backend responds:
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR..."
  }
```

---

### Products Controller
**File:** `src/modules/products/products.controller.ts`

```typescript
@Controller('products')
// All routes start with /products
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // CREATE: POST /products
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    // @Body() validates with CreateProductDto
    return this.productsService.create(createProductDto);
  }

  // READ ALL: GET /products
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // READ ONE: GET /products/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    // @Param('id') extracts URL parameter
    return this.productsService.findOne(id);
  }

  // UPDATE: PATCH /products/:id
  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updateProductDto: UpdateProductDto
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  // DELETE: DELETE /products/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
```

---

### Cart Controller
**File:** `src/modules/cart/cart.controller.ts`

```typescript
@Controller('cart')
@UseGuards(JwtAuthGuard)
// ↑ ALL routes require authentication
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // GET CART: GET /cart
  @Get()
  getCart(@Request() req) {
    // @Request() gives access to Express request object
    // req.user added by JwtAuthGuard (from JWT token)
    // Contains: { userId, email }
    return this.cartService.getCart(req.user.userId);
  }

  // ADD TO CART: POST /cart/add
  @Post('add')
  addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(req.user.userId, addToCartDto);
  }

  // UPDATE ITEM: PATCH /cart/item/:productId
  @Patch('item/:productId')
  updateCartItem(
    @Request() req, 
    @Param('productId') productId: string, 
    @Body() updateDto: UpdateCartItemDto
  ) {
    return this.cartService.updateCartItem(
      req.user.userId, 
      productId, 
      updateDto
    );
  }

  // REMOVE ITEM: DELETE /cart/item/:productId
  @Delete('item/:productId')
  removeFromCart(@Request() req, @Param('productId') productId: string) {
    return this.cartService.removeFromCart(req.user.userId, productId);
  }

  // CLEAR CART: DELETE /cart
  @Delete()
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.userId);
  }
}
```

---

## 5. Modules (Feature Organization)

### Auth Module
**File:** `src/modules/auth/auth.module.ts`

```typescript
@Module({
  imports: [
    ConfigModule,
    // ↑ Access environment variables

    PassportModule,
    // ↑ Passport library for authentication strategies

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'defaultSecret',
        // ↑ Secret key for signing/verifying tokens
        signOptions: { expiresIn: '1h' },
        // ↑ Tokens expire after 1 hour
      }),
      inject: [ConfigService],
    }),

    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema }
    ]),
    // ↑ Register User model with MongoDB
  ],
  
  controllers: [AuthController],
  // ↑ Routes handled by AuthController

  providers: [AuthService, JwtStrategy],
  // ↑ Services and strategies in this module
  
  exports: [AuthService],
  // ↑ Export so other modules can use AuthService
})
export class AuthModule {}
```

---

### Products Module
**File:** `src/modules/products/products.module.ts`

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema }
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
```

---

### Cart Module
**File:** `src/modules/cart/cart.module.ts`

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Product.name, schema: ProductSchema }
      // ↑ Both needed: Cart for data, Product for validation
    ]),
  ],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
```

---

## 6. Root Module

### App Module
**File:** `src/app.module.ts`

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // ↑ Load environment variables globally
    // Can access in any service via ConfigService

    PassportModule.register({ defaultStrategy: 'jwt' }),
    // ↑ Default authentication strategy

    MongooseModule.forRoot(process.env.MONGO_URI!),
    // ↑ Connect to MongoDB
    // process.env.MONGO_URI! comes from .env file

    AuthModule,
    // ↑ Import feature modules
    UsersModule,
    ProductsModule,
    CartModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
```

---

## 7. JWT Strategy

### Jwt Strategy
**File:** `src/modules/auth/jwt.strategy.ts`

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // Extends Passport's JWT strategy

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // ↑ Extract token from: Authorization: Bearer <token>

      ignoreExpiration: false,
      // ↑ Don't allow expired tokens

      secretOrKey: configService.get<string>('JWT_SECRET') || 'defaultSecret',
      // ↑ Secret key to verify token signature
    });
  }

  async validate(payload: any) {
    // Called after token is verified
    // payload = contents of the JWT (email, sub, etc.)
    
    return { 
      userId: payload.sub, 
      email: payload.email 
    };
    // ↑ Returned object attached to req.user
  }
}
```

**How it works:**

```
Frontend sends:
  GET /cart
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR...

JwtStrategy.validate():
  1. Extract token from "Bearer ..." header
  2. Verify signature using JWT_SECRET
  3. Decode payload
  4. If valid, call validate(payload)
  5. Attach returned object to req.user

Controller receives:
  req.user = { userId: "507f...", email: "user@example.com" }
```

---

## 8. JWT Guard

### Jwt Auth Guard
**File:** `src/common/guards/jwt-auth.guard.ts`

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
// Extends built-in Passport JWT guard
// No additional logic needed - JWT strategy handles everything

// Usage:
// @UseGuards(JwtAuthGuard)
// Only authenticated users can access this route
```

---

## 9. Main Entry Point

### Main TS
**File:** `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // ↑ Create NestJS application instance from root module

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // ↑ Strip unknown properties from DTOs
      transform: true,
      // ↑ Transform strings to typed values
      // Example: "123" (string) → 123 (number)
    }),
  );
  // ↑ Apply validation globally to all requests

  await app.listen(process.env.PORT || 3000);
  // ↑ Start server on port from .env or 3000 as fallback
}

bootstrap();
```

---

## Complete Request Flow Example

### Example: User adds product to cart

```
1. FRONTEND sends request
   POST http://localhost:3000/cart/add
   Headers: Authorization: Bearer eyJhbGciOi...
   Body: { "productId": "507f...", "quantity": 2 }

2. EXPRESS receives request
   ↓

3. GLOBAL VALIDATION PIPE (@Body() validation)
   - Validates productId is valid MongoDB ID
   - Validates quantity >= 1
   - Transforms strings to proper types
   - If invalid → returns 400 Bad Request
   ↓

4. JWT AUTH GUARD (@UseGuards(JwtAuthGuard))
   - Extracts "Bearer ..." token from header
   - Verifies signature with JWT_SECRET
   - Calls JwtStrategy.validate(payload)
   - If invalid/expired → returns 401 Unauthorized
   - If valid → sets req.user = { userId, email }
   ↓

5. CART CONTROLLER METHOD
   @Post('add')
   addToCart(@Request() req, @Body() addToCartDto)
   {
     // req.user = { userId, email }
     // addToCartDto = { productId, quantity }
     return this.cartService.addToCart(req.user.userId, addToCartDto);
   }

6. CART SERVICE
   async addToCart(userId, addToCartDto) {
     - Verify product exists in MongoDB
     - Find user's cart (or create new)
     - Add/update item in cart
     - Save to MongoDB
     - Return full cart with populated products
   }

7. RESPONSE sent to FRONTEND
   Status: 201 Created
   {
     "_id": "507f...",
     "user": "507f...",
     "items": [
       {
         "product": {
           "_id": "507f...",
           "name": "iPhone 15",
           "price": 999,
           "description": "..."
         },
         "quantity": 2
       }
     ],
     "updatedAt": "2024-04-10T10:30:00Z"
   }
```

---

## Key Concepts Summary

| Concept | Purpose | Example |
|---------|---------|---------|
| **Module** | Organize features | AuthModule groups auth service/controller |
| **Controller** | HTTP routes | ProductsController handles GET /products |
| **Service** | Business logic | ProductsService queries MongoDB |
| **Schema** | Database model | User schema defines email, password fields |
| **DTO** | Validate input | SignupDto ensures email format is valid |
| **Guard** | Route protection | JwtAuthGuard requires authentication |
| **Decorator** | Metadata | @Post marks function as POST handler |
| **Dependency Injection** | Auto-wiring | Constructor automatically gets services |
| **Async/Await** | Database operations | async findAll() returns Promise<User[]> |

---

This code walkthrough shows exactly what each file does and why!
