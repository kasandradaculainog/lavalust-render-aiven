<!DOCTYPE html>
<html>
<head>
    <title>Users</title>
</head>

<body>

<h1>Users List</h1>

<table border="1" cellpadding="10">
    <tr>
        <th>ID</th>
        <th>First Name</th>
        <th>Last Name</th>
        <th>Email</th>
        <th>Username</th>
    </tr>

    <?php foreach ($users as $user): ?>
        <tr>
            <td><?= $user->id ?></td>
            <td><?= $user->firstname ?></td>
            <td><?= $user->lastname ?></td>
            <td><?= $user->email ?></td>
            <td><?= $user->username ?></td>
        </tr>
    <?php endforeach; ?>

</table>

</body>
</html>