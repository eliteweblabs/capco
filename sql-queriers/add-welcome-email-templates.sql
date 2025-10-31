-- Add welcome email templates to globalOptions table
-- These templates are used when creating new users

-- Insert welcome email template for clients
INSERT INTO globalOptions (key, value, description) VALUES 
('welcomeClientEmailContent', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #333; margin-bottom: 10px;">Welcome to CAPCO Design Group!</h1>
    <p style="color: #666; font-size: 16px;">Your account has been successfully created.</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin-top: 0;">Hello {{project.authorProfile.companyName}}!</h2>
    <p>Welcome to CAPCO Design Group! Your account has been successfully created and you can now access our fire protection project management system.</p>
  </div>
  
  <div style="background: #fff; border: 1px solid #e9ecef; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="color: #333; margin-top: 0;">Your Account Details:</h3>
    <ul style="color: #666; line-height: 1.6;">
      <li><strong>Email:</strong> {{project.authorProfile.email}}</li>
      <li><strong>Company:</strong> {{project.authorProfile.companyName}}</li>
      <li><strong>Phone:</strong> {{project.authorProfile.phone}}</li>
      <li><strong>Registration Date:</strong> {{REGISTRATION_DATE}}</li>
    </ul>
  </div>
  
  <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="color: #1976d2; margin-top: 0;">What You Can Do Now:</h3>
    <ul style="color: #666; line-height: 1.6;">
      <li>Submit fire protection project requests</li>
      <li>Track project status and progress in real-time</li>
      <li>Download completed documents and reports</li>
      <li>Communicate directly with our team</li>
      <li>Access your project dashboard</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{DASHBOARD_LINK}}" style="background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Access Your Dashboard</a>
  </div>
  
  <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
    <p style="color: #666; font-size: 14px; margin-bottom: 10px;">If you have any questions or need assistance, please don''t hesitate to contact our team.</p>
    <p style="color: #999; font-size: 12px;">© 2024 CAPCO Design Group. All rights reserved.</p>
  </div>
</div>', 
'Welcome email template for new client users') 
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Insert welcome email template for staff
INSERT INTO globalOptions (key, value, description) VALUES 
('welcomeStaffEmailContent', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #333; margin-bottom: 10px;">Welcome to the CAPCo Team!</h1>
    <p style="color: #666; font-size: 16px;">Your staff account has been successfully created.</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin-top: 0;">Hello {{project.authorProfile.firstName}} {{project.authorProfile.lastName}}!</h2>
    <p>Welcome to the CAPCO Design Group team! Your staff account has been successfully created and you now have access to our project management system.</p>
  </div>
  
  <div style="background: #fff; border: 1px solid #e9ecef; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="color: #333; margin-top: 0;">Your Account Details:</h3>
    <ul style="color: #666; line-height: 1.6;">
      <li><strong>Email:</strong> {{project.authorProfile.email}}</li>
      <li><strong>Name:</strong> {{project.authorProfile.firstName}} {{project.authorProfile.lastName}}</li>
      <li><strong>Company:</strong> {{project.authorProfile.companyName}}</li>
      <li><strong>Phone:</strong> {{project.authorProfile.phone}}</li>
      <li><strong>Role:</strong> Staff Member</li>
      <li><strong>Registration Date:</strong> {{REGISTRATION_DATE}}</li>
    </ul>
  </div>
  
  <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="color: #2e7d32; margin-top: 0;">Staff Access Features:</h3>
    <ul style="color: #666; line-height: 1.6;">
      <li>Manage client projects and assignments</li>
      <li>Update project status and progress</li>
      <li>Communicate with clients and team members</li>
      <li>Access project files and documents</li>
      <li>View project analytics and reports</li>
      <li>Manage user accounts and permissions</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{DASHBOARD_LINK}}" style="background: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Access Staff Dashboard</a>
  </div>
  
  <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
    <p style="color: #666; font-size: 14px; margin-bottom: 10px;">If you have any questions about your account or need training materials, please contact your supervisor.</p>
    <p style="color: #999; font-size: 12px;">© 2024 CAPCO Design Group. All rights reserved.</p>
  </div>
</div>', 
'Welcome email template for new staff users') 
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Verify the templates were added
SELECT key, description, created_at FROM globalOptions 
WHERE key IN ('welcomeClientEmailContent', 'welcomeStaffEmailContent')
ORDER BY key;
