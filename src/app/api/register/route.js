import bcrypt from "bcryptjs";
import User from "../../../../models/user";
import { NextResponse } from "next/server";
import connectMongoDb from "../../../../lib/mongodb";

export const POST = async (req) => {
    const { name, email, password } = await req.json();

    try {
        await connectMongoDb();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
        }

        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
        }

        const existing = await User.findOne({ email: email.trim().toLowerCase() });
        if (existing) {
            return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userObj = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
        };

        const created = await User.create(userObj);
        
        return NextResponse.json({ message: "user created successfully", userId: created._id }, { status: 201 });
    } catch (error) {
        console.error('Registration POST error:', error);
        const isProd = process.env.NODE_ENV === 'production';
        const message = isProd ? 'User registration failed' : (error?.message || 'User registration failed');
        return NextResponse.json({ error: message }, { status: 500 });
    }
};

export const GET = async (req) => {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    try {
        await connectMongoDb();

        const query = name ? { name: { $regex: name, $options: 'i' } } : {};
        const users = await User.find(query);
        
        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        console.error('Register GET error:', error);
        return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
    }
};