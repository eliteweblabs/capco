import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { checkAuth } from "../../lib/auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication and ensure user is Admin
    const { isAuth, role } = await checkAuth(cookies);
    
    if (!isAuth || role !== "Admin") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized. Admin access required." 
        }),
        { 
          status: 403,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const body = await request.json();
    const { name, email, phone, role: staffRole } = body;

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !staffRole?.trim()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Name, email, and role are required." 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid email format." 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Validate role
    if (!['Admin', 'Staff', 'Client'].includes(staffRole)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid role. Must be 'Admin', 'Staff', or 'Client'." 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Generate a temporary password
    const tempPassword = generateTempPassword();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: name.trim(),
        role: staffRole,
        created_by_admin: true,
        must_change_password: true
      }
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      
      // Handle specific error cases
      if (authError.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "A user with this email already exists." 
          }),
          { 
            status: 409,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to create user account. Please try again." 
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Create profile in profiles table
    const profileData = {
      id: authData.user.id,
      name: name.trim(),
      phone: phone?.trim() ? parseInt(phone.trim()) : null,
      role: staffRole,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([profileData]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      
      // Try to delete the auth user if profile creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error('Failed to cleanup auth user:', deleteError);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to create user profile. Please try again." 
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // TODO: Send invitation email with temporary password
    // For now, we'll return the temp password in the response (in a real app, this should be sent via email)
    console.log(`Temporary password for ${email}: ${tempPassword}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "User created successfully",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: name.trim(),
          role: staffRole
        },
        // TODO: Remove this in production - send via email instead
        tempPassword: tempPassword
      }),
      { 
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error('Create staff error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Internal server error. Please try again." 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

// Generate a secure temporary password
function generateTempPassword(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  // Ensure at least one character from each type
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Add 8 more random characters
  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
