/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Create a new user account
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

/**
 * @swagger
 * /signin:
 *   post:
 *     summary: Log in using email and password
 *     description: Authenticate a user with email and password credentials.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       '200':
 *         description: Successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserLoginResponse'
 *       '403':
 *         description: Login failed due to incorrect credentials or other issues
 *       '500':
 *         description: Server error
 */

/**
 * @swagger
 * /google-auth:
 *   post:
 *     summary: Authenticate with Google
 *     description: Authenticate a user using Google's access token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               access_token:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Successfully authenticated with Google
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserLoginResponse'
 *       '403':
 *         description: Authentication failed or user not found
 *       '500':
 *         description: Server error
 */

/**
 * @swagger
 * /facebook-auth:
 *   post:
 *     summary: Authenticate with Facebook
 *     description: Authenticate a user using a Facebook access token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               access_token:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Successfully authenticated with Facebook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserLoginResponse'
 *       '403':
 *         description: Authentication failed or user not found
 *       '500':
 *         description: Server error
 */

/**
 * @swagger
 * /change-password:
 *   post:
 *     summary: Change user's password
 *     description: Requires JWT authentication to change the password.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       '200':
 *         description: Password changed successfully
 *       '403':
 *         description: Unauthorized or incorrect current password
 *       '500':
 *         description: Server error
 */

/**
 * @swagger
 * /get-profile:
 *   post:
 *     summary: Retrieve user profile
 *     description: Get user profile by username
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fullname:
 *                   type: string
 *                 email:
 *                   type: string
 *                 username:
 *                  type: string
 *                 bio:
 *                    type: string
 *                 profile_img:
 *                    type: string
 *                 social_links:
 *                   type: object
 *                   properties:
 *                     youtube:
 *                       type: string
 *                     instagram:
 *                       type: string
 *                     facebook:
 *                       type: string
 *                     twitter:
 *                       type: string
 *                     github:
 *                       type: string
 *                     website:
 *                       type: string
 *                 account_info:
 *                   type: object
 *                   properties:
 *                     total_posts:
 *                       type: number
 *                     total_reads:
 *                       type: number
 *       '500':
 *         description: Server error
 */

/**
 * @swagger
 * /update-profile-img:
 *   post:
 *     summary: Update user profile image
 *     description: Update the profile image URL for authenticated users.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       '200':
 *         description: Profile image updated successfully
 *       '500':
 *         description: Server error
 */

/**
 * @swagger
 * /update-profile:
 *   post:
 *     summary: Update user profile information
 *     description: Update username, bio, and social links for authenticated users.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               bio:
 *                 type: string
 *               social_links:
 *                 type: object
 *     responses:
 *       '200':
 *         description: Profile updated successfully
 *       '403':
 *         description: Validation error
 *       '409':
 *         description: Username conflict
 *       '500':
 *         description: Server error
 */

/**
 * @swagger
 * /delete-user:
 *   delete:
 *     summary: Delete user account
 *     description: Delete the account of the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       '200':
 *         description: User account deleted successfully
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - personal_info
 *       properties:
 *         personal_info:
 *           type: object
 *           properties:
 *             fullname:
 *               type: string
 *               example: "john doe"
 *               minLength: 3
 *               description: User's full name in lowercase
 *             email:
 *               type: string
 *               format: email
 *               example: "john@example.com"
 *               description: User's email address
 *             password:
 *               type: string
 *               description: User's password (hashed in database)
 *             username:
 *               type: string
 *               example: "johndoe"
 *               minLength: 3
 *               description: User's unique username
 *             bio:
 *               type: string
 *               example: "Aspiring developer and coffee lover"
 *               maxLength: 200
 *               description: User's short biography
 *             profile_img:
 *               type: string
 *               format: uri
 *               example: "https://cloud.brandonpyle.com/s/JySYcKTSp8tLfCQ/download/default_profile.png"
 *               description: URL to user's profile image
 *         admin:
 *           type: boolean
 *           example: false
 *           description: Indicates if the user is an admin
 *         social_links:
 *           type: object
 *           properties:
 *             youtube:
 *               type: string
 *               example: "https://www.youtube.com/channel/abcdef"
 *             instagram:
 *               type: string
 *               example: "https://www.instagram.com/johndoe"
 *             facebook:
 *               type: string
 *               example: "https://www.facebook.com/johndoe"
 *             twitter:
 *               type: string
 *               example: "https://twitter.com/johndoe"
 *             github:
 *               type: string
 *               example: "https://github.com/johndoe"
 *             website:
 *               type: string
 *               example: "https://johndoe.com"
 *         account_info:
 *           type: object
 *           properties:
 *             total_posts:
 *               type: number
 *               example: 0
 *               description: Total number of posts by the user
 *             total_reads:
 *               type: number
 *               example: 0
 *               description: Total number of reads for user's posts
 *         google_auth:
 *           type: boolean
 *           example: false
 *           description: Indicates if user authenticated via Google
 *         facebook_auth:
 *           type: boolean
 *           example: false
 *           description: Indicates if user authenticated via Facebook
 *         posts:
 *           type: array
 *           items:
 *             type: string
 *             format: ObjectId
 *           example: ["507f191e810c19729de860ea"]
 *           description: Array of post IDs linked to the user
 *       example:
 *         personal_info:
 *           fullname: "john doe"
 *           email: "john@example.com"
 *           password: "hashedpassword"
 *           username: "johndoe"
 *           bio: "Aspiring developer and coffee lover"
 *           profile_img: "https://cloud.brandonpyle.com/s/JySYcKTSp8tLfCQ/download/default_profile.png"
 *         admin: false
 *         social_links:
 *           youtube: "https://www.youtube.com/channel/abcdef"
 *           instagram: "https://www.instagram.com/johndoe"
 *         account_info:
 *           total_posts: 0
 *           total_reads: 0
 *         google_auth: false
 *         facebook_auth: false
 *         posts: ["507f191e810c19729de860ea"]
 */

/**
 * @swagger
 * securityDefinitions:
 *   bearerAuth:
 *     type: apiKey
 *     name: Authorization
 *     in: header
 *     scheme: bearer
 *     bearerFormat: JWT
 */