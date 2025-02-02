# 3rd Party API and CRUD Operations

- GitHub Repo can be found here: [https://github.com/bpyle02/sweng-861-week-3-3rd-party-api-and-crud-operations](https://github.com/bpyle02/sweng-861-week-3-3rd-party-api-and-crud-operations)

# Setting up the Environment

- The environment I am using is MERN (MongoDB, Express JS, React, and Node JS), however, I have added some extra goodies to make things a little easier
    - Vite — A usability tool to make building the frontend super easy
    - Tailwind CSS — A usability tool to make designing the UI super simple and easy
- To run this web app locally, clone the repository and run `npm i` in the frontend and backend folders
- After the frontend and backend are initialized, you can start up the backend by typing `npm start` in the terminal and the frontend by executing the `npm run dev` command
- You will then be able to access the website from [http://localhost:5173](http://localhost:5173). Right now, the website only has functionality to sign in, sign out, and edit your profile, but if you would like to see the fully built application, you can check out [https://christisking.info](https://christisking.info)
- You can also view the API documentation, built with Swagger UI, [http://localhost:3173/api-docs](http://localhost:3173/api-docs)

# 3rd Party API Implementation

- For the first requirement of using a 3rd party API, I decided to use [UI-Avatars](https://ui-avatars.com). This is a super simple and easy API library that allows new users, when the sign up on my website, to receive an auto-generated profile image with their initials on it and a random background color.
- The implementation of this application is very simple. In fact, it only requires one line of code inside the `server.post("/users")` route of the `server.js` file:
```javascript
    let profile_img = "https://ui-avatars.com/api/?name=" + fullname.replace(" ", "+") + "&background=random&size=384";
```
- In my application, the Users schema stores only the URL of the profile image. That makes this API super useful, because they provide a dead-simple approach to get a profile image based on the user's `fullname`. All I have to do is replace the spaces with '+' signs and boom, a custom profile image!

# CRUD Operations

- So far, for this website, I have developed 9 different API routes that correspond to the four CRUD operations
  - Create
    - `server.post("/users")` -- This api route is used to create new users (that use email and password) via the sign up page
    - `server.post("/google-auth")` -- This api route is used to create new users (that use Google Authentication) via the sign up/in pages
    - `server.post("/facebook-auth")` -- This api route is used to create new users (that use Facebook Authentication) via the sign up/in pages
  - Read
    - `server.get("/users/:username")` -- This api route returns a user object for the specified user without any sensitive information such as password, auth tokens, etc.
  - Update
    - `server.put("/users/:id")` -- This api route is used to update user data such as bio, username, or social media links (and profile images in the future will be modifiable as well)
    - `server.post("users/:id")` -- This api route is used to update the user's password
  - Delete
    - `server.delete("/users/:id")` -- This api route is used to delete the user 
- In order to provide a simple way to access full API documentation, I used a tool called Swagger UI, which can be accessed by running the application and navigating to [http://localhost:3173](http://localhost:3173/api-docs).
  - To implement Swagger UI on the server side, I used the code below
```javascript
    import swaggerUi from 'swagger-ui-express';

    const options = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'API Documentation',
                version: '1.0.0',
                description: 'API for managing user authentication and profile data',
            },
            servers: [
                {
                    url: `http://localhost:3173`,
                },
            ],
        },
        apis: ['./routes/book.js'],
    };
    const swaggerSpec = swaggerJsdoc(options);

    server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```
  - Swagger UI uses the `book.js` file found in `/backend/routes/book.js` to define the API routes and documentation. Here is an example of one route defined in this file:
```javascript
    /**
    * @swagger
    * /users:
    *   post:
    *     summary: Create a new user account with email and password
    *     description: Allows a new user to sign up with email and password.
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             type: object
    *             properties:
    *               fullname:
    *                 type: string
    *               email:
    *                 type: string
    *                 format: email
    *               password:
    *                 type: string
    *                 format: password
    *     responses:
    *       '200':
    *         description: User created successfully
    *         content:
    *           application/json:
    *             schema:
    *               type: object
    *               properties:
    *                 access_token:
    *                   type: string
    *                 profile_img:
    *                   type: string
    *                   format: url
    *                 username:
    *                   type: string
    *                 fullname:
    *                   type: string
    *                 isAdmin:
    *                   type: boolean
    *       '403':
    *         description: Validation error
    *       '500':
    *         description: Server error or email already exists
    */
```

# API Security
- Authorization Protection
  - In order to make sure only authorized users can access or modify data, only users with a valid authorization token can use the APIs
  - For example, the following axios `put` command to modify user data must have an `Authorization` header value. If there is no valid access token, then an error will be thrown and the user will not be able to modify any data. This is true for all API routes.
```javascript
    axios.put(
        import.meta.env.VITE_SERVER_DOMAIN + "/users/" + jwt_data.id,
        updateData, {
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
    })
```
- Rate Limiting
  - In addition to implementing API security measures, I have also implemented rate limiting to prevent malicious attackers from scraping data. This prevents people from abusing the APIs.
  - There are currently 2 different rate limits depending on the API route:
    - 100 requests per IP per 15 minutes -- this is the standard rate limit used for get requests like getting user data or editing user data
    - 5 requests per 30 minutes -- this is the standard rate limit used for user creation and deletion
  - The code to implement this is fairly straightforward and can be seen in full in the `server.js` file:
```javascript
    import rateLimit from 'express-rate-limit';

    const server = express();

    const standard_limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 1000ms in a second * 60 seconds in a minute * 15 = 15 minutes in milliseconds
        max: 100 // limit each IP to 100 requests per windowMs
    });
    const edit_account_limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    });
    const new_account_limiter = rateLimit({
        windowMs: 30 * 60 * 1000, // 30 minutes
        max: 5 // limit each IP to 5 requests per windowMs
    });
    const delete_account_limiter = rateLimit({
        windowMs: 30 * 60 * 1000, // 30 minutes
        max: 5 // limit each IP to 5 requests per windowMs
    });

    server.use(standard_limiter);
    server.use(edit_account_limiter);
    server.use(new_account_limiter);
    server.use(delete_account_limiter);
```