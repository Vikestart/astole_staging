<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
    <title>Admin - Astole CMS</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
    <?php echo app('Illuminate\Foundation\Vite')(['resources/css/app.css', 'resources/js/admin.jsx']); ?>
</head>
<body>
    <div id="admin-root"></div>
</body>
</html>
<?php /**PATH /var/www/vhosts/astole.me/staging/resources/views/admin.blade.php ENDPATH**/ ?>