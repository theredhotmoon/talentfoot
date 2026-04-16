<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0f0e17;
            color: #f0ecf9;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            background-color: rgba(30, 27, 46, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            margin-top: 40px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: 800;
            background: linear-gradient(135deg, #6ee7b7, #06b6d4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .content {
            font-size: 16px;
            color: #a09bb5;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #6ee7b7, #06b6d4);
            color: #0f0e17;
            font-weight: 600;
            padding: 12px 28px;
            border-radius: 9999px;
            text-decoration: none;
            transition: all 0.2s ease;
        }
        .btn:hover {
            box-shadow: 0 0 24px rgba(110, 231, 183, 0.35);
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #6b6581;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">TalentFoot</div>
        </div>
        <div class="content">
            <p>Hello{{ isset($user) ? ' ' . $user->name : '' }},</p>
            <p>You are receiving this email because we received a password reset request for your account.</p>
            <div class="button-container">
                <a href="{{ $resetUrl }}" class="btn">Reset Password</a>
            </div>
            <p>This password reset link will expire in {{ \App\Models\Setting::get('password_reset_token_lifetime', 60) }} minutes.</p>
            <p>If you did not request a password reset, no further action is required.</p>
            <p style="margin-top:20px; font-size:14px;">If you're having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser:<br>
            <a href="{{ $resetUrl }}" style="color: #6ee7b7; word-break: break-all;">{{ $resetUrl }}</a></p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} TalentFoot. All rights reserved.
        </div>
    </div>
</body>
</html>
