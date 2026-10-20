<?php

class UsersController extends Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->call->model('UsersModel');
    }

    public function index()
    {
        $users = $this->UsersModel->all();

        $data['users'] = $users;

        $this->call->view('users', $data);
    }
}