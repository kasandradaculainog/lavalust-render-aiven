<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class AuthApiController extends Controller
{
    public function __construct()
    {
        parent::__construct();

        // Connect to database
        $this->call->database();

        // Load API library
        $this->call->library('api');
    }

    // POST /api/login
    public function login()
    {
        $this->api->require_method('POST');

        $input = $this->api->body();

        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';

        // Validate input
        if ($username === '' || $password === '') {
            $this->api->respond_error(
                'Username and password are required.',
                422
            );
        }

        // Find user in auth_users table
        $stmt = $this->db->raw(
            'SELECT id, username, password FROM auth_users WHERE username = ? LIMIT 1',
            [$username]
        );

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Check username and password
        if (!$user || !password_verify($password, $user['password'])) {
            $this->api->respond_error(
                'Invalid username or password.',
                401
            );
        }

        // Generate access token and refresh token
        $tokens = $this->api->issue_tokens([
            'id' => $user['id'],
            'role' => 'user'
        ]);

        // Return successful login response
        $this->api->respond([
            'status' => true,
            'message' => 'Login successful.',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username']
            ],
            'tokens' => $tokens
        ]);
    }

    // POST /api/logout
    public function logout()
    {
        $this->api->require_method('POST');

        $input = $this->api->body();

        $refresh_token = $input['refresh_token'] ?? '';

        if ($refresh_token === '') {
            $this->api->respond_error(
                'Refresh token is required.',
                422
            );
        }

        // Revoke refresh token
        $this->api->revoke_refresh_token($refresh_token);

        $this->api->respond([
            'status' => true,
            'message' => 'Logout successful.'
        ]);
    }
}