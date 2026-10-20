<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class ProductApiController extends Controller
{
    public function __construct()
    {
        parent::__construct();

        // Connect to database
        $this->call->database();

        // Load API library
        $this->call->library('api');
    }

    // GET /api/products
    public function index()
    {
        // Require valid JWT token
        $this->api->require_jwt();

        $products = $this->db
            ->table('products')
            ->get_all();

        $this->api->respond([
            'status' => true,
            'data' => $products
        ]);
    }

    // POST /api/products
    public function store()
    {
        // Require valid JWT token
        $this->api->require_jwt();

        $data = $this->api->body();

        $product_name = trim($data['product_name'] ?? '');
        $description = trim($data['description'] ?? '');
        $price = $data['price'] ?? null;
        $quantity = $data['quantity'] ?? null;

        if (
            $product_name === '' ||
            $price === null ||
            $quantity === null
        ) {
            $this->api->respond_error(
                'Product name, price, and quantity are required.',
                422
            );
        }

        $insert_id = $this->db
            ->table('products')
            ->insert([
                'product_name' => $product_name,
                'description' => $description,
                'price' => $price,
                'quantity' => $quantity,
                'created_at' => date('Y-m-d H:i:s')
            ]);

        if ($insert_id) {
            $this->api->respond([
                'status' => true,
                'message' => 'Product added successfully.',
                'id' => $insert_id
            ], 201);
        }

        $this->api->respond_error(
            'Failed to add product.',
            500
        );
    }

    // PUT /api/products/{id}
    public function update($id)
    {
        // Require valid JWT token
        $this->api->require_jwt();

        $data = $this->api->body();

        $product_name = trim($data['product_name'] ?? '');
        $description = trim($data['description'] ?? '');
        $price = $data['price'] ?? null;
        $quantity = $data['quantity'] ?? null;

        if (
            $product_name === '' ||
            $price === null ||
            $quantity === null
        ) {
            $this->api->respond_error(
                'Product name, price, and quantity are required.',
                422
            );
        }

        $updated = $this->db
            ->table('products')
            ->where('id', $id)
            ->update([
                'product_name' => $product_name,
                'description' => $description,
                'price' => $price,
                'quantity' => $quantity
            ]);

        if ($updated) {
            $this->api->respond([
                'status' => true,
                'message' => 'Product updated successfully.'
            ]);
        }

        $this->api->respond_error(
            'Failed to update product.',
            500
        );
    }

    // DELETE /api/products/{id}
    public function delete($id)
    {
        // Require valid JWT token
        $this->api->require_jwt();

        $deleted = $this->db
            ->table('products')
            ->where('id', $id)
            ->delete();

        if ($deleted) {
            $this->api->respond([
                'status' => true,
                'message' => 'Product deleted successfully.'
            ]);
        }

        $this->api->respond_error(
            'Failed to delete product.',
            500
        );
    }
}